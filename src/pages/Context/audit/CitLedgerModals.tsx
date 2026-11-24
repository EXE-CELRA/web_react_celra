import React from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Alert,
  Button,
  DatePicker,
  Select,
  type FormInstance,
} from 'antd';
import {
  FileExcelOutlined,
  CheckSquareOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { DollarSign, FileText } from 'lucide-react';
import type { ParsedCitData, RevenueRow, ExpenseRow } from '../../../utils/excelTaxTemplate';
import {
  type CitSummaryData,
  getQuarterDeadline,
  getQuarterReminderDate,
} from './audit.constants';

interface CitLedgerModalsProps {
  taxQuarter: number | 'ALL';
  taxYear: number;
  citSummary: CitSummaryData;
  dynamicYearOptions: Array<{ value: number; label: string }>;

  // Modal 1: Import Excel 2-sheet confirm
  isImportConfirmModalOpen: boolean;
  pendingImportData: ParsedCitData | null;
  duplicateRows: { revenues: RevenueRow[]; expenses: ExpenseRow[] } | null;
  onCloseImportConfirm: () => void;
  onConfirmOverwrite: () => void;
  onConfirmAppend: () => void;

  // Modal 2: Revenue CRUD
  revenueForm: FormInstance;
  isRevenueModalOpen: boolean;
  editingRevenueId: string | null;
  onCloseRevenueModal: () => void;
  onSaveRevenue: () => void;

  // Modal 3: Expense CRUD
  expenseForm: FormInstance;
  isExpenseModalOpen: boolean;
  editingExpenseId: string | null;
  onCloseExpenseModal: () => void;
  onSaveExpense: () => void;

  // Modal 4: Tax Checklist Creation
  isChecklistModalOpen: boolean;
  selectedChecklistQuarter: number | 'ALL';
  selectedChecklistYear: number;
  isCreatingChecklist: boolean;
  onChangeChecklistQuarter: (q: number | 'ALL') => void;
  onChangeChecklistYear: (y: number) => void;
  onCloseChecklistModal: () => void;
  onConfirmCreateChecklist: () => void;
}

export const CitLedgerModals: React.FC<CitLedgerModalsProps> = ({
  taxQuarter,
  taxYear,
  citSummary,
  dynamicYearOptions,
  isImportConfirmModalOpen,
  pendingImportData,
  duplicateRows,
  onCloseImportConfirm,
  onConfirmOverwrite,
  onConfirmAppend,
  revenueForm,
  isRevenueModalOpen,
  editingRevenueId,
  onCloseRevenueModal,
  onSaveRevenue,
  expenseForm,
  isExpenseModalOpen,
  editingExpenseId,
  onCloseExpenseModal,
  onSaveExpense,
  isChecklistModalOpen,
  selectedChecklistQuarter,
  selectedChecklistYear,
  isCreatingChecklist,
  onChangeChecklistQuarter,
  onChangeChecklistYear,
  onCloseChecklistModal,
  onConfirmCreateChecklist,
}) => {
  // Theo dõi Form chi phí để cảnh báo trực tiếp trong Modal khi vi phạm
  const expAmountWatch = Form.useWatch('amount', expenseForm);
  const expPaymentMethodWatch = Form.useWatch('paymentMethod', expenseForm);
  const expHasInvoiceWatch = Form.useWatch('hasInvoice', expenseForm);

  return (
    <>
      {/* ========================================================= */}
      {/* MODAL 1: XÁC NHẬN NẠP FILE EXCEL & CHẶN TRÙNG LẶP */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <FileExcelOutlined className="text-emerald-600 text-lg" />
            <span>Xác Nhận Nạp Dữ Liệu Từ File Excel</span>
          </div>
        }
        open={isImportConfirmModalOpen}
        onCancel={onCloseImportConfirm}
        footer={null}
        width={620}
        centered
        className="rounded-2xl"
      >
        {pendingImportData && (
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tệp tin đã chọn:</span>
                <span className="font-bold text-slate-800 font-mono">{pendingImportData.fileName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Dữ liệu bóc tách được:</span>
                <span className="font-bold text-teal-800">
                  {pendingImportData.revenues.length} khoản thu (
                  {pendingImportData.totalRawRevenue.toLocaleString('vi-VN')} đ)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí kế toán:</span>
                <span className="font-bold text-amber-800">
                  {pendingImportData.expenses.length} khoản chi (
                  {pendingImportData.totalRawExpense.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            {duplicateRows && (
              <Alert
                type="error"
                showIcon
                className="rounded-xl border border-rose-300 bg-rose-50 text-rose-900"
                message={
                  <span className="font-black text-xs">
                    🚫 ĐÃ CHẶN IMPORT: Phát hiện{' '}
                    {duplicateRows.revenues.length + duplicateRows.expenses.length} dòng dữ liệu bị
                    trùng lặp!
                  </span>
                }
                description={
                  <div className="space-y-2 text-[11px] mt-1">
                    <p className="m-0 leading-relaxed">
                      Để đảm bảo tính chính xác và không bị tính trùng chi phí hoặc doanh thu khi kê
                      khai thuế, hệ thống <strong>chặn hoàn toàn việc import nối tiếp</strong> khi
                      có bản ghi trùng với bảng hiện tại.
                    </p>
                    {duplicateRows.revenues.length > 0 && (
                      <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block">
                          Khoản thu bị trùng ({duplicateRows.revenues.length}):
                        </span>
                        <ul className="list-disc list-inside m-0 pl-1 text-[10px] space-y-0.5">
                          {duplicateRows.revenues.slice(0, 3).map((r, i) => (
                            <li key={i}>
                              {r.date} - {r.description || r.invoiceNo} -{' '}
                              {r.amount.toLocaleString('vi-VN')} đ
                            </li>
                          ))}
                          {duplicateRows.revenues.length > 3 && (
                            <li>...và {duplicateRows.revenues.length - 3} dòng khác</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {duplicateRows.expenses.length > 0 && (
                      <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block">
                          Khoản chi bị trùng ({duplicateRows.expenses.length}):
                        </span>
                        <ul className="list-disc list-inside m-0 pl-1 text-[10px] space-y-0.5">
                          {duplicateRows.expenses.slice(0, 3).map((e, i) => (
                            <li key={i}>
                              {e.date} - {e.category} - {e.amount.toLocaleString('vi-VN')} đ
                            </li>
                          ))}
                          {duplicateRows.expenses.length > 3 && (
                            <li>...và {duplicateRows.expenses.length - 3} dòng khác</li>
                          )}
                        </ul>
                      </div>
                    )}
                    <p className="m-0 text-slate-600 italic">
                      * Giải pháp: Hãy chọn <strong>"Xóa dữ liệu cũ &amp; Ghi đè"</strong> để nạp
                      mới toàn bộ, hoặc mở file Excel lọc bỏ các dòng trên rồi nạp lại.
                    </p>
                  </div>
                }
              />
            )}

            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block">
                Bạn muốn xử lý dữ liệu hiện có của Quý {taxQuarter} / Năm {taxYear} như thế nào?
              </span>
              <p className="m-0 text-[11px] text-slate-600">
                • <strong>Xóa dữ liệu cũ &amp; Ghi đè:</strong> Xóa toàn bộ số liệu của riêng Quý{' '}
                {taxQuarter}/{taxYear} và nạp 100% từ file Excel mới (các Quý khác vẫn được giữ
                nguyên an toàn).
                <br />• <strong>Giữ dữ liệu cũ &amp; Nối thêm mới:</strong> Kiểm tra nghiêm ngặt
                trùng lặp với Quý {taxQuarter}; nếu có bất kỳ dòng nào bị trùng sẽ bị chặn ngay lập
                tức.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                onClick={onCloseImportConfirm}
                className="rounded-xl text-xs font-semibold h-10 px-4 w-full sm:w-auto"
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                danger
                onClick={onConfirmOverwrite}
                className="rounded-xl text-xs font-bold h-10 px-4 w-full sm:w-auto shadow-xs"
              >
                Xóa dữ liệu cũ &amp; Ghi đè toàn bộ
              </Button>
              <Button
                type="primary"
                onClick={onConfirmAppend}
                className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-5 w-full sm:w-auto border-none shadow-xs"
              >
                Giữ dữ liệu cũ &amp; Nối thêm mới
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: THÊM / SỬA KHOẢN THU (DOANH THU) */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <DollarSign className="w-5 h-5 text-teal-600" />
            <span>
              {editingRevenueId !== null
                ? 'Chỉnh Sửa Khoản Thu Doanh Thu'
                : 'Thêm Mới Khoản Thu Doanh Thu'}
            </span>
          </div>
        }
        open={isRevenueModalOpen}
        onCancel={onCloseRevenueModal}
        onOk={onSaveRevenue}
        okText={editingRevenueId !== null ? 'Cập nhật' : 'Thêm vào bảng'}
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-teal-600 hover:bg-teal-700 border-none font-bold rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl font-semibold' }}
        centered
        width={500}
      >
        <Form form={revenueForm} layout="vertical" className="pt-3 space-y-1">
          <Form.Item
            name="date"
            label={<span className="text-xs font-bold text-slate-700">Ngày ghi nhận (DD/MM/YYYY)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn ngày ghi nhận' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày ghi nhận (DD/MM/YYYY)"
              className="w-full rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="invoiceNo"
            label={<span className="text-xs font-bold text-slate-700">Số hóa đơn (Nếu có)</span>}
          >
            <Input placeholder="Ví dụ: HD000128" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-bold text-slate-700">Diễn giải / Khách hàng</span>}
            rules={[{ required: true, message: 'Vui lòng nhập diễn giải khách hàng hoặc dịch vụ' }]}
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Cung cấp dịch vụ giải pháp chuyển đổi số cho Cty An Bình"
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label={<span className="text-xs font-bold text-slate-700">Doanh thu chưa thuế (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập số tiền doanh thu' }]}
          >
            <InputNumber<number>
              className="w-full rounded-xl"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0)}
              min={1000}
              step={1000000}
              placeholder="Nhập số tiền VNĐ"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: THÊM / SỬA KHOẢN CHI PHÍ & CẢNH BÁO RỦI RO THỜI GIAN THỰC */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>
              {editingExpenseId !== null
                ? 'Chỉnh Sửa Khoản Chi Phí Kế Toán'
                : 'Thêm Mới Khoản Chi Phí Kế Toán'}
            </span>
          </div>
        }
        open={isExpenseModalOpen}
        onCancel={onCloseExpenseModal}
        onOk={onSaveExpense}
        okText={editingExpenseId !== null ? 'Cập nhật' : 'Thêm vào bảng'}
        cancelText="Hủy"
        okButtonProps={{
          className: 'bg-amber-600 hover:bg-amber-700 border-none font-bold rounded-xl',
        }}
        cancelButtonProps={{ className: 'rounded-xl font-semibold' }}
        centered
        width={560}
      >
        <Form form={expenseForm} layout="vertical" className="pt-3 space-y-1">
          <Form.Item
            name="date"
            label={<span className="text-xs font-bold text-slate-700">Ngày chi (DD/MM/YYYY)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn ngày chi' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày chi (DD/MM/YYYY)"
              className="w-full rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label={<span className="text-xs font-bold text-slate-700">Khoản mục chi phí</span>}
            rules={[{ required: true, message: 'Vui lòng nhập khoản mục chi' }]}
          >
            <Input
              placeholder="Ví dụ: Mua máy tính văn phòng, Tiền thuê nhà, Chi phí quảng cáo..."
              className="rounded-xl"
            />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="paymentMethod"
              label={<span className="text-xs font-bold text-slate-700">Hình thức thanh toán</span>}
              rules={[{ required: true, message: 'Chọn hình thức thanh toán' }]}
            >
              <Radio.Group buttonStyle="solid" className="w-full flex">
                <Radio.Button value="Chuyển khoản" className="w-1/2 text-center text-xs font-semibold">
                  Chuyển khoản
                </Radio.Button>
                <Radio.Button value="Tiền mặt" className="w-1/2 text-center text-xs font-semibold">
                  Tiền mặt
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="hasInvoice"
              label={
                <span className="text-xs font-bold text-slate-700">Có hóa đơn GTGT / hợp pháp?</span>
              }
              rules={[{ required: true, message: 'Chọn trạng thái hóa đơn' }]}
            >
              <Radio.Group buttonStyle="solid" className="w-full flex">
                <Radio.Button value="Có" className="w-1/2 text-center text-xs font-semibold">
                  Có hóa đơn
                </Radio.Button>
                <Radio.Button value="Không" className="w-1/2 text-center text-xs font-semibold">
                  Không có
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>

          <Form.Item
            name="amount"
            label={<span className="text-xs font-bold text-slate-700">Số tiền chi phí (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập số tiền chi' }]}
          >
            <InputNumber<number>
              className="w-full rounded-xl"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0)}
              min={1000}
              step={1000000}
              placeholder="Nhập số tiền VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="note"
            label={<span className="text-xs font-bold text-slate-700">Ghi chú kèm theo (Nếu có)</span>}
          >
            <Input
              placeholder="Ví dụ: Mua tại Thế Giới Di Động, có ủy nhiệm chi ngân hàng..."
              className="rounded-xl"
            />
          </Form.Item>

          {/* ⚠️ CẢNH BÁO VI PHẠM TỨC THÌ TRONG MODAL */}
          {expPaymentMethodWatch === 'Tiền mặt' && (expAmountWatch || 0) >= 5000000 && (
            <Alert
              type="error"
              showIcon
              className="rounded-xl border border-rose-300 bg-rose-50/90 text-rose-900 mt-2"
              message={
                <span className="font-black text-xs">
                  ⚠️ CẢNH BÁO VI PHẠM MỤC B4 (Luật Thuế GTGT 48/2024/QH15 &amp; TT 96/2015/TT-BTC)
                </span>
              }
              description={
                <p className="text-[11px] leading-relaxed m-0 mt-0.5">
                  Hóa đơn từng lần từ <strong>5.000.000 VNĐ</strong> trở lên bắt buộc phải thanh toán
                  không dùng tiền mặt qua tài khoản ngân hàng của doanh nghiệp. Nếu thanh toán bằng
                  tiền mặt, toàn bộ khoản chi này sẽ <strong>BỊ LOẠI KHỎI CHI PHÍ ĐƯỢC TRỪ</strong>{' '}
                  (kê vào Mục B4 trên tờ khai 03/TNDN) và làm phát sinh thêm 20% tiền thuế!
                </p>
              }
            />
          )}

          {expHasInvoiceWatch === 'Không' && (
            <Alert
              type="warning"
              showIcon
              className="rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 mt-2"
              message={<span className="font-black text-xs">⚠️ RỦI RO KHÔNG CÓ HÓA ĐƠN HỢP PHÁP</span>}
              description={
                <p className="text-[11px] leading-relaxed m-0 mt-0.5">
                  Chi phí mua hàng hóa dịch vụ không có hóa đơn GTGT/hóa đơn bán hàng theo quy định
                  sẽ bị cơ quan thuế loại toàn bộ khi thanh tra quyết toán thuế.
                </p>
              }
            />
          )}
        </Form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: TẠO CHECKLIST HẠN NỘP THUẾ & BẬT NHẮC HẠN */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <CheckSquareOutlined className="text-emerald-600 text-lg" />
            <span className="font-extrabold text-sm sm:text-base">
              Khởi Tạo Checklist Hạn Nộp Thuế &amp; Bật Nhắc Hạn
            </span>
          </div>
        }
        open={isChecklistModalOpen}
        onCancel={onCloseChecklistModal}
        footer={null}
        width={560}
        destroyOnClose
        centered
        className="rounded-2xl overflow-hidden"
      >
        <div className="pt-3 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed">
            Hệ thống sẽ tạo bộ khung Checklist tuân thủ thuế TNDN cho năm tài chính, đồng bộ hạn nộp
            lên <strong>Lịch Tuân Thủ (Compliance Calendar)</strong> và tự động gửi thông báo chuông
            nhắc nhở trước <strong>7 ngày</strong> đến hạn nộp.
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700">Năm tài chính:</span>
              <Select
                value={selectedChecklistYear}
                onChange={onChangeChecklistYear}
                options={dynamicYearOptions}
                className="w-36 font-semibold"
                size="middle"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Chọn Quý cần tạo Checklist nộp thuế:
              </span>
              <Radio.Group
                value={selectedChecklistQuarter}
                onChange={(e) => onChangeChecklistQuarter(e.target.value)}
                className="w-full grid grid-cols-1 gap-2"
              >
                {[
                  {
                    q: 1 as const,
                    label: 'Quý 1',
                    deadline: `30/04/${selectedChecklistYear}`,
                    reminder: `23/04/${selectedChecklistYear}`,
                  },
                  {
                    q: 2 as const,
                    label: 'Quý 2',
                    deadline: `31/07/${selectedChecklistYear}`,
                    reminder: `24/07/${selectedChecklistYear}`,
                  },
                  {
                    q: 3 as const,
                    label: 'Quý 3',
                    deadline: `31/10/${selectedChecklistYear}`,
                    reminder: `24/10/${selectedChecklistYear}`,
                  },
                  {
                    q: 4 as const,
                    label: 'Quý 4',
                    deadline: `31/01/${selectedChecklistYear + 1}`,
                    reminder: `24/01/${selectedChecklistYear + 1}`,
                  },
                  {
                    q: 'ALL' as const,
                    label: 'Quyết Toán Cả Năm',
                    deadline: `31/03/${selectedChecklistYear + 1}`,
                    reminder: `24/03/${selectedChecklistYear + 1}`,
                  },
                ].map((item) => (
                  <Radio
                    key={item.q}
                    value={item.q}
                    className={`p-2.5 rounded-lg border transition-all ${
                      selectedChecklistQuarter === item.q
                        ? 'border-emerald-500 bg-emerald-50/80 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="inline-flex flex-wrap items-center justify-between gap-2 w-[calc(100%-30px)] text-xs">
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-600">
                          Hạn chót: <strong className="font-mono text-slate-900">{item.deadline}</strong>
                        </span>
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <BellOutlined /> Nhắc hạn: {item.reminder}
                        </span>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          </div>

          {/* Hộp tóm tắt thông số */}
          <div className="bg-emerald-950/90 text-white p-3.5 rounded-xl space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200 font-medium">Kỳ lựa chọn:</span>
              <strong className="text-white">
                {selectedChecklistQuarter === 'ALL'
                  ? `Quyết toán Cả năm ${selectedChecklistYear}`
                  : `Tạm nộp Quý ${selectedChecklistQuarter}/${selectedChecklistYear}`}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200 font-medium">Hạn nộp chính thức:</span>
              <strong className="text-amber-300 font-mono">
                {getQuarterDeadline(selectedChecklistQuarter, selectedChecklistYear)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200 font-medium">
                Ngày tự động nhắc nhở (cách 7 ngày):
              </span>
              <strong className="text-amber-300 font-mono">
                {getQuarterReminderDate(selectedChecklistQuarter, selectedChecklistYear)}
              </strong>
            </div>
            {String(selectedChecklistQuarter) === String(taxQuarter) &&
              selectedChecklistYear === taxYear &&
              citSummary.statutoryPrepayment80 > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-800">
                  <span className="text-teal-200 font-medium">
                    Số thuế TNDN tạm tính (từ sổ):
                  </span>
                  <strong className="text-emerald-300 font-mono">
                    {citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} VNĐ
                  </strong>
                </div>
              )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={onCloseChecklistModal} className="rounded-xl text-xs">
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              loading={isCreatingChecklist}
              onClick={onConfirmCreateChecklist}
              className="bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs h-10 px-5 rounded-xl border-none shadow-md shadow-emerald-700/20"
            >
              Xác Nhận Tạo Checklist
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
