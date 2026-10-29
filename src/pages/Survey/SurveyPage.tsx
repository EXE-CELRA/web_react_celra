import React, { useState, useEffect } from 'react';
import type { 
  IndustryTag, 
  BaseProfile 
} from '../../types';
import { 
  INDUSTRY_TAGS, 
  DEFAULT_BASE_PROFILE,
  detectEnterpriseLegalType,
} from '../../data/baseProfile';
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building, 
  Building2, 
  Users, 
  Store, 
  UtensilsCrossed, 
  ShoppingCart, 
  Factory, 
  Code2, 
  GraduationCap, 
  Truck, 
  AlertTriangle, 
  Scale, 
  SlidersHorizontal, 
  ExternalLink,
  Briefcase,
  Lock,
  Search,
  Loader2,
} from 'lucide-react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { getLegalRules } from '../../api/legalApi';
import type { LegalRule } from '../../interfaces';
import { useOrgStore } from '../../store/useOrgStore';

const formatCurrencyToWords = (amount: number): string => {
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
};

export const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useOrgStore();

  const [isSurveyCompleted, setIsSurveyCompleted] = useState<boolean>(() => {
    if (activeOrg?.id) {
      return localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true' || Boolean(activeOrg.taxCode && activeOrg.name);
    }
    return false;
  });

  const [baseProfile, setBaseProfile] = useState<BaseProfile>(() => {
    try {
      const savedCompleted = localStorage.getItem('celra_survey_completed_profile');
      if (savedCompleted) {
        return JSON.parse(savedCompleted);
      }
      const savedDraft = localStorage.getItem('celra_survey_draft_profile');
      if (savedDraft) {
        return JSON.parse(savedDraft);
      }
    } catch {
      // Fallback
    }
    return {
      taxCode: '',
      companyName: '',
      employeeScale: DEFAULT_BASE_PROFILE.employeeScale,
      requiresLaborRuleBook: DEFAULT_BASE_PROFILE.requiresLaborRuleBook,
      companyTypeTag: DEFAULT_BASE_PROFILE.companyTypeTag,
      industryTags: DEFAULT_BASE_PROFILE.industryTags,
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const [taxLookupDetails, setTaxLookupDetails] = useState<{
    taxCode: string;
    name: string;
    address?: string;
    status?: string;
    shortName?: string;
    internationalName?: string;
    legalType?: string;
    isOperating?: boolean;
  } | null>(null);
  const [unsupportedError, setUnsupportedError] = useState<string | null>(null);
  const [duplicateTaxError, setDuplicateTaxError] = useState<string | null>(null);
  const [legalRules, setLegalRules] = useState<Record<string, LegalRule>>({});

  // Tải danh sách quy định pháp luật cốt lõi (có bộ đệm Cache chống gọi liên tục)
  useEffect(() => {
    getLegalRules()
      .then((rulesMap) => {
        setLegalRules(rulesMap as Record<string, LegalRule>);
      })
      .catch((err) => {
        console.warn('[SURVEY] Dùng trích dẫn DLPL fallback:', err?.message);
      });
  }, []);

  // Helper trích xuất văn bản luật và đường dẫn động từ Database (ưu tiên DLPL mới nhất)
  const getRuleCitation = (code: string, citationIndex = 0, defaultDoc: { title: string; url: string; label?: string }) => {
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

  // Đồng bộ tổ chức từ Backend nếu chưa có trong store
  useEffect(() => {
    if (!activeOrg) {
      useOrgStore.getState().fetchMyOrganizations();
    }
  }, [activeOrg]);

  // Sync activeOrg details if available on load
  // Đồng bộ chi tiết activeOrg khi đổi workspace hoặc khi tải trang
  useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id) {
        localStorage.setItem('celra_active_org_id', activeOrg.id);
      }
      
      // Đọc profile riêng của doanh nghiệp này (nếu đã lưu trước đó)
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
        employeeScale: (activeOrg.scale as unknown as typeof DEFAULT_BASE_PROFILE.employeeScale) || scopedProfile?.employeeScale || DEFAULT_BASE_PROFILE.employeeScale,
        employeeCount: activeOrg.employeeCount || scopedProfile?.employeeCount || 0,
        annualRevenue: (activeOrg.revenueStatus === 'over_50b' ? 60000000000 : activeOrg.revenueStatus === 'under_50b' ? 20000000000 : scopedProfile?.annualRevenue || 0),
        isNewlyEstablished: activeOrg.revenueStatus ? (activeOrg.revenueStatus === 'newly_established') : (scopedProfile?.isNewlyEstablished ?? false),
        requiresLaborRuleBook: scopedProfile?.requiresLaborRuleBook ?? DEFAULT_BASE_PROFILE.requiresLaborRuleBook,
        companyTypeTag: scopedProfile?.companyTypeTag || DEFAULT_BASE_PROFILE.companyTypeTag,
        industryTags: scopedProfile?.industryTags || DEFAULT_BASE_PROFILE.industryTags,
      };

      setBaseProfile(next);

      const completed = Boolean(
        (activeOrg.id && localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true') ||
        (activeOrg.taxCode && activeOrg.name)
      );
      setIsSurveyCompleted(completed);

      if (activeOrg.taxCode && activeOrg.name) {
        setTaxLookupDetails({
          taxCode: activeOrg.taxCode || '',
          name: activeOrg.name || '',
          legalType: activeOrg.legalType || 'Công ty TNHH',
          status: 'NNT đang hoạt động',
          isOperating: true,
        });
      }
    }
  }, [activeOrg]);

  const updateBaseProfile = (updates: Partial<BaseProfile>) => {
    setBaseProfile(prev => {
      const next = { ...prev, ...updates };
      if (updates.employeeScale) {
        next.requiresLaborRuleBook = next.employeeScale === '10_to_50' || next.employeeScale === 'over_50';
      }
      try {
        localStorage.setItem('celra_survey_draft_profile', JSON.stringify(next));
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let res: any;

      try {
        // Ưu tiên 1: Tra cứu qua máy chủ Backend CELRA nội bộ
        res = await apiClient.get(`/tax-lookup/${encodeURIComponent(code)}`);
      } catch (backendErr) {
        // Ưu tiên 2: Tự động Fallback gọi trực tiếp Cổng VietQR công khai nếu backend offline
        try {
          const directResp = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(code)}`);
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
        // Kiểm tra độc quyền Mã số thuế trong CELRA
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
          const errorMsg = detected.unsupportedReason || `Hiện tại hệ thống chỉ hỗ trợ loại hình doanh nghiệp Cty 1 thành viên và 2 thành viên trở lên, chưa hỗ trợ loại hình ${detected.label} của bạn.`;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          companyTypeTag: detected.tagId as any,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errMsg = err?.message || err?.error || 'Không tìm thấy dữ liệu hoặc mã số thuế không hợp lệ.';
      message.error(errMsg);
    } finally {
      setIsLookingUpTax(false);
    }
  };

  const handleToggleIndustryTag = (tag: IndustryTag) => {
    if (isSurveyCompleted) return;
    const exists = baseProfile.industryTags.includes(tag);
    if (exists) {
      updateBaseProfile({
        industryTags: baseProfile.industryTags.filter(t => t !== tag)
      });
    } else {
      updateBaseProfile({
        industryTags: [...baseProfile.industryTags, tag]
      });
    }
  };

  const handleSaveAndInitializeContext = async () => {
    if (duplicateTaxError) {
      message.error(duplicateTaxError);
      return;
    }
    if (!baseProfile.taxCode || !baseProfile.companyName) {
      message.warning('Vui lòng nhập Mã số thuế và thực hiện Tra cứu để xác thực doanh nghiệp trước khi tiếp tục.');
      return;
    }
    if (!baseProfile.industryTags || baseProfile.industryTags.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 Ngành nghề & Hoạt động thực tế để tiếp tục.');
      return;
    }

    setSubmitting(true);
    try {
      // Khởi tạo Base Profile và các Context Facts cơ sở
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post(
        '/surveys/submit',
        { 
          baseProfile, 
          questions: [], 
          answers: [] 
        },
        {
          headers: activeOrg?.id ? { 'x-organization-id': activeOrg.id } : {},
        }
      );

      const targetOrgId = res?.organizationId || activeOrg?.id;
      if (targetOrgId) {
        localStorage.setItem('celra_active_org_id', targetOrgId);
        localStorage.setItem(`celra_survey_profile_${targetOrgId}`, JSON.stringify(baseProfile));
        localStorage.setItem(`celra_survey_completed_${targetOrgId}`, 'true');
      }
      await useOrgStore.getState().fetchMyOrganizations();

      setIsSurveyCompleted(true);
      message.success('🎉 Khởi tạo hồ sơ doanh nghiệp thành công! Đang chuyển đến Bối cảnh doanh nghiệp...');
      navigate('/context');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorText = err.response?.data?.message || err.message || 'Lỗi khi khởi tạo bối cảnh doanh nghiệp';
      if (typeof errorText === 'string' && errorText.includes('Mã số thuế')) {
        setDuplicateTaxError(errorText);
      }
      message.error(errorText, 6);
    } finally {
      setSubmitting(false);
    }
  };

  const getCompanyTypeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Store': return <Store className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-blue-600 shrink-0" />;
      case 'Users': return <Users className="w-5 h-5 text-cyan-600 shrink-0" />;
      case 'Building': return <Building className="w-5 h-5 text-purple-600 shrink-0" />;
      default: return <Building className="w-5 h-5 text-slate-600 shrink-0" />;
    }
  };

  const getIndustryIcon = (iconName: string) => {
    switch (iconName) {
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'ShoppingCart': return <ShoppingCart className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'Code2': return <Code2 className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'Factory': return <Factory className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'Truck': return <Truck className="w-4 h-4 text-sky-600 shrink-0" />;
      default: return <Briefcase className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  // =========================================================================
  return (
    <div className="w-full space-y-6 pb-28">
      {/* ========================================================================= */}
      {/* 🟢 KHỐI THU THẬP NỀN TẢNG (Base Profile - FULL WIDTH)                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
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

        {/* Khối Nhập Mã Số Thuế & Tra Cứu */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Mã số thuế doanh nghiệp (MST) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Cơ sở dữ liệu Thuế Quốc gia
              </span>
            </label>
            <div className="flex gap-2 max-w-2xl">
              <input
                type="text"
                value={baseProfile.taxCode}
                onChange={(e) => {
                  const newCode = e.target.value.trim();
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupTax();
                  }
                }}
                disabled={isSurveyCompleted}
                placeholder="Nhập mã số thuế (VD: 0101248141, 0303217354...)"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleLookupTax()}
                disabled={isLookingUpTax || !baseProfile.taxCode || isSurveyCompleted}
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

          {/* Khi Mã số thuế đã được đăng ký bởi doanh nghiệp khác */}
          {duplicateTaxError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-900">
                  Mã số thuế này đã tồn tại trên hệ thống CELRA
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                  {duplicateTaxError}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <em>Để bảo vệ tính toàn vẹn và độc lập dữ liệu giữa các doanh nghiệp, mỗi mã số thuế chỉ được gắn với một tài khoản doanh nghiệp duy nhất. Vui lòng kiểm tra lại mã số thuế hoặc liên hệ ban quản trị để được mời vào doanh nghiệp đã có.</em>
                </p>
              </div>
            </div>
          )}

          {/* Khi loại hình doanh nghiệp chưa được hỗ trợ */}
          {unsupportedError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-900">
                  Chưa hỗ trợ loại hình doanh nghiệp này
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                  {unsupportedError}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <em>Giai đoạn hiện tại của hệ thống CELRA tập trung phục vụ tối ưu cho <strong>Công ty TNHH 1 thành viên</strong> và <strong>Công ty TNHH 2 thành viên trở lên</strong>. Phiên bản dành cho Công ty Cổ phần và Hộ kinh doanh sẽ sớm ra mắt ở đợt cập nhật tiếp theo.</em>
                </p>
              </div>
            </div>
          )}

          {/* Khi chưa tra cứu và không có lỗi: Hiển thị gợi ý */}
          {!taxLookupDetails && !unsupportedError && !duplicateTaxError && (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                Vui lòng nhập Mã số thuế và nhấn <strong>"Tra cứu"</strong> để hệ thống tự động tải và khóa thông tin pháp nhân chính thức từ Tổng cục Thuế.
              </span>
            </div>
          )}

          {/* Khi tra cứu thành công: Hiển thị các thẻ thông tin CHÍNH THỨC */}
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
                {/* Tên doanh nghiệp (Disabled) */}
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

                {/* Hình thức kinh doanh */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {getCompanyTypeIcon(taxLookupDetails.legalType?.includes('1 thành viên') ? 'Building2' : 'Users')}
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

                {/* Địa chỉ trụ sở ĐKKD (Disabled) */}
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

                {/* Tên viết tắt (Disabled) */}
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

                {/* Trạng thái nộp thuế (Disabled) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Trạng thái hoạt động tại Cục Thuế</span>
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                  </label>
                  <div className="p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-emerald-800 text-xs">
                      {taxLookupDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thông số Tài chính & Doanh thu thực tế */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Thông số Doanh thu &amp; Vốn điều lệ
              </span>
            </div>
            <label className={`flex items-center gap-2 text-xs font-medium select-none ${isSurveyCompleted ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}>
              <input
                type="checkbox"
                disabled={isSurveyCompleted}
                checked={baseProfile.isNewlyEstablished || false}
                onChange={(e) => {
                  if (isSurveyCompleted) return;
                  const checked = e.target.checked;
                  updateBaseProfile({
                    isNewlyEstablished: checked,
                    annualRevenue: checked ? 0 : (baseProfile.annualRevenue || 0),
                  });
                }}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span>Doanh nghiệp mới thành lập năm nay</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doanh thu */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Doanh thu năm trước liền kề (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={baseProfile.isNewlyEstablished || isSurveyCompleted}
                  value={baseProfile.isNewlyEstablished ? '0' : Number(baseProfile.annualRevenue || 0).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    if (isSurveyCompleted) return;
                    const rawDigits = e.target.value.replace(/\D/g, '');
                    updateBaseProfile({ annualRevenue: Number(rawDigits) || 0 });
                  }}
                  placeholder="VD: 18,500,000,000"
                  className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                  VNĐ
                </span>
              </div>
              <div className="text-[11px] text-teal-700 font-medium mt-1">
                {baseProfile.isNewlyEstablished
                  ? '🌟 Doanh nghiệp mới thành lập: Tự động áp dụng kê khai thuế theo Quý'
                  : 'Đọc số: ~ ' + formatCurrencyToWords(baseProfile.annualRevenue || 0)}
              </div>
            </div>

            {/* Vốn điều lệ */}
            <div>
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
                    updateBaseProfile({ charterCapital: Number(rawDigits) || 0 });
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
        </div>

        {/* Input 3: Quy mô nhân sự */}
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
                  updateBaseProfile({
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
            {/* Under 10 */}
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
                  "Người sử dụng lao động phải ban hành NQLĐ, nếu sử dụng từ 10 người lao động trở lên thì NQLĐ phải bằng văn bản."
                </div>
                {(() => {
                  const cite1 = getRuleCitation('RULE-LABOR-UNDER10', 0, {
                    title: 'Bộ luật Lao động 2019',
                    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
                  });
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={cite1.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                        title={`Xem Điều 218 ${cite1.title}: Miễn, giảm thủ tục đối với trường hợp sử dụng dưới 10 lao động trên Dữ Liệu Pháp Luật (DLPL)`}
                      >
                        <Scale className="w-3 h-3 text-teal-600" />
                        <span>Điều 218 BLLĐ 2019 (Miễn thủ tục dưới 10 người)</span>
                        <ExternalLink className="w-2.5 h-2.5 text-teal-600" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 10 to 50 */}
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
                  "Khoản 1 Điều 119 BLLĐ 2019: Sử dụng từ 10 người lao động trở lên phải đăng ký NQLĐ tại cơ quan chuyên môn về lao động cấp tỉnh."
                </div>
                {(() => {
                  const citeLaw = getRuleCitation('RULE-LABOR-10TO50', 0, {
                    title: 'Bộ luật Lao động 2019',
                    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
                  });
                  const citePenalty = getRuleCitation('RULE-LABOR-10TO50', 1, {
                    title: 'Nghị định 283/2026/NĐ-CP (Xử phạt lao động mới)',
                    url: 'https://dulieuphapluat.vn/van-ban/bao-hiem-van-ban/nghi-dinh-2832026nd-cp-quy-dinh-xu-phat-vi-pham-hanh-chinh-trong-linh-vuc-lao-dong-bao-hiem-xa-hoi-nguoi-lao-dong-viet-nam-di-lam-viec-o-nuoc-ngoai-theo-hop-dong-1426549.html',
                    label: 'NĐ 283/2026',
                  });
                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={citeLaw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 hover:text-amber-950 hover:underline"
                        title={`Mở trực tiếp toàn văn ${citeLaw.title} trên Dữ Liệu Pháp Luật (DLPL)`}
                      >
                        <Scale className="w-3 h-3 text-amber-600" />
                        <span>Văn bản gốc: Khoản 1 Điều 119 BLLĐ 2019</span>
                        <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                      </a>
                      <a
                        href={citePenalty.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 hover:text-amber-950 hover:underline"
                        title={`Xem chế tài xử phạt mới nhất tại ${citePenalty.title} trên DLPL`}
                      >
                        <span>• Chế tài phạt: NĐ 283/2026</span>
                        <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Over 50 */}
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
                  "Khoản 1 Điều 72 Luật ATVSLĐ 2015: Sử dụng từ 50 người lao động trở lên phải bố trí người làm công tác ATVSLĐ chuyên trách hoặc thành lập bộ phận ATVSLĐ."
                </div>
                {(() => {
                  const citeSafety = getRuleCitation('RULE-LABOR-OVER50', 0, {
                    title: 'Luật An toàn, vệ sinh lao động 2015',
                    url: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/luat-an-toan-ve-sinh-lao-dong-2015-285199.html',
                  });
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={citeSafety.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 hover:text-amber-950 hover:underline"
                        title={`Mở trực tiếp toàn văn ${citeSafety.title} trên Dữ Liệu Pháp Luật (DLPL)`}
                      >
                        <Scale className="w-3 h-3 text-amber-600" />
                        <span>Văn bản gốc: Khoản 1 Điều 72 Luật ATVSLĐ 2015</span>
                        <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Input 5: Chọn Ngành nghề & Hoạt động thực tế */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              Chọn Ngành nghề &amp; Hoạt động thực tế: <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Được chọn nhiều ngành thực tế</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRY_TAGS.map((tag) => {
              const isSelected = baseProfile.industryTags.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  onClick={() => {
                    if (!isSurveyCompleted) handleToggleIndustryTag(tag.id);
                  }}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isSurveyCompleted
                      ? 'cursor-not-allowed opacity-90'
                      : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
                      : isSurveyCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                      {getIndustryIcon(tag.iconName)}
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">
                      {tag.label}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {tag.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Hệ thống sẽ tự động khởi tạo các thẻ bối cảnh ban đầu và chuyển bạn đến ma trận tuân thủ.</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndInitializeContext}
            disabled={submitting || !!duplicateTaxError || !!unsupportedError}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo bối cảnh...</span>
              </>
            ) : (
              <>
                <span>Lưu &amp; Khởi Tạo Bối Cảnh Doanh Nghiệp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
