import type { StickyBottomActionBarProps } from '../../interfaces';
export type { StickyBottomActionBarProps };
import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';



/**
 * Reusable Sticky Bottom Bar
 * Thanh công cụ điều hướng hành động cố định chân trang (Footer Bar),
 * dùng cho mọi Wizard, Survey, Form dài nhiều bước, Review hoặc Checkout.
 */
export const StickyBottomActionBar: React.FC<StickyBottomActionBarProps> = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  progressPercent,
  progressLabel,
  primaryAction,
  secondaryAction,
  quickAction,
  className = '',
}) => {
  const getPrimaryClass = (variant?: 'teal' | 'blue' | 'emerald') => {
    switch (variant) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20';
      case 'teal':
      default:
        return 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-teal-500/20';
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-3 px-4 sm:px-8 transition-all ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Phần thông tin tiến độ / Trạng thái bên trái */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          {typeof progressPercent === 'number' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shrink-0">
                {progressPercent === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                ) : (
                  <span className="text-xs font-bold text-teal-700 font-mono">
                    {progressPercent}%
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{title || (currentStep ? `Bước ${currentStep}/${totalSteps}` : 'Tiến độ')}</span>
                  {progressPercent === 100 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                      Sẵn sàng
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {progressLabel || subtitle || (progressPercent === 100 ? 'Đã hoàn tất tất cả câu hỏi' : 'Đang thực hiện...')}
                </div>
              </div>
            </div>
          )}

          {!progressPercent && title && (
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">{title}</div>
              {subtitle && <div className="text-[11px] text-slate-500">{subtitle}</div>}
            </div>
          )}
        </div>

        {/* Phần các nút hành động bên phải */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Nút phụ (Quay lại) */}
          {secondaryAction && (
            <button
              type="button"
              disabled={secondaryAction.disabled}
              onClick={secondaryAction.onClick}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryAction.icon || <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {/* Nút hành động nhanh (VD: Kích hoạt nhanh ngay khi xong câu hỏi) */}
          {quickAction && (
            <button
              type="button"
              disabled={quickAction.disabled || quickAction.loading}
              onClick={quickAction.onClick}
              className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickAction.icon || <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />}
              <span>{quickAction.loading ? 'Đang xử lý...' : quickAction.label}</span>
            </button>
          )}

          {/* Nút chính (Tiếp tục / Hoàn thành & Kích hoạt) */}
          <button
            type="button"
            disabled={primaryAction.disabled || primaryAction.loading}
            onClick={primaryAction.onClick}
            className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getPrimaryClass(
              primaryAction.variant
            )}`}
          >
            <span>{primaryAction.loading ? 'Đang lưu...' : primaryAction.label}</span>
            {primaryAction.icon || <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
export default StickyBottomActionBar;
