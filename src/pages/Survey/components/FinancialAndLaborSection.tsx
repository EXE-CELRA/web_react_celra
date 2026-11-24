import React from 'react';
import { Scale, ExternalLink, ShieldCheck } from 'lucide-react';
import type { BaseProfile } from '../../../types';
import type { LegalRule } from '../../../interfaces';
import { determineCitTaxRate, calculateNormalizedRevenue } from '../../../utils/taxRateChecker';

function formatCurrencyToWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return '0 VNĐ';
  if (amount >= 1000000000000) {
    const ty = (amount / 1000000000).toFixed(1).replace('.0', '');
    return ty + ' nghìn tỷ VNĐ';
  }
  if (amount >= 1000000000) {
    const ty = (amount / 1000000000).toFixed(2).replace(/\.?0+$/, '');
    return ty + ' tỷ VNĐ';
  }
  if (amount >= 1000000) {
    const tr = (amount / 1000000).toFixed(1).replace(/\.?0+$/, '');
    return tr + ' triệu VNĐ';
  }
  return amount.toLocaleString('vi-VN') + ' VNĐ';
}

interface FinancialAndLaborSectionProps {
  baseProfile: BaseProfile;
  isSurveyCompleted: boolean;
  legalRules: Record<string, LegalRule>;
  onUpdateProfile: (updates: Partial<BaseProfile>) => void;
}

