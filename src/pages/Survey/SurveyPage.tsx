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
  generateDynamicQuestions 
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
  Briefcase
} from 'lucide-react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';

export const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useOrgStore();

  const [isSurveyCompleted, setIsSurveyCompleted] = useState<boolean>(() => {
    return localStorage.getItem('celra_survey_completed') === 'true';
  });

  const [baseProfile, setBaseProfile] = useState<BaseProfile>(() => {
    return {
      taxCode: activeOrg?.taxCode || DEFAULT_BASE_PROFILE.taxCode,
      companyName: activeOrg?.name || activeOrg?.legalName || DEFAULT_BASE_PROFILE.companyName,
      employeeScale: DEFAULT_BASE_PROFILE.employeeScale,
      requiresLaborRuleBook: DEFAULT_BASE_PROFILE.requiresLaborRuleBook,
      companyTypeTag: DEFAULT_BASE_PROFILE.companyTypeTag,
      industryTags: DEFAULT_BASE_PROFILE.industryTags,
    };
  });

  // Wizard Navigation: step 1 = Base Profile, step 2 = Dynamic Questions, step 3 = Summary & Activation
  const [activeTabStep, setActiveTabStep] = useState<1 | 2 | 3>(1);

  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicSituationQuestion[]>(() => {
    return generateDynamicQuestions(baseProfile);
  });

  const [submitting, setSubmitting] = useState(false);
  const [legalRules, setLegalRules] = useState<Record<string, any>>({});

  // Ánh xạ câu hỏi với mã quy tắc pháp luật trong Database (được đồng bộ từ API Dữ Liệu Pháp Luật - DLPL)
  const QUESTION_RULE_MAP: Record<string, string> = {
    q_tax_corp_1: 'RULE-TAX-GTGT',
    q_tax_corp_2: 'RULE-TAX-TNDN-80',
    q_tax_corp_3: 'RULE-TAX-EXP-20M',
    q_fnb_tax_1: 'RULE-TAX-POS-FNB',
    q_tax_salary_1: 'RULE-TAX-EXP-20M',
    q_tax_salary_2: 'RULE-LABOR-10TO50',
  };

  const enrichQuestionsWithLegalRules = (questions: DynamicSituationQuestion[], rules: Record<string, any>) => {
    if (!rules || Object.keys(rules).length === 0) return questions;
    return questions.map(q => {
      const ruleCode = QUESTION_RULE_MAP[q.id];
      if (ruleCode && rules[ruleCode]) {
        const rule = rules[ruleCode];
        const primaryCitation = rule?.conditionsJson?.citations?.[0];
        return {
          ...q,
          legalBasis: rule.legalReference ? `${rule.legalReference}. ${rule.conditionSummary || ''}` : q.legalBasis,
          verificationUrl: primaryCitation?.sourceUrl || q.verificationUrl,
        };
      }
      return q;
    });
  };

  // Tải danh sách quy định pháp luật động từ API backend (đồng bộ từ DLPL) để cập nhật căn cứ và link chính xác
  useEffect(() => {
    apiClient.get('/ai-assistant/legal-rules')
      .then((res: any) => {
        const rulesList = Array.isArray(res) ? res : res?.data || [];
        const map: Record<string, any> = {};
        rulesList.forEach((r: any) => {
          map[r.code] = r;
        });
        setLegalRules(map);
        setDynamicQuestions(currentList => enrichQuestionsWithLegalRules(currentList, map));
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

  // Sync activeOrg details if available on load
  useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id) {
        localStorage.setItem('celra_active_org_id', activeOrg.id);
      }
      setBaseProfile(prev => ({
        ...prev,
        taxCode: activeOrg.taxCode || prev.taxCode,
        companyName: activeOrg.name || activeOrg.legalName || prev.companyName,
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
      return next;
    });
  };

  const handleToggleIndustryTag = (tag: IndustryTag) => {
    const exists = baseProfile.industryTags.includes(tag);
    if (exists) {
      if (baseProfile.industryTags.length === 1) {
        message.info('Bạn cần chọn ít nhất 1 ngành nghề hoạt động.');
        return;
      }
      updateBaseProfile({
        industryTags: baseProfile.industryTags.filter(t => t !== tag)
      });
    } else {
      updateBaseProfile({
        industryTags: [...baseProfile.industryTags, tag]
      });
    }
  };

  const answerDynamicQuestion = (questionId: string, option: string) => {
    setDynamicQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, selectedOption: option } : q)
    );
  };

  const resetSurveyStatus = () => {
    localStorage.removeItem('celra_survey_completed');
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
      setIsSurveyCompleted(true);

      message.success('🎉 Đã kích hoạt hệ thống! Thiết lập thành công các thẻ Bối cảnh tuân thủ.');
      navigate('/context');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu khảo sát bối cảnh');
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

  // Group questions by Compliance Module for Step 2
  const taxModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_TAX_CORE');
  const invoiceModuleQuestions = dynamicQuestions.filter(q => q.moduleId === 'MODULE_INVOICE_CASHFLOW');
  const otherQuestions = dynamicQuestions.filter(q => !q.moduleId || (q.moduleId !== 'MODULE_TAX_CORE' && q.moduleId !== 'MODULE_INVOICE_CASHFLOW'));

  const answeredCount = dynamicQuestions.filter(q => q.selectedOption !== undefined).length;
  const totalCount = dynamicQuestions.length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Banner when survey is completed */}
      {isSurveyCompleted && (
        <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-teal-100 rounded-lg text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-teal-950">Khảo sát đã hoàn tất — Toàn bộ hệ thống đã mở khóa</span>
              <p className="text-[11px] text-teal-700">Bạn có thể tự do truy cập tất cả các phân hệ trên thanh Sidebar.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetSurveyStatus}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Khóa lại để thử nghiệm
          </button>
        </div>
      )}

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
            onClick={() => setActiveTabStep(2)}
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
            onClick={() => setActiveTabStep(3)}
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

            {/* Input 1 & 2: Mã số thuế & Tên Doanh Nghiệp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Mã số thuế (MST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={baseProfile.taxCode}
                  onChange={(e) => updateBaseProfile({ taxCode: e.target.value.trim() })}
                  placeholder="VD: 0318294012"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tên doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={baseProfile.companyName}
                  onChange={(e) => updateBaseProfile({ companyName: e.target.value })}
                  placeholder="VD: Công ty TNHH Bếp Việt"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Input 3: Quy mô nhân sự */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Quy mô nhân sự (Chọn 1 mức):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Under 10 */}
                <div
                  onClick={() => updateBaseProfile({ employeeScale: 'under_10' })}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    baseProfile.employeeScale === 'under_10'
                      ? 'bg-teal-50/60 border-teal-500 text-teal-950 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="employeeScale"
                    checked={baseProfile.employeeScale === 'under_10'}
                    onChange={() => updateBaseProfile({ employeeScale: 'under_10' })}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold block text-slate-900">Dưới 10 nhân viên</span>
                    <span className="text-[11px] text-slate-500 font-normal block mb-1">
                      Quy mô vi mô, chưa bắt buộc đăng ký NQLĐ bằng văn bản
                    </span>
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 mb-1.5 italic leading-relaxed">
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
                            onClick={(e) => e.stopPropagation()}
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
                </div>

                {/* 10 to 50 */}
                <div
                  onClick={() => updateBaseProfile({ employeeScale: '10_to_50' })}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    baseProfile.employeeScale === '10_to_50'
                      ? 'bg-amber-50/80 border-amber-500 text-amber-950 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="employeeScale"
                    checked={baseProfile.employeeScale === '10_to_50'}
                    onChange={() => updateBaseProfile({ employeeScale: '10_to_50' })}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold flex items-center gap-1.5 text-slate-900">
                      Từ 10 đến 50 nhân viên
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-mono">CỜ BẮT BUỘC</span>
                    </span>
                    <span className="text-[11px] text-amber-900/80 font-normal block mb-1">
                      Kích hoạt cờ: Bắt buộc ban hành NQLĐ bằng văn bản &amp; Đăng ký trong vòng 10 ngày
                    </span>
                    <div className="p-1.5 rounded bg-amber-100/70 border border-amber-200 text-[10px] text-amber-900 mb-1.5 italic leading-relaxed">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={citeLaw.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => e.stopPropagation()}
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
                </div>

                {/* Over 50 */}
                <div
                  onClick={() => updateBaseProfile({ employeeScale: 'over_50' })}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    baseProfile.employeeScale === 'over_50'
                      ? 'bg-amber-50/80 border-amber-500 text-amber-950 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="employeeScale"
                    checked={baseProfile.employeeScale === 'over_50'}
                    onChange={() => updateBaseProfile({ employeeScale: 'over_50' })}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold flex items-center gap-1.5 text-slate-900">
                      Trên 50 nhân viên
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-mono">CỜ BẮT BUỘC</span>
                    </span>
                    <span className="text-[11px] text-amber-900/80 font-normal block mb-1">
                      Kích hoạt cờ: Cần NQLĐ, Cán bộ/Ban ATVSLĐ chuyên trách &amp; Đối thoại định kỳ
                    </span>
                    <div className="p-1.5 rounded bg-amber-100/70 border border-amber-200 text-[10px] text-amber-900 mb-1.5 italic leading-relaxed">
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
                            onClick={(e) => e.stopPropagation()}
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
                </div>
              </div>
            </div>

            {/* Input 4: Chọn Loại hình doanh nghiệp */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  Chọn Loại hình doanh nghiệp:
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPANY_TYPE_TAGS.map((tag) => {
                  const isSelected = baseProfile.companyTypeTag === tag.id;
                  return (
                    <div
                      key={tag.id}
                      onClick={() => updateBaseProfile({ companyTypeTag: tag.id })}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                          {getCompanyTypeIcon(tag.iconName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{tag.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {tag.description}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 mt-0.5 ${
                        isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input 5: Chọn Ngành nghề & Hoạt động thực tế */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  Chọn Ngành nghề &amp; Hoạt động thực tế:
                </label>
                <span className="text-[11px] text-slate-500">Được chọn nhiều ngành thực tế</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                onClick={() => setActiveTabStep(2)}
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

          {/* MODULE 1: TUÂN THỦ THUẾ DOANH NGHIỆP */}
          {taxModuleQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px]">
                    MODULE 1
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Tuân thủ Thuế Doanh Nghiệp ({taxModuleQuestions.length} tình huống)
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold normal-case">
                      🟢 Đang kích hoạt (MVP)
                    </span>
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

          {/* MODULE 2: HÓA ĐƠN & DÒNG TIỀN THỰC TẾ */}
          {invoiceModuleQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-mono font-bold text-[10px]">
                    MODULE 2
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Hóa Đơn &amp; Dòng Tiền Thực Tế ({invoiceModuleQuestions.length} tình huống)
                    <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-semibold normal-case">
                      🟢 Đang kích hoạt (MVP)
                    </span>
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

          {/* CÂU HỎI BỔ TRỢ (NẾU CÓ) */}
          {otherQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 px-1">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-600 text-white font-mono font-bold text-[10px]">
                  BỔ TRỢ
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Các câu hỏi bổ trợ ({otherQuestions.length} tình huống)
                </h3>
              </div>

              <div className="space-y-3">
                {otherQuestions.map((q, idx) => (
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
                <span>{submitting ? 'Đang lưu...' : 'Xác nhận'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
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

      {/* 4 Standard Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {question.options.map((option, idx) => {
          const isSelected = question.selectedOption === option;
          const isFullCompliance = option.includes('Đã hoàn thành');
          const isNonCompliance = option.includes('Chưa thực hiện');
          const isInProgress = option.includes('Đang chuẩn bị');

          return (
            <div
              key={idx}
              onClick={() => onSelect(option)}
              className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? isFullCompliance
                    ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-sm ring-1 ring-teal-500'
                    : isNonCompliance
                    ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm ring-1 ring-rose-500'
                    : 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm ring-1 ring-amber-500'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  isFullCompliance ? 'bg-teal-500' : isNonCompliance ? 'bg-rose-500' : isInProgress ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <span className="truncate">{option}</span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                isSelected 
                  ? isFullCompliance ? 'bg-teal-600 border-teal-600 text-white' : isNonCompliance ? 'bg-rose-600 border-rose-600 text-white' : 'bg-amber-600 border-amber-600 text-white'
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
