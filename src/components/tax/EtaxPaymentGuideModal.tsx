import React from 'react';
import { Modal, Steps, message } from 'antd';
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { getCalculatedQuarterDeadline } from '../../utils/taxCalendar';
interface EtaxPaymentGuideModalProps {
  visible: boolean;
  onClose: () => void;
  taxCode?: string;
  companyName?: string;
  prepaymentAmount?: number;
  cqtName?: string;
  quarter?: number | 'ALL';
  year?: number;
  totalAnnualEstimatedTax?: number;  // Biến A: Thuế ước tính cả năm
  paidQuarter1To3?: number;          // Biến B: Đã nộp từ Q1 đến Q3
  onUploadEvidence?: () => void;
}

export const EtaxPaymentGuideModal: React.FC<EtaxPaymentGuideModalProps> = ({
  visible,
  onClose,
  taxCode = 'MST_DOANH_NGHIEP',
  companyName = 'Doanh nghiệp',
  prepaymentAmount = 0,
  cqtName = '',
  quarter = 4,
  year = new Date().getFullYear(),
  totalAnnualEstimatedTax,
  paidQuarter1To3,
  onUploadEvidence,
}) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}: ${text}`);
  };

  // Tính toán hạn nộp có xét chuyển ngày nếu trùng Thứ 7 / Chủ Nhật
  const deadlineInfo = getCalculatedQuarterDeadline(quarter, year);
  const isQ4 = quarter === 4 || (quarter as unknown) === '4';

  // 4 THÔNG TIN QUY TẮC 80% (A, B, C, D)
  // A: Thuế TNDN ước tính cả năm
  const A = typeof totalAnnualEstimatedTax === 'number' && totalAnnualEstimatedTax > 0 
    ? totalAnnualEstimatedTax 
    : (prepaymentAmount > 0 ? Math.round(prepaymentAmount / 0.8) : undefined);

  // B: Tổng số tiền doanh nghiệp đã tạm nộp từ Q1 đến Q3
  const B = typeof paidQuarter1To3 === 'number' ? paidQuarter1To3 : undefined;

  // C: Mốc tham chiếu 80% cả năm = A * 80%
  const C = typeof A === 'number' ? Math.round(A * 0.8) : undefined;

  // D: Số tiền dự kiến cần bổ sung = max(0, C - B)
  const hasSufficientData = typeof C === 'number' && typeof B === 'number';
  const D = hasSufficientData ? Math.max(0, (C as number) - (B as number)) : undefined;

  // Cơ quan thuế quản lý trực tiếp
  const verifiedCqt = cqtName && cqtName.trim() && cqtName !== 'Cơ quan thuế quản lý trực tiếp'
    ? cqtName
    : 'Cần kiểm tra trên eTax';

  const [selectedSubItemCode, setSelectedSubItemCode] = React.useState<string>('1052');

  const SUB_ITEM_OPTIONS = [
    { code: '1052', label: '1052 - Thuế TNDN từ hoạt động SXKD thông thường (Phổ biến nhất)' },
    { code: '1053', label: '1053 - Thuế TNDN từ chuyển nhượng bất động sản' },
    { code: '1055', label: '1055 - Thuế TNDN từ chuyển nhượng vốn, chứng khoán' },
    { code: '1056', label: '1056 - Thuế TNDN từ hoạt động dầu khí, tài nguyên' },
  ];
  const steps = [
    {
      title: 'Đăng nhập eTax',
      description: 'Cắm USB Token chữ ký số và đăng nhập hệ thống Thuế Điện Tử.',
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-slate-700 m-0">
            Truy cập cổng chính thức của Tổng cục Thuế:{' '}
            <a
              href="https://thuedientu.gdt.gov.vn"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-teal-600 inline-flex items-center gap-1 hover:underline"
            >
              thuedientu.gdt.gov.vn <LinkOutlined />
            </a>
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs text-slate-500">Phân hệ:</span>
              <span className="font-semibold text-slate-800">DOANH NGHIỆP</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs text-slate-500">Tên đăng nhập (kèm đuôi QL):</span>
              <span className="font-mono font-bold text-teal-700 flex items-center gap-1.5">
                {taxCode}-QL
                <button
                  type="button"
                  onClick={() => handleCopy(`${taxCode}-QL`, 'Tên đăng nhập')}
                  className="text-xs text-slate-400 hover:text-teal-600 cursor-pointer p-0.5"
                  title="Sao chép tên đăng nhập"
                >
                  <CopyOutlined />
                </button>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs text-slate-500">Mật khẩu:</span>
              <span className="text-xs text-slate-600 font-medium">Mật khẩu do CQT cấp hoặc DN đã đổi</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Lập Giấy Nộp Tiền',
      description: 'Vào phân hệ Nộp Thuế và chọn Lập Giấy nộp tiền vào NSNN.',
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-slate-700 m-0">
            Tại thanh menu trên cùng của trang Thuế điện tử:
          </p>
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="font-semibold text-amber-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs">1</span>
              Bấm vào tab: <strong className="text-teal-700">NỘP THUẾ</strong>
            </div>
            <div className="font-semibold text-amber-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs">2</span>
              Chọn mục con: <strong className="text-teal-700">Lập giấy nộp tiền</strong>
            </div>
            <div className="font-semibold text-amber-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs">3</span>
              Chọn Ngân hàng nộp thuế mà công ty đã liên kết nộp thuế điện tử
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Điền Thông Số Kho Bạc (Mã 1052)',
      description: 'Nhập chính xác mã tiểu mục thuế TNDN để tránh nộp nhầm tiểu mục.',
      content: (
        <div className="space-y-3.5 text-sm">
          {/* BẢNG THÔNG TIN TẠM NỘP THUẾ TNDN THEO CHUẨN 4 BIẾN (A, B, C, D) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                THÔNG TIN TẠM NỘP THUẾ TNDN – {quarter === 'ALL' ? `QUYẾT TOÁN NĂM ${year}` : `QUÝ ${quarter}/${year}`}
              </span>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Quy tắc 80% cả năm
              </span>
            </div>

            {/* 1. Thuế TNDN ước tính cả năm (A) */}
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
              <span className="text-slate-600">1. Thuế TNDN ước tính cả năm (A):</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {typeof A === 'number' ? `${A.toLocaleString('vi-VN')} đ` : 'Chưa đủ dữ liệu ước tính'}
              </span>
            </div>

            {/* 2. Tổng số đã tạm nộp Quý I-III (B) */}
            {isQ4 && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">2. Tổng số đã tạm nộp Quý I–III (B):</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {typeof B === 'number' ? `${B.toLocaleString('vi-VN')} đ` : 'Chưa có dữ liệu Q1–Q3'}
                </span>
              </div>
            )}

            {/* 3. Mốc tham chiếu 80% cả năm (C) */}
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
              <span className="text-slate-600">3. Mốc tham chiếu 80% cả năm (C = A × 80%):</span>
              <span className="font-mono font-bold text-teal-700 text-xs">
                {typeof C === 'number' ? `${C.toLocaleString('vi-VN')} đ` : 'Chưa đủ dữ liệu'}
              </span>
            </div>

            {/* 4. Số tiền dự kiến cần bổ sung (D) */}
            <div className="flex justify-between items-center text-xs py-1.5 bg-amber-50/80 px-2.5 rounded-lg border border-amber-200/70">
              <span className="font-bold text-amber-950">
                {isQ4 ? '4. Số tiền dự kiến cần bổ sung để đạt mốc 80%:' : '4. Số tiền tạm nộp ước tính:'}
              </span>
              {hasSufficientData ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-rose-600 text-sm">
                    {D === 0 ? '0 đ (Đã đạt mốc an toàn)' : `${(D as number).toLocaleString('vi-VN')} đ`}
                  </span>
                  {D! > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopy(String(D), 'Số tiền dự kiến cần nộp')}
                      className="px-2 py-0.5 text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer flex items-center gap-1 shadow-2xs font-semibold"
                    >
                      <CopyOutlined /> Sao chép
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-amber-800 italic text-[11.5px] font-medium">
                  Chưa đủ dữ liệu để ước tính số tiền cần tạm nộp. Vui lòng bổ sung thông tin.
                </span>
              )}
            </div>

            {/* 5. Hạn tạm nộp thực tế (tự động điều chỉnh ngày nghỉ) */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs py-1 border-b border-slate-100 gap-1">
              <span className="text-slate-600">5. Hạn tạm nộp {quarter === 'ALL' ? 'quyết toán' : `Quý ${quarter}`}:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-slate-900 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                  {deadlineInfo.formattedDate}
                </span>
                {deadlineInfo.wasAdjusted && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                    Dời ngày (Chủ Nhật)
                  </span>
                )}
              </div>
            </div>
            {deadlineInfo.explanation && (
              <p className="text-[10.5px] text-slate-400 italic m-0">
                * {deadlineInfo.explanation}
              </p>
            )}

            {/* 6. Cơ quan quản lý thu & Mã tiểu mục */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Cơ quan quản lý thu:</span>
                <span className="font-semibold text-slate-800">{verifiedCqt}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs text-slate-600">6. Mã Tiểu Mục tham khảo:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSubItemCode}
                    onChange={(e) => setSelectedSubItemCode(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono font-bold text-slate-800"
                  >
                    {SUB_ITEM_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedSubItemCode, 'Mã tiểu mục')}
                    className="px-2 py-1 text-xs bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer flex items-center gap-1 shadow-2xs font-semibold"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>
            </div>

            {/* Ghi chú minh bạch số liệu ước tính */}
            <div className="text-[10.5px] text-slate-500 pt-2 border-t border-slate-200/80 leading-relaxed italic">
              * Kết quả được ước tính từ dữ liệu hiện có. Doanh nghiệp cần kiểm tra số thuế đã nộp, ưu đãi và thông tin nghĩa vụ trên hệ thống thuế chính thức trước khi thanh toán.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ký & Nộp Thuế Hoàn Tất (USB Token / Chữ Ký Số)',
      description: 'Ký điện tử và tải chứng từ nộp thuế về CELRA để phục vụ thẩm tra.',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="m-0 leading-relaxed text-xs">
            1. Kiểm tra lại toàn bộ thông tin trên Giấy nộp tiền: <strong>Mã số thuế, Cơ quan thuế, Mã tiểu mục ({selectedSubItemCode}), Số tiền và Kỳ thuế</strong>.<br />
            2. Thực hiện ký điện tử bằng Chữ ký số USB Token (hoặc Chữ ký số từ xa HSM / SmartCA đã đăng ký với Thuế).<br />
            3. Nhập mã PIN chữ ký số để xác nhận giao dịch nộp tiền vào Ngân sách Nhà nước.<br />
            4. Chờ Cổng Thuế điện tử gửi Giấy xác nhận giao dịch thành công (PDF/XML) và thông báo qua Email đăng ký nộp thuế.<br />
            5. <strong>Tải chứng từ Giấy nộp tiền</strong> về lưu trữ tại mục <strong>Kho Hồ sơ &amp; Chứng từ</strong> trên CELRA để phục vụ quyết toán thuế cuối năm.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <CalendarOutlined className="text-base shrink-0" />
            <span>Hạn chót tạm nộp {quarter === 'ALL' ? `quyết toán năm ${year}` : `Quý ${quarter}/${year}`}: <strong>Chậm nhất ngày {deadlineInfo.formattedDate}</strong>.</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      centered
      width="min(760px, 94vw)"
      style={{ maxWidth: '94vw' }}
      styles={{
        body: {
          maxHeight: 'calc(85vh - 130px)',
          overflowY: 'auto',
          paddingRight: '6px',
        },
      }}
      title={
        <div className="flex items-start sm:items-center gap-2.5 pb-2 pr-6">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <SafetyCertificateOutlined className="text-base" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0 leading-snug">
              Hướng Dẫn Thao Tác Nộp Thuế TNDN Trên eTax (Tiểu Mục 1052)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 m-0 mt-0.5 truncate">
              Doanh nghiệp: <strong className="text-slate-700">{companyName}</strong> (MST: {taxCode})
            </p>
          </div>
        </div>
      }
      footer={
        <div className="pt-2.5 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 italic">
            Cổng Thuế điện tử chính thức: thuedientu.gdt.gov.vn
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onUploadEvidence && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadEvidence();
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
              >
                Tải chứng từ nộp thuế lên CELRA
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Đã hiểu &amp; Đóng hướng dẫn
            </button>
          </div>
        </div>
      }
    >
      <div className="py-2 space-y-5">
        <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
          <InfoCircleOutlined className="text-teal-600 text-sm mt-0.5 shrink-0" />
          <span>
            Hệ thống hỗ trợ trích xuất sẵn <strong>Mã tiểu mục 1052</strong> và <strong>Số tiền tạm nộp 80%</strong>. Bạn chỉ cần sao chép nhanh và dán vào biểu mẫu nộp tiền trên cổng eTax.
          </span>
        </div>

        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={steps.map((s, idx) => ({
            title: <span className="font-bold text-slate-800 text-sm">{idx + 1}. {s.title}</span>,
            description: (
              <div className="mt-2 mb-4">
                <p className="text-xs text-slate-500 mb-2">{s.description}</p>
                {s.content}
              </div>
            ),
          }))}
        />
      </div>
    </Modal>
  );
};