export const FinancialAndLaborSection: React.FC<FinancialAndLaborSectionProps> = ({
  baseProfile,
  isSurveyCompleted,
  legalRules,
  onUpdateProfile,
}) => {
  const getRuleCitation = (
    code: string,
    citationIndex = 0,
    defaultDoc: { title: string; url: string; label?: string },
  ) => {
    const rule = legalRules[code];
    if (rule?.conditionsJson?.citations?.[citationIndex]) {
      const c = rule.conditionsJson.citations[citationIndex];
      return {
        title: c.title || defaultDoc.title,
        url: c.sourceUrl || defaultDoc.url,
        label: c.articleNumber || c.title || defaultDoc.label,
      };
    }
    return defaultDoc;
  };

  const taxResult = determineCitTaxRate({
    priorYearRevenue: baseProfile.annualRevenue || 0,
    operatingMonthsPriorYear: baseProfile.operatingMonthsPriorYear || 12,
    isNewlyEstablished: baseProfile.isNewlyEstablished,
    isFirstTimeStartup: baseProfile.isFirstTimeStartup,
    hasRelatedParty: baseProfile.hasRelatedParty,
  });

  const citeUnder10 = getRuleCitation('RULE-LABOR-UNDER10', 0, {
    title: 'Bộ luật Lao động 2019',
    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  });
  const cite10To50Law = getRuleCitation('RULE-LABOR-10TO50', 0, {
    title: 'Bộ luật Lao động 2019',
    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  });
  const cite10To50Penalty = getRuleCitation('RULE-LABOR-10TO50', 1, {
    title: 'Nghị định 283/2026/NĐ-CP (Xử phạt lao động mới)',
    url: 'https://dulieuphapluat.vn/van-ban/bao-hiem-van-ban/nghi-dinh-2832026nd-cp-quy-dinh-xu-phat-vi-pham-hanh-chinh-trong-linh-vuc-lao-dong-bao-hiem-xa-hoi-nguoi-lao-dong-viet-nam-di-lam-viec-o-nuoc-ngoai-theo-hop-dong-1426549.html',
    label: 'NĐ 283/2026',
  });
  const citeOver50Safety = getRuleCitation('RULE-LABOR-OVER50', 0, {
    title: 'Luật An toàn, vệ sinh lao động 2015',
    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/luat-an-toan-ve-sinh-lao-dong-2015-285199.html',
  });

  return (
    <>
      {/* Thông số Tài chính & Doanh thu thực tế */}
      <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-end flex-wrap gap-2">
          <label
            className={`flex items-center gap-2 text-xs font-medium select-none ${
              isSurveyCompleted
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              disabled={isSurveyCompleted}
              checked={baseProfile.isNewlyEstablished || false}
              onChange={(e) => {
                if (isSurveyCompleted) return;
                const checked = e.target.checked;
                onUpdateProfile({
                  isNewlyEstablished: checked,
                  annualRevenue: checked ? 0 : baseProfile.annualRevenue || 0,
                });
              }}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span>Doanh nghiệp mới thành lập năm nay</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Doanh thu năm trước liền kề (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={baseProfile.isNewlyEstablished || isSurveyCompleted}
                value={
                  baseProfile.isNewlyEstablished
                    ? '0'
                    : Number(baseProfile.annualRevenue || 0).toLocaleString('vi-VN')
                }
                onChange={(e) => {
                  if (isSurveyCompleted) return;
                  const rawDigits = e.target.value.replace(/\D/g, '');
                  onUpdateProfile({ annualRevenue: Number(rawDigits) || 0 });
                }}
                placeholder="VD: 2,500,000,000"
                className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                VNĐ
              </span>
            </div>
            <div className="text-[11px] text-teal-700 font-medium mt-1">
              {baseProfile.isNewlyEstablished
                ? '🌟 Doanh nghiệp mới thành lập: Tạm nộp theo bậc khởi điểm, quyết toán thực tế cuối kỳ'
                : 'Đọc số: ~ ' + formatCurrencyToWords(baseProfile.annualRevenue || 0)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Số tháng hoạt động kỳ trước <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={baseProfile.isNewlyEstablished || isSurveyCompleted}
              value={baseProfile.operatingMonthsPriorYear || 12}
              onChange={(e) => {
                if (isSurveyCompleted) return;
                onUpdateProfile({ operatingMonthsPriorYear: Number(e.target.value) || 12 });
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m} tháng {m === 12 ? '(Đủ cả năm)' : '(Quy đổi đủ 12T)'}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {baseProfile.operatingMonthsPriorYear &&
              baseProfile.operatingMonthsPriorYear < 12 &&
              !baseProfile.isNewlyEstablished ? (
                <span className="text-amber-700 font-semibold">
                  Doanh thu quy đổi 12T:{' '}
                  {calculateNormalizedRevenue(
                    baseProfile.annualRevenue || 0,
                    baseProfile.operatingMonthsPriorYear,
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </span>
              ) : (
                'Dùng để quy đổi chuẩn 12 tháng theo luật'
              )}
            </div>
          </div>
        </div>

        {/* Câu hỏi xác minh điều kiện miễn giảm & quan hệ liên kết */}
        <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            className={`flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 select-none ${
              isSurveyCompleted
                ? 'cursor-not-allowed opacity-75'
                : 'cursor-pointer hover:border-teal-400'
            }`}
          >
            <input
              type="checkbox"
              disabled={isSurveyCompleted}
              checked={baseProfile.isFirstTimeStartup || false}
              onChange={(e) => {
                if (isSurveyCompleted) return;
                onUpdateProfile({ isFirstTimeStartup: e.target.checked });
              }}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">
                Doanh nghiệp vừa &amp; nhỏ đăng ký lần đầu
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Đề xuất chính sách miễn thuế TNDN 03 năm theo Khoản 3 Điều 7 NĐ 20/2026/NĐ-CP (nếu
                đáp ứng đủ điều kiện)
              </div>
            </div>
          </label>

          <label
            className={`flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 select-none ${
              isSurveyCompleted
                ? 'cursor-not-allowed opacity-75'
                : 'cursor-pointer hover:border-teal-400'
            }`}
          >
            <input
              type="checkbox"
              disabled={isSurveyCompleted}
              checked={baseProfile.hasRelatedParty || false}
              onChange={(e) => {
                if (isSurveyCompleted) return;
                onUpdateProfile({ hasRelatedParty: e.target.checked });
              }}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">
                Có quan hệ công ty con / giao dịch liên kết
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Rà soát loại trừ ưu đãi thuế theo Nghị định 132/2020/NĐ-CP chống chuyển giá
              </div>
            </div>
          </label>
        </div>

        {/* WIDGET KẾT QUẢ SÀNG LỌC THUẾ SUẤT TNDN DỰ KIẾN */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-blue-50 border border-teal-200/90 rounded-xl p-3.5 mt-2">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-extrabold text-teal-950 uppercase tracking-wide">
                Kết quả sàng lọc thuế suất TNDN dự kiến (Năm 2026):
              </span>
            </div>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${taxResult.badgeColor}`}
            >
              Thuế suất: {taxResult.taxRatePercentText}
            </span>
          </div>
          <div className="text-xs text-slate-700 font-medium leading-relaxed">
            {taxResult.explanation}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1 pt-1 border-t border-teal-100 flex items-center justify-between flex-wrap gap-2">
            <span>
              Căn cứ: <strong>{taxResult.legalBasis}</strong>
            </span>
            {taxResult.normalizedRevenue > 0 && (
              <span>
                Doanh thu tính bậc:{' '}
                <strong>{taxResult.normalizedRevenue.toLocaleString('vi-VN')} đ</strong>
              </span>
            )}
          </div>
        </div>

        {/* Vốn điều lệ */}
        <div className="pt-2 border-t border-slate-200/80">
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Vốn điều lệ đăng ký trên ĐKKD (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={isSurveyCompleted}
              value={Number(baseProfile.charterCapital || 0).toLocaleString('vi-VN')}
              onChange={(e) => {
                if (isSurveyCompleted) return;
                const rawDigits = e.target.value.replace(/\D/g, '');
                onUpdateProfile({ charterCapital: Number(rawDigits) || 0 });
              }}
              placeholder="VD: 5,000,000,000"
              className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
              VNĐ
            </span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">
            {'Đọc số: ~ ' + formatCurrencyToWords(baseProfile.charterCapital || 0)}
          </div>
        </div>
      </div>

      {/* Quy mô nhân sự */}
      <div className="pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <label className="block text-xs font-bold text-slate-800">
            Số lượng nhân sự đang làm việc thực tế: <span className="text-rose-500">*</span>
          </label>
          <div className="relative w-48 sm:w-60">
            <input
              type="text"
              inputMode="numeric"
              disabled={isSurveyCompleted}
              value={baseProfile.employeeCount ? String(baseProfile.employeeCount) : ''}
              placeholder="VD: 25"
              onChange={(e) => {
                if (isSurveyCompleted) return;
                const rawDigits = e.target.value.replace(/\D/g, '');
                const count = rawDigits === '' ? 0 : parseInt(rawDigits, 10);
                onUpdateProfile({
                  employeeCount: count,
                  employeeScale: count < 10 ? 'under_10' : count <= 50 ? '10_to_50' : 'over_50',
                });
              }}
              className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
              người
            </span>
          </div>
        </div>

        <div>
          {baseProfile.employeeScale === 'under_10' && (
            <div className="p-4 rounded-xl border border-teal-500 bg-teal-50/70 text-xs shadow-sm transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-sm">
                  Quy mô: Dưới 10 nhân viên ({baseProfile.employeeCount || 0} người)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-200 text-teal-900 font-bold">
                  MIỄN THỦ TỤC VĂN BẢN
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-normal block mb-2">
                Quy mô vi mô, chưa bắt buộc đăng ký NQLĐ bằng văn bản
              </span>
              <div className="p-2 rounded bg-white/80 border border-slate-200 text-[10px] text-slate-600 mb-2 italic leading-relaxed">
                "Người sử dụng lao động phải ban hành NQLĐ, nếu sử dụng từ 10 người lao động trở lên
                thì NQLĐ phải bằng văn bản."
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={citeUnder10.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                  title={`Xem Điều 218 ${citeUnder10.title}: Miễn, giảm thủ tục đối với trường hợp sử dụng dưới 10 lao động trên Dữ Liệu Pháp Luật (DLPL)`}
                >
                  <Scale className="w-3 h-3 text-teal-600" />
                  <span>Điều 218 BLLĐ 2019 (Miễn thủ tục dưới 10 người)</span>
                  <ExternalLink className="w-2.5 h-2.5 text-teal-600" />
                </a>
              </div>
            </div>
          )}

          {baseProfile.employeeScale === '10_to_50' && (
            <div className="p-4 rounded-xl border border-amber-500 bg-amber-50/80 text-xs shadow-sm transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  Quy mô: Từ 10 đến 50 nhân viên ({baseProfile.employeeCount} người)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold font-mono">
                  CỜ BẮT BUỘC
                </span>
              </div>
              <span className="text-[11px] text-amber-900 font-medium block mb-2">
                Kích hoạt cờ: Bắt buộc ban hành NQLĐ bằng văn bản &amp; Đăng ký trong vòng 10 ngày
              </span>
              <div className="p-2 rounded bg-amber-100/70 border border-amber-200 text-[10px] text-amber-900 mb-2 italic leading-relaxed">
                "Khoản 1 Điều 119 BLLĐ 2019: Sử dụng từ 10 người lao động trở lên phải đăng ký NQLĐ
                tại cơ quan chuyên môn về lao động cấp tỉnh."
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={cite10To50Law.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 hover:text-amber-950 hover:underline"
                  title={`Mở trực tiếp toàn văn ${cite10To50Law.title} trên Dữ Liệu Pháp Luật (DLPL)`}
                >
                  <Scale className="w-3 h-3 text-amber-600" />
                  <span>Văn bản gốc: Khoản 1 Điều 119 BLLĐ 2019</span>
                  <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                </a>
                <a
                  href={cite10To50Penalty.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 hover:text-amber-950 hover:underline"
                  title={`Xem chế tài xử phạt mới nhất tại ${cite10To50Penalty.title} trên DLPL`}
                >
                  <span>• Chế tài phạt: NĐ 283/2026</span>
                  <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                </a>
              </div>
            </div>
          )}

          {baseProfile.employeeScale === 'over_50' && (
            <div className="p-4 rounded-xl border border-amber-500 bg-amber-50/80 text-xs shadow-sm transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  Quy mô: Trên 50 nhân viên ({baseProfile.employeeCount} người)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold font-mono">
                  CỜ BẮT BUỘC
                </span>
              </div>
              <span className="text-[11px] text-amber-900 font-medium block mb-2">
                Kích hoạt cờ: Cần NQLĐ, Cán bộ/Ban ATVSLĐ chuyên trách &amp; Đối thoại định kỳ
              </span>
              <div className="p-2 rounded bg-amber-100/70 border border-amber-200 text-[10px] text-amber-900 mb-2 italic leading-relaxed">
                "Khoản 1 Điều 72 Luật ATVSLĐ 2015: Sử dụng từ 50 người lao động trở lên phải bố trí
                người làm công tác ATVSLĐ chuyên trách hoặc thành lập bộ phận ATVSLĐ."
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={citeOver50Safety.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 hover:text-amber-950 hover:underline"
                  title={`Mở trực tiếp toàn văn ${citeOver50Safety.title} trên Dữ Liệu Pháp Luật (DLPL)`}
                >
                  <Scale className="w-3 h-3 text-amber-600" />
                  <span>Văn bản gốc: Khoản 1 Điều 72 Luật ATVSLĐ 2015</span>
                  <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
