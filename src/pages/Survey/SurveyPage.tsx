import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { IndustryTag, BaseProfile } from '../../types';
import { DEFAULT_BASE_PROFILE, detectEnterpriseLegalType } from '../../data/baseProfile';
import apiClient from '../../api/client';
import { getLegalRules } from '../../api/legalApi';
import type { LegalRule } from '../../interfaces';
import { useOrgStore } from '../../store/useOrgStore';
import { TaxLookupSection, type TaxLookupDetails } from './components/TaxLookupSection';
import { FinancialAndLaborSection } from './components/FinancialAndLaborSection';
import { IndustryTagsSection } from './components/IndustryTagsSection';

export const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg, isLoading: isOrgLoading, hasInitialized: hasOrgInitialized } = useOrgStore();

  // Kiểm tra tức thì từ localStorage & activeOrg để chặn đứng việc chớp modal
  const activeOrgId =
    activeOrg?.id ||
    (typeof window !== 'undefined' ? localStorage.getItem('celra_active_org_id') : null);
  const initialCompleted = Boolean(
    (activeOrgId &&
      typeof window !== 'undefined' &&
      localStorage.getItem(`celra_survey_completed_${activeOrgId}`) === 'true') ||
      (activeOrg?.taxCode && activeOrg?.name && activeOrg.taxCode !== 'MST-temp'),
  );

  const [isSurveyCompleted, setIsSurveyCompleted] = useState<boolean>(initialCompleted);
  const [baseProfile, setBaseProfile] = useState<BaseProfile>(() => {
    const orgId =
      activeOrg?.id ||
      (typeof window !== 'undefined' ? localStorage.getItem('celra_active_org_id') : null);
    if (orgId) {
      try {
        const savedProfile = localStorage.getItem(`celra_survey_profile_${orgId}`);
        if (savedProfile) return JSON.parse(savedProfile);
        const savedDraft = localStorage.getItem(`celra_survey_draft_profile_${orgId}`);
        if (savedDraft) return JSON.parse(savedDraft);
      } catch {
        // Fallback
      }
    }
    return {
      taxCode: '',
      companyName: '',
      employeeScale: DEFAULT_BASE_PROFILE.employeeScale,
      companyTypeTag: DEFAULT_BASE_PROFILE.companyTypeTag,
      industryTags: [],
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const [taxLookupDetails, setTaxLookupDetails] = useState<TaxLookupDetails | null>(null);
  const [unsupportedError, setUnsupportedError] = useState<string | null>(null);
  const [duplicateTaxError, setDuplicateTaxError] = useState<string | null>(null);
  const [legalRules, setLegalRules] = useState<Record<string, LegalRule>>({});

  useEffect(() => {
    getLegalRules()
      .then((rulesMap) => {
        setLegalRules(rulesMap as Record<string, LegalRule>);
      })
      .catch((err) => {
        console.warn('[SURVEY] Dùng trích dẫn DLPL fallback:', err?.message);
      });
  }, []);

  useEffect(() => {
    if (!activeOrg) {
      useOrgStore.getState().fetchMyOrganizations();
    }
  }, [activeOrg]);

  // Đồng bộ chi tiết activeOrg khi đổi workspace hoặc khi tải trang
  useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id) {
        localStorage.setItem('celra_active_org_id', activeOrg.id);
      }

      let scopedProfile: Partial<BaseProfile> | null = null;
      if (activeOrg.id) {
        const raw = localStorage.getItem(`celra_survey_profile_${activeOrg.id}`);
        if (raw) {
          try {
            scopedProfile = JSON.parse(raw);
          } catch {
            // Ignore
          }
        }
      }

      const next: BaseProfile = {
        taxCode: activeOrg.taxCode || scopedProfile?.taxCode || '',
        companyName: activeOrg.name || scopedProfile?.companyName || '',
        employeeScale:
          (activeOrg.scale as unknown as typeof DEFAULT_BASE_PROFILE.employeeScale) ||
          scopedProfile?.employeeScale ||
          DEFAULT_BASE_PROFILE.employeeScale,
        employeeCount: activeOrg.employeeCount || scopedProfile?.employeeCount || 0,
        annualRevenue:
          activeOrg.revenueStatus === 'over_50b'
            ? 60000000000
            : activeOrg.revenueStatus === 'under_50b'
              ? 20000000000
              : scopedProfile?.annualRevenue || 0,
        isNewlyEstablished: activeOrg.revenueStatus
          ? activeOrg.revenueStatus === 'newly_established'
          : (scopedProfile?.isNewlyEstablished ?? false),
        companyTypeTag: scopedProfile?.companyTypeTag || DEFAULT_BASE_PROFILE.companyTypeTag,
        industryTags: scopedProfile?.industryTags || [],
      };

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBaseProfile(next);

      const completed = Boolean(
        (activeOrg.id && localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true') ||
          (activeOrg.taxCode && activeOrg.name && activeOrg.taxCode !== 'MST-temp'),
      );
      if (completed && activeOrg.id) {
        localStorage.setItem(`celra_survey_completed_${activeOrg.id}`, 'true');
      }
      setIsSurveyCompleted(completed);

      if (completed) {
        navigate('/context', { replace: true });
        return;
      }

      if (activeOrg.taxCode && activeOrg.name) {
        setTaxLookupDetails({
          taxCode: activeOrg.taxCode || '',
          name: activeOrg.name || '',
          legalType: activeOrg.legalType || 'Công ty TNHH',
          status: 'NNT đang hoạt động',
          isOperating: true,
        });
      }
    } else {
      setIsSurveyCompleted(false);
      setTaxLookupDetails(null);
      setBaseProfile({
        taxCode: '',
        companyName: '',
        employeeScale: DEFAULT_BASE_PROFILE.employeeScale,
        companyTypeTag: DEFAULT_BASE_PROFILE.companyTypeTag,
        industryTags: [],
      });
    }
  }, [activeOrg, navigate]);

  const updateBaseProfile = (updates: Partial<BaseProfile>) => {
    setBaseProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        const orgId = activeOrg?.id || localStorage.getItem('celra_active_org_id');
        if (orgId) {
          localStorage.setItem(`celra_survey_draft_profile_${orgId}`, JSON.stringify(next));
        }
        if (updates.companyName) {
          window.dispatchEvent(new Event('celra_profile_updated'));
        }
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleLookupTax = async (codeToLookup?: string) => {
    const code = (codeToLookup || baseProfile.taxCode || '').trim();
    if (!code) {
      message.warning('Vui lòng nhập Mã số thuế trước khi tra cứu');
      return;
    }
    if (code.length < 10) {
      message.warning('Mã số thuế doanh nghiệp phải có từ 10 đến 13 chữ số');
      return;
    }

    try {
      setIsLookingUpTax(true);
      setUnsupportedError(null);
      setDuplicateTaxError(null);
      let res: (TaxLookupDetails & {
        isRegisteredInCelra?: boolean;
        registeredOrgId?: string;
        registeredOrgName?: string;
      }) | null = null;

      try {
        res = (await apiClient.get(`/tax-lookup/${encodeURIComponent(code)}`)) as unknown as typeof res;
      } catch (backendErr) {
        try {
          const directResp = await fetch(
            `https://api.vietqr.io/v2/business/${encodeURIComponent(code)}`,
          );
          const json = await directResp.json();
          if (json && (json.code === '00' || json.data) && json.data?.name) {
            res = {
              taxCode: json.data?.id || code,
              name: json.data?.name,
              address: json.data?.address || '',
              shortName: json.data?.shortName || '',
              internationalName: json.data?.internationalName || '',
              status: json.data?.status || 'NNT đang hoạt động',
              isOperating: true,
            };
          } else {
            throw backendErr;
          }
        } catch {
          throw backendErr;
        }
      }

      if (res && res.name) {
        if (res.isRegisteredInCelra && res.registeredOrgId !== activeOrg?.id) {
          const dupMsg = `Mã số thuế ${code} đã được đăng ký bởi doanh nghiệp "${res.registeredOrgName || res.name}" trên hệ thống CELRA. Mỗi doanh nghiệp chỉ được sử dụng một mã số thuế duy nhất.`;
          setDuplicateTaxError(dupMsg);
          message.error(dupMsg, 7);
          setTaxLookupDetails(null);
          setUnsupportedError(null);
          updateBaseProfile({ companyName: '', taxCode: code });
          return;
        }

        setDuplicateTaxError(null);
        const detected = detectEnterpriseLegalType(res.name);

        if (!detected.isSupported) {
          const errorMsg =
            detected.unsupportedReason ||
            `Hiện tại hệ thống chỉ hỗ trợ loại hình doanh nghiệp Cty 1 thành viên và 2 thành viên trở lên, chưa hỗ trợ loại hình ${detected.label} của bạn.`;
          setUnsupportedError(errorMsg);
          message.error(errorMsg, 6);
          setTaxLookupDetails(null);
          updateBaseProfile({ companyName: '', taxCode: code });
          return;
        }

        setUnsupportedError(null);
        updateBaseProfile({
          companyName: res.name,
          taxCode: res.taxCode || code,
          companyTypeTag: detected.tagId as BaseProfile['companyTypeTag'],
        });

        setTaxLookupDetails({
          taxCode: res.taxCode || code,
          name: res.name,
          address: res.address || '',
          status: res.status || 'NNT đang hoạt động',
          shortName: res.shortName || '',
          internationalName: res.internationalName || '',
          legalType: detected.label,
          isOperating: res.isOperating !== false,
        });

        message.success(`Đã tự động nhận diện: ${res.name} (${detected.label})`);
      } else {
        message.warning('Không tìm thấy thông tin công ty với mã số thuế này.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      message.error(e?.message || e?.error || 'Không tìm thấy dữ liệu hoặc mã số thuế không hợp lệ.');
    } finally {
      setIsLookingUpTax(false);
    }
  };

  const handleToggleIndustryTag = (tag: IndustryTag) => {
    if (isSurveyCompleted) return;
    const exists = baseProfile.industryTags.includes(tag);
    updateBaseProfile({
      industryTags: exists
        ? baseProfile.industryTags.filter((t) => t !== tag)
        : [...baseProfile.industryTags, tag],
    });
  };

  const handleSaveAndInitializeContext = async () => {
    if (duplicateTaxError) {
      message.error(duplicateTaxError);
      return;
    }
    if (!baseProfile.taxCode || !baseProfile.companyName) {
      message.warning(
        '⚠️ Bắt buộc: Vui lòng nhập Mã số thuế và nhấn "Tra cứu" để hệ thống tự động xác thực pháp nhân từ CSDL Thuế Quốc gia.',
      );
      return;
    }
    if (!taxLookupDetails && !activeOrg?.name) {
      message.warning(
        '⚠️ Bắt buộc: Vui lòng nhấn nút "Tra cứu" để xác nhận thông tin doanh nghiệp trước khi lưu.',
      );
      return;
    }
    if (
      !baseProfile.isNewlyEstablished &&
      (baseProfile.annualRevenue === undefined || baseProfile.annualRevenue < 0)
    ) {
      message.warning(
        '⚠️ Bắt buộc: Vui lòng nhập Doanh thu năm trước liền kề (nếu mới thành lập vui lòng chọn checkbox "Doanh nghiệp mới thành lập").',
      );
      return;
    }
    if (!baseProfile.charterCapital || baseProfile.charterCapital <= 0) {
      message.warning('⚠️ Bắt buộc: Vui lòng nhập Vốn điều lệ đăng ký trên ĐKKD lớn hơn 0 VNĐ.');
      return;
    }
    if (!baseProfile.employeeCount || baseProfile.employeeCount <= 0) {
      message.warning(
        '⚠️ Bắt buộc: Vui lòng nhập Số lượng nhân sự đang làm việc thực tế lớn hơn 0 người.',
      );
      return;
    }
    if (!baseProfile.industryTags || baseProfile.industryTags.length === 0) {
      message.warning(
        '⚠️ Bắt buộc: Vui lòng chọn ít nhất 1 Ngành nghề & Hoạt động thực tế của doanh nghiệp để hệ thống kích hoạt đúng bộ quy tắc tuân thủ.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = (await apiClient.post(
        '/surveys/submit',
        { baseProfile, questions: [], answers: [] },
        { headers: activeOrg?.id ? { 'x-organization-id': activeOrg.id } : {} },
      )) as unknown as { organizationId?: string };

      const targetOrgId = res?.organizationId || activeOrg?.id;
      if (targetOrgId) {
        localStorage.setItem('celra_active_org_id', targetOrgId);
        localStorage.setItem(`celra_survey_profile_${targetOrgId}`, JSON.stringify(baseProfile));
        localStorage.setItem(`celra_survey_completed_${targetOrgId}`, 'true');
      }
      await useOrgStore.getState().fetchMyOrganizations();

      setIsSurveyCompleted(true);
      message.success(
        '🎉 Thiết lập hồ sơ doanh nghiệp thành công! Đang chuyển đến Bối cảnh doanh nghiệp...',
      );
      navigate('/context');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const errorText =
        e?.response?.data?.message || e?.message || 'Lỗi khi thiết lập hồ sơ doanh nghiệp';
      if (typeof errorText === 'string' && errorText.includes('Mã số thuế')) {
        setDuplicateTaxError(errorText);
      }
      message.error(errorText, 6);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSurveyCompleted || initialCompleted || (!hasOrgInitialized && Boolean(activeOrgId)) || isOrgLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl max-w-7xl w-full my-auto space-y-6 max-h-[96vh] overflow-y-auto no-scrollbar relative animate-in fade-in zoom-in-95 duration-200">
        {!isSurveyCompleted && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-2 border-amber-400/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-950 m-0">
                Thiết Lập Hồ Sơ Cơ Sở &amp; Bối Cảnh Doanh Nghiệp Ban Đầu
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed m-0 font-medium">
                Hệ thống CELRA yêu cầu xác thực các thông số pháp lý, quy mô nhân sự, tài chính và
                ngành nghề kinh doanh ban đầu bên dưới để tự động thiết lập{' '}
                <strong>Ma Trận Quản Trị &amp; Tuân Thủ Pháp Luật</strong>.
                <strong className="block mt-1 text-amber-950 font-bold">
                  👉 Vui lòng hoàn tất và bấm "Thiết Lập Hồ Sơ Doanh Nghiệp" ở cuối để kích hoạt
                  toàn bộ không gian làm việc.
                </strong>
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Thông tin Pháp nhân &amp; Đặc thù Doanh nghiệp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xác thực mã số thuế và các thông số hoạt động cốt lõi của doanh nghiệp.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Mã số thuế & Pháp nhân */}
        <TaxLookupSection
          taxCode={baseProfile.taxCode}
          isSurveyCompleted={isSurveyCompleted}
          isLookingUpTax={isLookingUpTax}
          taxLookupDetails={taxLookupDetails}
          duplicateTaxError={duplicateTaxError}
          unsupportedError={unsupportedError}
          onTaxCodeChange={(newCode) => {
            updateBaseProfile({ taxCode: newCode, companyName: '' });
            setTaxLookupDetails(null);
            setUnsupportedError(null);
            setDuplicateTaxError(null);
            try {
              localStorage.removeItem('celra_tax_lookup_details');
            } catch {
              // Ignore
            }
          }}
          onLookupTax={() => handleLookupTax()}
        />

        {/* 2. Tài chính, Sàng lọc Thuế suất TNDN & Quy mô nhân sự */}
        <FinancialAndLaborSection
          baseProfile={baseProfile}
          isSurveyCompleted={isSurveyCompleted}
          legalRules={legalRules}
          onUpdateProfile={updateBaseProfile}
        />

        {/* 3. Ngành nghề & Hoạt động thực tế */}
        <IndustryTagsSection
          selectedTags={baseProfile.industryTags}
          isSurveyCompleted={isSurveyCompleted}
          onToggleTag={handleToggleIndustryTag}
        />

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-end pt-6 border-t border-slate-100 gap-4">
          <button
            type="button"
            onClick={handleSaveAndInitializeContext}
            disabled={submitting || !!duplicateTaxError || !!unsupportedError}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thiết lập hồ sơ...</span>
              </>
            ) : (
              <>
                <span>Thiết Lập Hồ Sơ Doanh Nghiệp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
