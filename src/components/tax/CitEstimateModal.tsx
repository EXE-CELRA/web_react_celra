import React, { useState, useMemo } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Tag,
  Alert,
  Tooltip,
  message,
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  CompassOutlined,
  CreditCardOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { downloadCitExcelTemplate, parseCitExcelFile } from '../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone, type TaxIncentiveInfo } from '../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult, type DisallowedExpenseFinding } from '../../utils/citTaxCalculator';
import { EtaxPaymentGuideModal } from './EtaxPaymentGuideModal';

const { Dragger } = Upload;

interface CitEstimateModalProps {
  visible: boolean;
  onClose: () => void;
  taxCode?: string;
  companyName?: string;
  address?: string;
  companyTypeTag?: string; // 'TAG_TNHH_1TV' | 'TAG_TNHH_2TV'
  cqtName?: string;
}

export const CitEstimateModal: React.FC<CitEstimateModalProps> = ({
  visible,
  onClose,
  taxCode = '0101234567',
  companyName = 'Công ty TNHH Một Thành Viên Demo',
  address = 'Quận Ninh Kiều, TP. Cần Thơ',
  companyTypeTag = 'TAG_TNHH_1TV',
  cqtName = 'Cục Thuế TP. Cần Thơ',
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CitCalculationResult | null>(null);
  const [showEtaxModal, setShowEtaxModal] = useState(false);

  // 1. Tự động nhận diện vùng ưu đãi thuế dựa trên chuỗi địa chỉ
  const incentiveInfo: TaxIncentiveInfo = useMemo(() => {
    return detectTaxIncentiveZone(address);
  }, [address]);

  // Xử lý upload file Excel
  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseCitExcelFile(file);

      // Chạy Rule engine tính toán thuế TNDN
      const calcResult = calculateCitTax(
        parsed.revenues,
        parsed.expenses,
        incentiveInfo,
        companyTypeTag
      );
      setResult(calcResult);
      message.success(`Đã phân tích thành công ${parsed.revenues.length} khoản thu và ${parsed.expenses.length} khoản chi!`);
    } catch (error: any) {
      console.error(error);
      message.error('Không thể đọc file Excel. Vui lòng kiểm tra đúng định dạng mẫu 2 Sheet của CELRA!');
    } finally {
      setLoading(false);
    }
    return false; // Chặn upload mặc định của Antd
  };

  // Cột bảng chi phí bị loại
  const columns = [
    {
      title: 'Khoản mục chi',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: DisallowedExpenseFinding) => (
        <div>
          <span className="font-semibold text-slate-800">{text}</span>
          <div className="text-[11px] text-slate-400">Ngày chi: {record.date}</div>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (
        <span className="font-mono font-bold text-rose-600">
          {val.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Lý do bị loại (Mục B4)',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string, record: DisallowedExpenseFinding) => {
        let tagColor = 'error';
        let label = 'Không có HĐ';
        if (record.violationType === 'CASH_OVER_20M') {
          tagColor = 'warning';
          label = '≥20tr tiền mặt';
        } else if (record.violationType === 'LLC1_OWNER_SALARY') {
          tagColor = 'purple';
          label = 'Lương chủ TNHH 1TV';
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Tag color={tagColor} className="text-[10px] font-bold uppercase m-0">
                {label}
              </Tag>
              <span className="text-xs text-slate-700">{reason}</span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              Căn cứ: {record.legalBasis}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Thuế TNDN bị đội lên',
      dataIndex: 'taxImpact',
      key: 'taxImpact',
      render: (val: number) => (
        <Tooltip title="Do khoản chi bị loại, thu nhập tính thuế tăng lên tương ứng khiến tiền thuế phải nộp tăng thêm">
          <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
            +{val.toLocaleString('vi-VN')} đ
          </span>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        width={960}
        footer={null}
        title={
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <AuditOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 m-0">
                Dự Toán & Rà Soát Chi Phí Thuế Thu Nhập Doanh Nghiệp (TNDN)
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Áp dụng chuẩn Luật Thuế TNDN, Thông tư 78/2014 & Nghị định 91/2022/NĐ-CP
              </p>
            </div>
          </div>
        }
      >
        <div className="py-3 space-y-5">
          {/* 📍 CARD NHẬN DIỆN VÙNG ƯU ĐÃI THUẾ THEO ĐỊA CHỈ */}
          <div className={`p-4 rounded-2xl border ${incentiveInfo.badgeColor} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0 mt-0.5">
                <CompassOutlined className="text-base text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tự động nhận diện vùng ưu đãi thuế:
                  </span>
                  <Tag className="font-extrabold text-xs m-0 px-2 py-0.5 rounded-md">
                    {incentiveInfo.title}
                  </Tag>
                </div>
                <p className="text-xs text-slate-600 m-0 mt-1">
                  Trụ sở chính: <strong>{address || 'Chưa cập nhật địa chỉ'}</strong>
                </p>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5 italic">
                  {incentiveInfo.exemptionPolicy}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 md:pl-4 md:border-l md:border-slate-200">
              <span className="text-[11px] text-slate-500 block uppercase font-bold">Thuế suất áp dụng</span>
              <span className="font-mono text-2xl font-black text-teal-700">
                {incentiveInfo.taxRatePercentText}
              </span>
            </div>
          </div>

          {/* 📥 KHU VỰC TẢI FILE MẪU & UPLOAD EXCEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 m-0">
                  <FileExcelOutlined className="text-emerald-600 text-sm" /> File Mẫu Chuẩn CELRA
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Bao gồm đúng 2 sheet chuẩn hóa: <br />
                  • <strong>Sheet 1 (DOANH_THU):</strong> Ngày, Số HĐ, Doanh thu.<br />
                  • <strong>Sheet 2 (CHI_PHI):</strong> Khoản mục, Số tiền, Hình thức thanh toán, Hóa đơn.
                </p>
              </div>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadCitExcelTemplate}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 font-semibold text-xs rounded-xl"
              >
                Tải File Mẫu Excel (.xlsx)
              </Button>
            </div>

            <div className="md:col-span-2">
              <Dragger
                name="file"
                accept=".xlsx, .xls"
                multiple={false}
                beforeUpload={handleUpload}
                showUploadList={false}
                disabled={loading}
                className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 transition-colors p-4"
              >
                <p className="ant-upload-drag-icon text-teal-600 mb-1">
                  <InboxOutlined className="text-3xl" />
                </p>
                <p className="ant-upload-text text-sm font-bold text-slate-700 m-0">
                  Kéo thả file Excel thu chi vào đây hoặc bấm để chọn file
                </p>
                <p className="ant-upload-hint text-xs text-slate-400 mt-1 m-0">
                  Hệ thống tự động đọc và bóc tách các khoản chi bị xuất toán (loại trừ Mục B4) trong vài giây
                </p>
              </Dragger>
            </div>
          </div>

          {/* 📊 BẢNG KẾT QUẢ DỰ TOÁN THUẾ TNDN SAU KHI PHÂN TÍCH */}
          {result && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase block">Tổng Doanh Thu</span>
                  <span className="font-mono text-base font-extrabold text-slate-800">
                    {result.totalRevenue.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase block">Tổng Chi Phí Kế Toán</span>
                  <span className="font-mono text-base font-bold text-slate-700">
                    {result.totalAccountingExpense.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                  <span className="text-[11px] text-rose-700 font-bold uppercase flex items-center justify-between">
                    Chi Phí Bị Loại (B4)
                    <WarningOutlined />
                  </span>
                  <span className="font-mono text-base font-black text-rose-600">
                    - {result.totalDisallowedExpense.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-200">
                  <span className="text-[11px] text-teal-700 font-bold uppercase block">Chi Phí Được Trừ Thực Tế</span>
                  <span className="font-mono text-base font-extrabold text-teal-800">
                    {result.totalDeductibleExpense.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* CARD TỔNG TIỀN THUẾ PHẢI NỘP VÀ NGHĨA VỤ 80% */}
              <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-teal-950/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-extrabold uppercase">
                      Thuế suất: {incentiveInfo.taxRatePercentText}
                    </span>
                    <span className="text-xs text-slate-300">
                      Thu nhập tính thuế: <strong>{result.assessableIncome.toLocaleString('vi-VN')} đ</strong>
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white m-0">
                    Thuế TNDN Dự Kiến Cả Năm: {result.estimatedTaxAmount.toLocaleString('vi-VN')} VNĐ
                  </h4>
                  <p className="text-xs text-teal-200/90 m-0">
                    Nghĩa vụ tạm nộp 4 quý tối thiểu 80% (Nghị định 91/2022):{' '}
                    <strong className="text-amber-300 text-sm font-mono">
                      {result.statutoryPrepayment80.toLocaleString('vi-VN')} VNĐ
                    </strong>{' '}
                    (Hạn chót: 30/01 năm sau).
                  </p>
                </div>

                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={() => setShowEtaxModal(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold h-10 px-4 rounded-xl border-none shrink-0"
                >
                  Hướng Dẫn Nộp Trên eTax (Tiểu Mục 1052)
                </Button>
              </div>

              {/* BẢNG CHI TIẾT CÁC KHOẢN CHI BỊ XUẤT TOÁN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 m-0">
                    <WarningOutlined className="text-rose-500" /> Danh Sách Các Khoản Chi Bị Loại Khỏi Chi Phí Hợp Lý ({result.disallowedItems.length} khoản)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Đối chiếu theo Thông tư 78/2014 & Thông tư 96/2015
                  </span>
                </div>

                {result.disallowedItems.length > 0 ? (
                  <Table
                    columns={columns}
                    dataSource={result.disallowedItems}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  />
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-xs text-emerald-800 font-medium">
                    <CheckCircleOutlined className="mr-1 text-emerald-600" /> Tuyệt vời! 100% các khoản chi trong file Excel của bạn đều hợp lệ, không có khoản nào bị xuất toán.
                  </div>
                )}
              </div>

              {/* CẢNH BÁO CHI PHÍ QUẢNG CÁO NƯỚC NGOÀI NẾU CÓ */}
              {result.warningAdsItems.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="Lưu ý về Chi Phí Quảng Cáo Quốc Tế (Facebook / Google / TikTok)"
                  description={
                    <div className="text-xs space-y-1">
                      <span>Phát hiện {result.warningAdsItems.length} khoản chi cho nhà thầu nước ngoài. Để được chấp nhận là chi phí hợp lý khi quyết toán, doanh nghiệp cần kê khai nộp thuế nhà thầu (FCT) hoặc có hóa đơn VAT từ đại lý ủy quyền tại Việt Nam.</span>
                    </div>
                  }
                  className="rounded-xl"
                />
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button onClick={onClose} className="rounded-xl text-xs font-medium">
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal hướng dẫn eTax con */}
      <EtaxPaymentGuideModal
        visible={showEtaxModal}
        onClose={() => setShowEtaxModal(false)}
        taxCode={taxCode}
        companyName={companyName}
        prepaymentAmount={result?.statutoryPrepayment80 || 0}
        cqtName={cqtName}
      />
    </>
  );
};
