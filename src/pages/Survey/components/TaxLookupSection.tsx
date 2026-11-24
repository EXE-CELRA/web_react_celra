import React from 'react';
import {
  CheckCircle2,
  Building,
  Building2,
  Users,
  Store,
  AlertTriangle,
  Lock,
  Search,
  Loader2,
} from 'lucide-react';
import type { BaseProfile } from '../../../types';

export interface TaxLookupDetails {
  taxCode: string;
  name: string;
  address?: string;
  status?: string;
  shortName?: string;
  internationalName?: string;
  legalType?: string;
  isOperating?: boolean;
}

interface TaxLookupSectionProps {
  taxCode: string;
  isSurveyCompleted: boolean;
  isLookingUpTax: boolean;
  taxLookupDetails: TaxLookupDetails | null;
  duplicateTaxError: string | null;
  unsupportedError: string | null;
  onTaxCodeChange: (newCode: string) => void;
  onLookupTax: () => void;
}

function getCompanyTypeIcon(iconName: string) {
  switch (iconName) {
    case 'Store':
      return <Store className="w-5 h-5 text-amber-600 shrink-0" />;
    case 'Building2':
      return <Building2 className="w-5 h-5 text-blue-600 shrink-0" />;
    case 'Users':
      return <Users className="w-5 h-5 text-cyan-600 shrink-0" />;
    case 'Building':
      return <Building className="w-5 h-5 text-purple-600 shrink-0" />;
    default:
      return <Building className="w-5 h-5 text-slate-600 shrink-0" />;
  }
}

export const TaxLookupSection: React.FC<TaxLookupSectionProps> = ({
  taxCode,
  isSurveyCompleted,
  isLookingUpTax,
  taxLookupDetails,
  duplicateTaxError,
  unsupportedError,
  onTaxCodeChange,
  onLookupTax,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
        <span>
          Mã số thuế doanh nghiệp (MST) <span className="text-rose-500">*</span>
        </span>
        <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          Cơ sở dữ liệu Thuế Quốc gia
        </span>
      </label>
      <div className="flex gap-2 max-w-2xl">
        <input
          type="text"
          value={taxCode}
          onChange={(e) => onTaxCodeChange(e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onLookupTax();
            }
          }}
          disabled={isSurveyCompleted}
          placeholder="Nhập mã số thuế (VD: 0101248141, 0303217354...)"
          className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={onLookupTax}
          disabled={isLookingUpTax || !taxCode || isSurveyCompleted}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
          title="Tra cứu thông tin công ty theo mã số thuế"
        >
          {isLookingUpTax ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tra cứu...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Tra cứu</span>
            </>
          )}
        </button>
      </div>
    </div>

    {duplicateTaxError && (
      <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-rose-900">
            Mã số thuế này đã tồn tại trên hệ thống CELRA
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed font-semibold">{duplicateTaxError}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            💡{' '}
            <em>
              Để bảo vệ tính toàn vẹn và độc lập dữ liệu giữa các doanh nghiệp, mỗi mã số thuế chỉ
              được gắn với một tài khoản doanh nghiệp duy nhất. Vui lòng kiểm tra lại mã số thuế
              hoặc liên hệ ban quản trị để được mời vào doanh nghiệp đã có.
            </em>
          </p>
        </div>
      </div>
    )}

    {unsupportedError && (
      <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-rose-900">
            Chưa hỗ trợ loại hình doanh nghiệp này
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed font-semibold">{unsupportedError}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            💡{' '}
            <em>
              Giai đoạn hiện tại của hệ thống CELRA tập trung phục vụ tối ưu cho{' '}
              <strong>Công ty TNHH 1 thành viên</strong> và{' '}
              <strong>Công ty TNHH 2 thành viên trở lên</strong>. Phiên bản dành cho Công ty Cổ phần
              và Hộ kinh doanh sẽ sớm ra mắt ở đợt cập nhật tiếp theo.
            </em>
          </p>
        </div>
      </div>
    )}

    {!taxLookupDetails && !unsupportedError && !duplicateTaxError && (
      <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>
          Vui lòng nhập Mã số thuế và nhấn <strong>"Tra cứu"</strong> để hệ thống tự động tải và
          khóa thông tin pháp nhân chính thức từ Tổng cục Thuế.
        </span>
      </div>
    )}

    {taxLookupDetails && (
      <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Thông tin Pháp nhân đã xác thực từ CSDL Quốc gia
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Đã khóa chỉnh sửa</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Tên pháp lý doanh nghiệp (theo ĐKKD)</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={taxLookupDetails.name}
              disabled
              readOnly
              className="w-full p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {getCompanyTypeIcon(
                  taxLookupDetails.legalType?.includes('1 thành viên') ? 'Building2' : 'Users',
                )}
                <span>Hình thức kinh doanh (Loại hình doanh nghiệp)</span>
                <Lock className="w-2.5 h-2.5 text-slate-400" />
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                ✔ Tự động bóc tách theo Luật Doanh nghiệp 2020
              </span>
            </label>
            <input
              type="text"
              value={taxLookupDetails.legalType || 'Công ty TNHH'}
              disabled
              readOnly
              className="w-full p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-xs font-bold text-teal-900 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Địa chỉ trụ sở chính</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={taxLookupDetails.address || 'Chưa cập nhật trên cổng thuế'}
              disabled
              readOnly
              className="w-full p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Tên viết tắt / Tên quốc tế</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={taxLookupDetails.shortName || taxLookupDetails.internationalName || 'Không có'}
              disabled
              readOnly
              className="w-full p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <span>Trạng thái hoạt động tại Cục Thuế</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </label>
            <div className="p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-800 text-xs">{taxLookupDetails.status}</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export type { BaseProfile };
