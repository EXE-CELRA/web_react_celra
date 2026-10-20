import React, { useState, useEffect } from 'react';
import type { 
  IndustryTag, 
  DynamicSituationQuestion,
  BaseProfile 
} from '../../types';
import { 
  COMPANY_TYPE_TAGS, 
  INDUSTRY_TAGS, 
  DEFAULT_BASE_PROFILE,
  generateDynamicQuestions,
  detectEnterpriseLegalType
} from '../../data/surveySchema';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ListChecks, 
  Check, 
  RotateCcw, 
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
  ChevronRight,
  Briefcase,
  Lock,
  Search,
  Loader2,
} from 'lucide-react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { getLegalRules } from '../../api/legalApi';
import { useOrgStore } from '../../store/useOrgStore';
import { UnsavedChangesModal } from '../../components/common/UnsavedChangesModal';

type LegalRule = {
  code?: string;
  legalReference?: string;
  conditionSummary?: string;
  conditionsJson?: {
    citations?: Array<{
      title?: string;
      sourceUrl?: string;
      articleNumber?: string;
    }>;
  };
};

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
    return localStorage.getItem('celra_survey_completed') === 'true';
  });

  const [baseProfile, setBaseProfile] = useState<BaseProfile>(() => {
    try {
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

  // Wizard Navigation: step 1 = Base Profile, step 2 = Dynamic Questions, step 3 = Summary & Activation
  const [activeTabStep, setActiveTabStep] = useState<1 | 2 | 3>(1);

  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicSituationQuestion[]>(() => {
    const baseList = generateDynamicQuestions(baseProfile);
    try {
      const savedAnswers = localStorage.getItem('celra_survey_draft_answers');
      if (savedAnswers) {
        const answersMap = JSON.parse(savedAnswers);
        return baseList.map(q => ({
          ...q,
          selectedOption: answersMap[q.id] !== undefined ? answersMap[q.id] : q.selectedOption,
        }));
      }
    } catch {
      // Fallback
    }
    return baseList;
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
  const [legalRules, setLegalRules] = useState<Record<string, LegalRule>>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);

  // Ánh xạ câu hỏi với mã quy tắc pháp luật trong Database (được đồng bộ từ API Dữ Liệu Pháp Luật - DLPL)
  const QUESTION_RULE_MAP: Record<string, string> = {
    q_tax_corp_1: 'RULE-TAX-GTGT',
    q_tax_corp_2: 'RULE-TAX-TNDN-80',
    q_tax_corp_3: 'RULE-TAX-EXP-20M',
    q_tax_monbai: 'RULE-TAX-MONBAI',
    q_tax_bank_account: 'RULE-CORP-AMEND-10D',
    q_fnb_tax_1: 'RULE-TAX-POS-FNB',
    q_fnb_tax_2: 'RULE-FNB-POS-INVOICE',
    q_ecom_tax_1: 'RULE-ECOM-REVENUE-SYNC',
    q_tax_salary_1: 'RULE-TAX-EXP-20M',
    q_tax_salary_2: 'RULE-LABOR-10TO50',
    q_bhxh_mandatory: 'RULE-LABOR-BHXH-MONTHLY',
    q_labor_report_biannual: 'RULE-LABOR-REPORT-6M',
    q_corp_capital_90d: 'RULE-CORP-CAPITAL-90D',
    q_corp_amend_10d: 'RULE-CORP-AMEND-10D',
    q_fnb_food_safety: 'RULE-LICENSING-ATTP',
    q_ecom_bct_notification: 'RULE-ECOM-BCT-NOTIFY',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichQuestionsWithLegalRules = (questions: DynamicSituationQuestion[], rules: Record<string, any>) => {
    if (!rules || Object.keys(rules).length === 0) return questions;
    return questions.map(q => {
      const ruleCode = QUESTION_RULE_MAP[q.id];
      if (ruleCode && rules[ruleCode]) {
        const rule = rules[ruleCode];
        const primaryCitation = rule?.conditionsJson?.citations?.[0];
        const dynamicOptions = rule?.conditionsJson?.options || rule?.options;
        return {
          ...q,
          options: Array.isArray(dynamicOptions) && dynamicOptions.length > 0 ? dynamicOptions : q.options,
          legalBasis: rule.legalReference ? `${rule.legalReference}. ${rule.conditionSummary || ''}` : q.legalBasis,
          verificationUrl: primaryCitation?.sourceUrl || q.verificationUrl,
        };
      }
      return q;
    });
  };

  // Tải danh sách quy định pháp luật cốt lõi (có bộ đệm Cache chống gọi liên tục)
  useEffect(() => {
    getLegalRules()
      .then((rulesMap) => {
        setLegalRules(rulesMap as Record<string, LegalRule>);
        setDynamicQuestions(currentList => enrichQuestionsWithLegalRules(currentList, rulesMap));
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
  useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id) {
        localStorage.setItem('celra_active_org_id', activeOrg.id);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBaseProfile(prev => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeScale: (activeOrg.scale as any) || prev.employeeScale,
      }));
    }
  }, [activeOrg]);

  const updateBaseProfile = (updates: Partial<BaseProfile>) => {
    setBaseProfile(prev => {
      const next = { ...prev, ...updates };
      if (updates.employeeScale) {
        next.requiresLaborRuleBook = next.employeeScale === '10_to_50' || next.employeeScale === 'over_50';
      }
      const rawQuestions = generateDynamicQuestions(next);
      const newQuestions = enrichQuestionsWithLegalRules(rawQuestions, legalRules);
      setDynamicQuestions(currentList => {
        return newQuestions.map(nq => {
          const existing = currentList.find(cq => cq.id === nq.id);
          return existing ? { ...nq, selectedOption: existing.selectedOption } : nq;
        });
      });
      try {
        localStorage.setItem('celra_survey_draft_profile', JSON.stringify(next));
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
    } catch (err: any) {
      const errMsg = err?.message || err?.error || 'Không tìm thấy dữ liệu hoặc mã số thuế không hợp lệ.';
      message.error(errMsg);
    } finally {
      setIsLookingUpTax(false);
    }
  };

  const handleToggleIndustryTag = (tag: IndustryTag) => {
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

  const handleProceedToStep2 = () => {
    if (!baseProfile.taxCode || !baseProfile.companyName) {
      message.warning('Vui lòng nhập Mã số thuế và thực hiện Tra cứu để xác thực doanh nghiệp trước khi tiếp tục.');
      return;
    }
    if (!baseProfile.industryTags || baseProfile.industryTags.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 Ngành nghề & Hoạt động thực tế để tiếp tục.');
      return;
    }
    setActiveTabStep(2);
  };

  const answerDynamicQuestion = (questionId: string, option: string) => {
    setDynamicQuestions(prev => {
      const updated = prev.map(q => q.id === questionId ? { ...q, selectedOption: option } : q);
      try {
        const answersMap: Record<string, string> = {};
        updated.forEach(q => {
          if (q.selectedOption) answersMap[q.id] = q.selectedOption;
        });
        localStorage.setItem('celra_survey_draft_answers', JSON.stringify(answersMap));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const resetSurveyStatus = () => {
    localStorage.removeItem('celra_survey_completed');
    localStorage.removeItem('celra_survey_draft_answers');
    localStorage.removeItem('celra_survey_draft_profile');
    setIsSurveyCompleted(false);
    setActiveTabStep(1);
    setDynamicQuestions(generateDynamicQuestions(baseProfile));
    message.warning('Đã khóa lại hệ thống để bạn tiến hành thử nghiệm khảo sát!');
  };

  const finishDynamicSurvey = async () => {
    setSubmitting(true);
    try {
      const answers = dynamicQuestions.map((q, idx) => ({
        questionId: idx + 1,
        selectedOption: q.selectedOption || 'Chưa thực hiện / Chưa có',
        note: `[${q.branchCode}] ${q.title}`,
      }));

      await apiClient.post('/surveys/submit', { 
        baseProfile, 
        questions: dynamicQuestions, 
        answers 
      });
      localStorage.setItem('celra_survey_completed', 'true');
      localStorage.removeItem('celra_survey_draft_answers');
      localStorage.removeItem('celra_survey_draft_profile');
      setIsSurveyCompleted(true);

      message.success('🎉 Đã kích hoạt hệ thống! Thiết lập thành công các thẻ Bối cảnh tuân thủ.');
      navigate('/context');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu khảo sát bối cảnh');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = dynamicQuestions.filter(q => q.selectedOption !== undefined).length;
  const totalCount = dynamicQuestions.length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Cảnh báo người dùng nếu đóng tab hoặc tải lại trang khi đang trả lời dở dang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSurveyCompleted && answeredCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSurveyCompleted, answeredCount]);

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

  // Group questions by Compliance Module for Step 2
  const taxModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_TAX_CORE');
  const invoiceModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_INVOICE_CASHFLOW');
  const laborModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_LABOR_HR');
  const licensingModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_LICENSING_ATTP' || q.moduleId === 'MODULE_ECOM_DATA_PRIVACY');
  const otherQuestions = dynamicQuestions.filter(q => 
    !q.moduleId || 
    (q.moduleId !== 'MODULE_TAX_CORE' && 
     q.moduleId !== 'MODULE_INVOICE_CASHFLOW' && 
     q.moduleId !== 'MODULE_LABOR_HR' && 
     q.moduleId !== 'MODULE_LICENSING_ATTP' && 
     q.moduleId !== 'MODULE_ECOM_DATA_PRIVACY')
  );

  // =========================================================================
  // 🔒 MÀN HÌNH KHÓA KHẢO SÁT KHI ĐÃ HOÀN TẤT THU THẬP BỐI CẢNH 360 ĐỘ
  // =========================================================================
  if (isSurveyCompleted) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 pt-2">
        {/* Main Lock Card */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-teal-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wide">
                <Lock className="w-3.5 h-3.5" />
                <span>HỒ SƠ TUÂN THỦ 360° ĐÃ ĐƯỢC THIẾT LẬP &amp; KHÓA AN TOÀN</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Khảo Sát Tuân Thủ Đã Hoàn Tất Thành Công
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Doanh nghiệp của bạn đã hoàn thành khảo sát tuân thủ toàn diện bao trùm 6 trụ cột luật định (Thuế, Hóa đơn, Lao động, BHXH, Vốn điều lệ &amp; Giấy phép chuyên ngành). Toàn bộ dữ kiện bối cảnh (<span className="text-teal-300 font-semibold">Context Facts</span>) đã được lưu trữ cố định để vận hành rà soát tự động mà không bị ghi đè.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => navigate('/context')}
                className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Xem Thẻ Bối Cảnh (Context Hub)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Về Bảng Điều Khiển</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Pillars Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Thuế */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 1</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Thuế Doanh Nghiệp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kỳ kê khai GTGT &amp; TNCN (Tháng/Quý), tạm nộp 80% thuế TNDN 4 quý, lệ phí môn bài và khấu trừ TNCN tại nguồn.
            </p>
          </div>

          {/* Card 2: Hóa đơn & Dòng tiền */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 2</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hóa Đơn &amp; Dòng Tiền</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              HĐĐT máy tính tiền POS, thanh toán không dùng tiền mặt &gt; 20 triệu, đối soát sao kê ngân hàng và dòng tiền COD sàn TMĐT.
            </p>
          </div>

          {/* Card 3: Lao động & Tiền lương */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 3</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Lao Động &amp; Tiền Lương</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hợp đồng lao động, Bảng chấm công, Thang bảng lương định ngạch và thủ tục đăng ký Nội quy lao động tại Phòng LĐ-TB&amp;XH.
            </p>
          </div>

          {/* Card 4: BHXH & Khai trình */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 4</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bảo Hiểm Xã Hội &amp; Khai Trình</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trích nộp BHXH bắt buộc định kỳ hàng tháng cho người lao động và Báo cáo tình hình thay đổi lao động 6 tháng một lần.
            </p>
          </div>

          {/* Card 5: Pháp lý Doanh nghiệp & Vốn */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 5</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Pháp Lý &amp; Vốn Điều Lệ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cam kết góp đủ 100% vốn điều lệ trong 90 ngày kể từ ngày cấp ĐKKD và đăng ký thay đổi nội dung ĐKKD trong 10 ngày làm việc.
            </p>
          </div>

          {/* Card 6: Giấy phép con & Chuyên ngành */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Trụ Cột 6</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu thập
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Giấy Phép Con &amp; Ngành Nghề</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chứng nhận An toàn thực phẩm cho cơ sở F&amp;B hoặc Thủ tục thông báo website thương mại điện tử với Bộ Công Thương.
            </p>
          </div>
        </div>

        {/* Informative Callout for New Laws */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Cơ Chế Cập Nhật Tự Động Khi Có Luật Mới Ban Hành
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Hệ thống tuân thủ nguyên tắc <strong>"Luật không hồi tố"</strong>. Khi cơ quan nhà nước ban hành văn bản luật mới và được Admin phê duyệt, bạn <strong>KHÔNG CẦN</strong> phải làm lại bài khảo sát này. Hệ thống sẽ hiển thị thông báo trên Bảng điều khiển (Dashboard) và bạn chỉ mất đúng 30 giây để xác nhận riêng câu hỏi bị ảnh hưởng.
            </p>
          </div>
        </div>

        {/* Discreet Test Reset */}
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={resetSurveyStatus}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Mở khóa khảo sát để thử nghiệm lại (Dành cho nhà phát triển / Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-28">

      {/* Modern 3-Step Stepper Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setActiveTabStep(1)}
            className={`group relative p-4 lg:p-5 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
              activeTabStep === 1
                ? 'bg-gradient-to-b from-teal-50/50 to-white'
                : 'bg-white hover:bg-slate-50/80'
            }`}
          >
            {/* Top Accent Indicator Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                activeTabStep === 1
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500'
                  : 'bg-transparent group-hover:bg-slate-200'
              }`}
            />
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                  activeTabStep === 1
                    ? 'bg-teal-600 text-white shadow-teal-500/30 shadow-md ring-4 ring-teal-500/15'
                    : baseProfile.taxCode && baseProfile.companyName
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {activeTabStep !== 1 && baseProfile.taxCode && baseProfile.companyName ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span>1</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wider font-bold truncate ${
                      activeTabStep === 1 ? 'text-teal-950 font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    Bước 1: Nền tảng
                  </span>
                  {baseProfile.taxCode && baseProfile.companyName && (
                    <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã điền
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  Mã số thuế, quy mô &amp; Thẻ Tag định danh
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 shrink-0 hidden md:block transition-transform duration-200 ${
                activeTabStep === 1
                  ? 'text-teal-600 translate-x-0.5'
                  : 'text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5'
              }`}
            />
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={handleProceedToStep2}
            className={`group relative p-4 lg:p-5 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
              activeTabStep === 2
                ? 'bg-gradient-to-b from-teal-50/50 to-white'
                : 'bg-white hover:bg-slate-50/80'
            }`}
          >
            {/* Top Accent Indicator Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                activeTabStep === 2
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500'
                  : 'bg-transparent group-hover:bg-slate-200'
              }`}
            />
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                  activeTabStep === 2
                    ? 'bg-teal-600 text-white shadow-teal-500/30 shadow-md ring-4 ring-teal-500/15'
                    : answeredCount === totalCount && totalCount > 0
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {answeredCount === totalCount && totalCount > 0 && activeTabStep !== 2 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span>2</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wider font-bold truncate ${
                      activeTabStep === 2 ? 'text-teal-950 font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    Bước 2: Tình huống Dynamic
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono transition-colors ${
                      answeredCount === totalCount && totalCount > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : answeredCount > 0
                        ? 'bg-teal-100 text-teal-800 border border-teal-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {answeredCount}/{totalCount}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  Tự động xổ câu hỏi theo các thẻ đã chọn
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 shrink-0 hidden md:block transition-transform duration-200 ${
                activeTabStep === 2
                  ? 'text-teal-600 translate-x-0.5'
                  : 'text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5'
              }`}
            />
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => {
              if (!baseProfile.industryTags || baseProfile.industryTags.length === 0) {
                message.warning('Vui lòng chọn ít nhất 1 Ngành nghề & Hoạt động thực tế để tiếp tục.');
                return;
              }
              setActiveTabStep(3);
            }}
            className={`group relative p-4 lg:p-5 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
              activeTabStep === 3
                ? 'bg-gradient-to-b from-teal-50/50 to-white'
                : 'bg-white hover:bg-slate-50/80'
            }`}
          >
            {/* Top Accent Indicator Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                activeTabStep === 3
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500'
                  : 'bg-transparent group-hover:bg-slate-200'
              }`}
            />
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                  activeTabStep === 3
                    ? 'bg-teal-600 text-white shadow-teal-500/30 shadow-md ring-4 ring-teal-500/15'
                    : isSurveyCompleted
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isSurveyCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span>3</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase tracking-wider font-bold truncate ${
                      activeTabStep === 3 ? 'text-teal-950 font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    Bước 3: Mở khóa hệ thống
                  </span>
                  {isSurveyCompleted ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đã mở
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Kích hoạt
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  Kích hoạt Rule Engine &amp; sinh Checklist
                </p>
              </div>
            </div>
            <div className="shrink-0 hidden md:block">
              {isSurveyCompleted ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🟢 BƯỚC 1: THU THẬP NỀN TẢNG (Base Profile - 1 Phút)                      */}
      {/* ========================================================================= */}
      {activeTabStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Bước 1: Thu thập nền tảng &amp; Nhận diện đặc thù Doanh nghiệp
                  </h2>
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
                <div className="flex gap-2 max-w-xl">
                  <input
                    type="text"
                    value={baseProfile.taxCode}
                    onChange={(e) => {
                      const newCode = e.target.value.trim();
                      updateBaseProfile({ taxCode: newCode, companyName: '' });
                      setTaxLookupDetails(null);
                      setUnsupportedError(null);
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
                    placeholder="Nhập mã số thuế (VD: 0101248141, 0303217354...)"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupTax()}
                    disabled={isLookingUpTax || !baseProfile.taxCode}
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
              {!taxLookupDetails && !unsupportedError && (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    Vui lòng nhập Mã số thuế và nhấn <strong>"Tra cứu"</strong> để hệ thống tự động tải và khóa thông tin pháp nhân chính thức từ Tổng cục Thuế.
                  </span>
                </div>
              )}

              {/* Khi tra cứu thành công: Hiển thị các thẻ thông tin CHÍNH THỨC VÀ KHÓA (DISABLE) KHÔNG CHO SỬA */}
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

                    {/* Hình thức kinh doanh (Đã tự động bóc tách & Khóa cứng) */}
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
                    Thông số Doanh thu & Vốn điều lệ
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={baseProfile.isNewlyEstablished || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateBaseProfile({
                        isNewlyEstablished: checked,
                        annualRevenue: checked ? 0 : (baseProfile.annualRevenue || 0),
                      });
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
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
                      disabled={baseProfile.isNewlyEstablished}
                      value={baseProfile.isNewlyEstablished ? '0' : Number(baseProfile.annualRevenue || 0).toLocaleString('vi-VN')}
                      onChange={(e) => {
                        const rawDigits = e.target.value.replace(/\D/g, '');
                        updateBaseProfile({ annualRevenue: Number(rawDigits) || 0 });
                      }}
                      placeholder="VD: 18,500,000,000"
                      className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
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
                      value={Number(baseProfile.charterCapital || 0).toLocaleString('vi-VN')}
                      onChange={(e) => {
                        const rawDigits = e.target.value.replace(/\D/g, '');
                        updateBaseProfile({ charterCapital: Number(rawDigits) || 0 });
                      }}
                      placeholder="VD: 5,000,000,000"
                      className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    value={baseProfile.employeeCount ? String(baseProfile.employeeCount) : ''}
                    placeholder="VD: 25"
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, '');
                      const count = rawDigits === '' ? 0 : parseInt(rawDigits, 10);
                      updateBaseProfile({
                        employeeCount: count,
                        employeeScale: count < 10 ? 'under_10' : count <= 50 ? '10_to_50' : 'over_50',
                      });
                    }}
                    className="w-full p-2.5 pr-14 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                    người
                  </span>
                </div>
              </div>

              {/* Chỉ hiển thị đúng 1 thẻ tương ứng với khoảng quy mô nhân sự vừa nhập */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INDUSTRY_TAGS.map((tag) => {
                  const isSelected = baseProfile.industryTags.includes(tag.id);
                  return (
                    <div
                      key={tag.id}
                      onClick={() => handleToggleIndustryTag(tag.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
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

            {/* Step 1 Action Button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔵 BƯỚC 2: BỘ CÂU HỎI TÌNH HUỐNG DYNAMIC THEO THẺ ĐÃ CHỌN                  */}
      {/* ========================================================================= */}
      {activeTabStep === 2 && (
        <div className="space-y-6">
          {/* Header Stats Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-teal-600" />
                  Bước 2: Bộ câu hỏi tình huống Dynamic ({answeredCount}/{totalCount} câu)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTabStep(1)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Đổi thẻ Bước 1
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* NHÓM 1: TUÂN THỦ THUẾ DOANH NGHIỆP */}
          {taxModuleQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Tuân thủ Thuế Doanh Nghiệp ({taxModuleQuestions.length} tình huống)
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {taxModuleQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx + 1}
                    onSelect={(opt) => answerDynamicQuestion(q.id, opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* NHÓM 2: HÓA ĐƠN & DÒNG TIỀN THỰC TẾ */}
          {invoiceModuleQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Hóa Đơn &amp; Dòng Tiền Thực Tế ({invoiceModuleQuestions.length} tình huống)
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {invoiceModuleQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={taxModuleQuestions.length + idx + 1}
                    onSelect={(opt) => answerDynamicQuestion(q.id, opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* NHÓM 3: LAO ĐỘNG, TIỀN LƯƠNG & BHXH */}
          {laborModuleQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Lao Động, Tiền Lương &amp; BHXH ({laborModuleQuestions.length} tình huống)
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {laborModuleQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={taxModuleQuestions.length + invoiceModuleQuestions.length + idx + 1}
                    onSelect={(opt) => answerDynamicQuestion(q.id, opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* NHÓM 4: GIẤY PHÉP CON & PHÁP CHẾ CHUYÊN NGÀNH */}
          {licensingModuleQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Giấy Phép Con &amp; Pháp Chế Chuyên Ngành ({licensingModuleQuestions.length} tình huống)
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {licensingModuleQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={taxModuleQuestions.length + invoiceModuleQuestions.length + laborModuleQuestions.length + idx + 1}
                    onSelect={(opt) => answerDynamicQuestion(q.id, opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CÂU HỎI BỔ TRỢ (NẾU CÓ) */}
          {otherQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Các câu hỏi bổ trợ ({otherQuestions.length} tình huống)
                </h3>
              </div>

              <div className="space-y-3">
                {otherQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={taxModuleQuestions.length + invoiceModuleQuestions.length + laborModuleQuestions.length + licensingModuleQuestions.length + idx + 1}
                    onSelect={(opt) => answerDynamicQuestion(q.id, opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigation Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTabStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabStep(3)}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 BƯỚC 3: TỔNG KẾT & KÍCH HOẠT RULE ENGINE                                 */}
      {/* ========================================================================= */}
      {activeTabStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Profile Overview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Tên Doanh nghiệp:</span>
                <span className="font-bold text-slate-900">{baseProfile.companyName}</span>
                <span className="text-[11px] text-slate-500 block font-mono">MST: {baseProfile.taxCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Loại hình:</span>
                <span className="font-bold text-indigo-700">
                  {COMPANY_TYPE_TAGS.find(t => t.id === baseProfile.companyTypeTag)?.label}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Quy mô: {baseProfile.employeeScale === 'under_10' ? 'Dưới 10 người' : baseProfile.employeeScale === '10_to_50' ? '10 - 50 người' : 'Trên 50 người'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Ngành nghề:</span>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {baseProfile.industryTags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                      {INDUSTRY_TAGS.find(t => t.id === tag)?.shortLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning Status Card */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Trạng thái cảnh báo
                </span>
                <span className="font-mono text-sm">
                  {dynamicQuestions.filter(q => q.selectedOption !== 'Đã hoàn thành / Tuân thủ đầy đủ').length} tình huống
                </span>
              </div>
              <p className="text-[11px] text-amber-900">
                Hệ thống chỉ tạo dữ liệu doanh nghiệp với trạng thái cảnh báo.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTabStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={finishDynamicSurvey}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Đang kích hoạt...' : 'Xác nhận & Kích hoạt Bối cảnh'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE UNSAVED CHANGES MODAL */}
      <UnsavedChangesModal
        open={showUnsavedModal}
        title="Bạn có dữ liệu khảo sát chưa được kích hoạt!"
        description={`Bạn đã trả lời ${answeredCount}/${totalCount} câu hỏi nhưng chưa kích hoạt hệ thống. Nếu rời đi bây giờ, các Thẻ bối cảnh tuân thủ sẽ chưa được lưu vào cơ sở dữ liệu.`}
        warningDetail="Khuyến nghị: Bạn có thể chọn 'Kích hoạt Bối cảnh & Tiếp tục' để hệ thống tự động lưu các câu hỏi đã trả lời ngay lập tức."
        saveText="Kích hoạt Bối cảnh & Tiếp tục"
        discardText="Rời đi không lưu"
        cancelText="Ở lại tiếp tục"
        isSaving={submitting}
        onSaveAndProceed={finishDynamicSurvey}
        onDiscard={() => {
          setShowUnsavedModal(false);
          if (pendingLeaveAction) pendingLeaveAction();
        }}
        onCancel={() => {
          setShowUnsavedModal(false);
          setPendingLeaveAction(null);
        }}
      />
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: QuestionCard
// =========================================================================
interface QuestionCardProps {
  question: DynamicSituationQuestion;
  index: number;
  onSelect: (option: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3.5">
      {/* Question Header & Category Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
            {index}
          </span>
          <span className="font-bold text-slate-700">
            {question.branchLabel}
          </span>
          {question.moduleId && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
              question.moduleId === 'MODULE_TAX_CORE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              {question.moduleId === 'MODULE_TAX_CORE' ? '🟢 Thuế Doanh Nghiệp' : '🟢 Hóa Đơn & Dòng Tiền'}
            </span>
          )}
        </div>
      </div>

      {/* Question Statement */}
      <h4 className="text-sm font-bold text-slate-900 leading-snug">
        {question.title}
      </h4>

      {/* Legal Basis from Official DLPL Source */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Scale className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Căn cứ pháp lý:</span>
          </div>

          {question.verificationUrl && (
            <a 
              href={question.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Tra cứu văn bản gốc</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <p className="text-slate-600 leading-relaxed font-mono pl-5">
          {question.legalBasis}
        </p>
      </div>

      {/* 4 Contextual Options theo Quy định Pháp luật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {question.options.map((option, idx) => {
          const isSelected = question.selectedOption === option;

          // Phân loại trực quan 4 trạng thái pháp lý
          const isFullCompliance = idx === 0;
          const isExemptOrSafe = idx === 1;
          const isNonCompliance = idx === 2;

          let badgeColor = 'bg-slate-400';
          let borderSelectColor = 'border-amber-500 bg-amber-50/90 text-amber-950 ring-amber-500';
          let dotColor = 'bg-amber-600';

          if (isFullCompliance) {
            badgeColor = 'bg-teal-500';
            borderSelectColor = 'border-teal-500 bg-teal-50/90 text-teal-950 ring-teal-500';
            dotColor = 'bg-teal-600';
          } else if (isExemptOrSafe) {
            badgeColor = 'bg-blue-500';
            borderSelectColor = 'border-blue-500 bg-blue-50/90 text-blue-950 ring-blue-500';
            dotColor = 'bg-blue-600';
          } else if (isNonCompliance) {
            badgeColor = 'bg-rose-500';
            borderSelectColor = 'border-rose-500 bg-rose-50/90 text-rose-950 ring-rose-500';
            dotColor = 'bg-rose-600';
          }

          return (
            <div
              key={idx}
              onClick={() => onSelect(option)}
              className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-start justify-between gap-2.5 select-none ${
                isSelected
                  ? `${borderSelectColor} shadow-sm ring-1`
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${badgeColor}`} />
                <span className="leading-relaxed text-xs">{option}</span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                isSelected 
                  ? `${dotColor} border-transparent text-white` 
                  : 'border-slate-300 bg-white'
              }`}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
