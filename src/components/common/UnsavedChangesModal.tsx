import type { UnsavedChangesModalProps } from '../../interfaces';
export type { UnsavedChangesModalProps };
import React from 'react';
import { Modal } from 'antd';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';



/**
 * Reusable Unsaved Changes Modal
 * Modal cảnh báo thông minh khi người dùng có thay đổi chưa lưu hoặc chưa kích hoạt,
 * có thể tái sử dụng cho Survey, Form chỉnh sửa Context, Task Form, Settings...
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  title = 'Bạn có dữ liệu chưa được kích hoạt!',
  description = 'Bạn đã hoàn tất trả lời câu hỏi nhưng chưa nhấn nút kích hoạt. Nếu rời đi bây giờ, các Thẻ bối cảnh doanh nghiệp sẽ không được tạo vào hệ thống.',
  warningDetail,
  saveText = 'Kích hoạt Bối cảnh & Tiếp tục',
  discardText = 'Rời đi không lưu',
  cancelText = 'Ở lại kiểm tra',
  onSaveAndProceed,
  onDiscard,
  onCancel,
  isSaving = false,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={500}
      className="rounded-2xl overflow-hidden"
    >
      <div className="p-2 space-y-4">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-600 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Warning Details callout if any */}
        {warningDetail && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>Lưu ý quan trọng:</span>
            </div>
            <div className="text-[11px] leading-relaxed text-amber-800">
              {warningDetail}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          {/* Nút chính: Lưu & Tiếp tục */}
          {onSaveAndProceed && (
            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveAndProceed}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Đang kích hoạt...' : saveText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Nút phụ: Ở lại */}
            {onCancel && (
              <button
                type="button"
                disabled={isSaving}
                onClick={onCancel}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {cancelText}
              </button>
            )}

            {/* Nút rời đi: Bỏ qua */}
            {onDiscard && (
              <button
                type="button"
                disabled={isSaving}
                onClick={onDiscard}
                className="w-full py-2 px-3 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {discardText}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default UnsavedChangesModal;
