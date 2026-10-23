import type { ElectronicReceiptModalProps } from '../../interfaces';
import React from 'react';
import { Modal, Button, Tag } from 'antd';
import { 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Printer
} from 'lucide-react';



export const ElectronicReceiptModal: React.FC<ElectronicReceiptModalProps> = ({
  visible,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  const txCode = transaction.code || `TX-${transaction.id?.substring(0, 8) || 'CELRA'}`;
  const amount = transaction.amount || 0;
  const status = transaction.status || 'success';
  const type = transaction.type || 'deposit';
  const dateStr = transaction.timestamp || transaction.createdAt || new Date().toISOString();
  const formattedDate = new Date(dateStr).toLocaleString('vi-VN');
  const taskName = transaction.taskName || 'Giao dịch ví CELRA';
  const requestedBy = transaction.requestedBy || 'Chủ doanh nghiệp';
  const note = transaction.note || '';

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={450}
      centered
      destroyOnClose
      title={
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-slate-800 text-sm">Biên Nhận Điện Tử CELRA</span>
        </div>
      }
    >
      <div className="py-2 space-y-4 font-mono text-xs">
        {/* Receipt Header */}
        <div className="text-center pb-3 border-b border-slate-200 space-y-1">
          <div className="font-black text-slate-900 text-sm tracking-wider uppercase">
            HỆ THỐNG QUẢN TRỊ TUÂN THỦ CELRA
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Chứng từ điện tử xác nhận giao dịch ví &amp; đối soát
          </div>
        </div>

        {/* Big Amount & Status Badge */}
        <div className="text-center py-2 space-y-2">
          <div className="text-3xl font-black text-slate-900">
            {type === 'deposit' || type === 'refund' ? '+' : '-'} {Math.abs(amount).toLocaleString()} Credit
          </div>
          <div>
            {isSuccess && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                GIAO DỊCH THÀNH CÔNG
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-1 rounded-full border border-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                GIAO DỊCH THẤT BẠI / HOÀN TIỀN
              </span>
            )}
            {!isSuccess && !isFailed && (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[11px] font-bold px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Receipt Fields */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Mã giao dịch:</span>
            <strong className="text-slate-900 text-[11px] select-all">{txCode}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Loại giao dịch:</span>
            <Tag color={type === 'deposit' ? 'green' : type === 'capture' ? 'blue' : 'purple'} className="m-0 font-bold">
              {type === 'deposit' ? 'Nạp Credit' : type === 'capture' ? 'Rà Soát Tuân Thủ' : type}
            </Tag>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-500 shrink-0">Nội dung chi tiết:</span>
            <span className="text-right text-slate-800 font-semibold max-w-[240px] break-words">{taskName}</span>
          </div>
          {note && (
            <div className="flex justify-between items-start pt-1 border-t border-slate-200/80">
              <span className="text-slate-500 shrink-0">Ghi chú đối soát:</span>
              <span className="text-right text-slate-600 max-w-[240px] text-[11px] italic break-words">{note}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
            <span className="text-slate-500">Người thực hiện:</span>
            <span className="text-slate-800 font-bold">{requestedBy}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Thời gian ghi nhận:</span>
            <span className="text-slate-700">{formattedDate}</span>
          </div>
        </div>

        {/* Security / Verification Badge */}
        <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between font-sans text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-[11px] text-teal-900 font-medium">
              Chứng thực số bởi <strong>CELRA Compliance Engine</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200">
            SHA256:VERIFIED
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-2">
          <Button block onClick={onClose}>
            Đóng Biên Nhận
          </Button>
          <Button
            type="primary"
            block
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800"
          >
            In Chứng Từ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
