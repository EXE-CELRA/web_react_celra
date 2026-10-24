import React from 'react';
import { Modal, Steps, message } from 'antd';
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

interface EtaxPaymentGuideModalProps {
  visible: boolean;
  onClose: () => void;
  taxCode?: string;
  companyName?: string;
  prepaymentAmount?: number;
  cqtName?: string;
  quarter?: number | 'ALL';
  year?: number;
}

export const EtaxPaymentGuideModal: React.FC<EtaxPaymentGuideModalProps> = ({
  visible,
  onClose,
  taxCode = 'MST_DOANH_NGHIEP',
  companyName = 'Doanh nghiệp',
  prepaymentAmount = 0,
  cqtName = 'Cơ quan thuế quản lý trực tiếp',
  quarter = 1,
  year = new Date().getFullYear(),
}) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}: ${text}`);
  };

  const quarterDeadline = (() => {
    switch (quarter) {
      case 1: return `30/04/${year}`;
      case 2: return `31/07/${year}`;
      case 3: return `31/10/${year}`;
      case 4: return `31/01/${year + 1}`;
      case 'ALL': return `31/03/${year + 1}`;
      default: return `30/01/${year + 1}`;
    }
  })();

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
        <div className="space-y-3 text-sm">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pb-2 border-b border-teal-100">
              <span className="text-xs text-teal-800 font-medium">Cơ quan quản lý thu:</span>
              <span className="font-semibold text-teal-950 sm:text-right">{cqtName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 pb-2 border-b border-teal-100">
              <div>
                <span className="text-xs text-teal-800 font-medium block">Mã Tiểu Mục (Kho Bạc):</span>
                <span className="text-[11px] text-teal-600">Thuế TNDN từ hoạt động SXKD thông thường</span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="font-mono text-base font-extrabold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-300">
                  1052
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('1052', 'Mã tiểu mục')}
                  className="px-2.5 py-1 text-xs bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CopyOutlined /> Sao chép
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 pb-2 border-b border-teal-100">
              <span className="text-xs text-teal-800 font-medium">Số tiền tạm nộp tối thiểu (80%):</span>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="font-mono font-bold text-rose-600 text-base">
                  {prepaymentAmount.toLocaleString('vi-VN')} đ
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(String(prepaymentAmount), 'Số tiền')}
                  className="px-2.5 py-1 text-xs bg-teal-600 text-white rounded-md hover:bg-teal-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CopyOutlined /> Sao chép
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs text-teal-800 font-medium">Kỳ thuế ghi chú:</span>
              <span className="font-semibold text-slate-800">
                {quarter === 'ALL' ? `Quyết toán năm ${year}` : `Tạm nộp Q${quarter} / Năm ${year}`}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ký & Nộp Thuế Hoàn Tất',
      description: 'Ký điện tử bằng USB Token và theo dõi trạng thái giao dịch nộp thuế.',
      content: (
        <div className="space-y-3 text-sm text-slate-700">
          <p className="m-0 leading-relaxed">
            1. Bấm nút <strong>"Hoàn thành"</strong> để xem lại toàn bộ Giấy nộp tiền.<br />
            2. Cắm Chữ ký số USB Token và bấm <strong>"Ký và Nộp"</strong>.<br />
            3. Nhập mã PIN của USB Token → Chờ thông báo <em>"Nộp thuế thành công"</em>.<br />
            4. Tải file Giấy nộp tiền điện tử (PDF/XML) về lưu trữ tại mục <strong>Bằng Chứng (Evidence)</strong> trên CELRA để phục vụ quyết toán thuế năm.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <CalendarOutlined className="text-base" /> Hạn chót nộp {quarter === 'ALL' ? `quyết toán năm ${year}` : `Quý ${quarter}/${year}`}: <strong>Chậm nhất ngày {quarterDeadline}</strong> (Theo Luật Quản lý thuế số 38/2019/QH14 & NĐ 91/2022/NĐ-CP).
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
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            Đã hiểu & Đóng hướng dẫn
          </button>
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
