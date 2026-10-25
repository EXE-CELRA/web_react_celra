import React, { useState, useEffect, useMemo } from 'react';
import { Modal, message, Progress } from 'antd';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';
import { getModuleSurveyConfig } from '../../data/questionSurvey';
import { useOrgStore } from '../../store/useOrgStore';
import { useContextStore } from '../../store/useContextStore';
import apiClient from '../../api/client';
import { DEFAULT_BASE_PROFILE } from '../../data/baseProfile';

interface ModuleSurveyModalProps {
  isOpen: boolean;
  groupKey: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModuleSurveyModal: React.FC<ModuleSurveyModalProps> = ({
  isOpen,
  groupKey,
  onClose,
  onSuccess,
}) => {
  const { activeOrg } = useOrgStore();
  const { facts, fetchFacts } = useContextStore();

  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Cấu hình phân hệ khảo sát
  const moduleConfig = useMemo(() => {
    return getModuleSurveyConfig(groupKey);
  }, [groupKey]);

  // Khôi phục BaseProfile từ activeOrg hoặc localStorage
  const currentBaseProfile = useMemo<BaseProfile>(() => {
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
      taxCode: activeOrg?.taxCode || '',
      companyName: activeOrg?.name || '',
      employeeScale: DEFAULT_BASE_PROFILE.employeeScale,
      requiresLaborRuleBook: DEFAULT_BASE_PROFILE.requiresLaborRuleBook,
      companyTypeTag: (activeOrg?.legalType?.includes('1TV') ? 'TAG_TNHH_1TV' : DEFAULT_BASE_PROFILE.companyTypeTag) as any,
      industryTags: DEFAULT_BASE_PROFILE.industryTags,
    };
  }, [activeOrg]);

  // Tạo danh sách câu hỏi dựa trên cấu hình phân hệ và BaseProfile
  const questions: DynamicSituationQuestion[] = useMemo(() => {
    if (!moduleConfig) return [];
    return moduleConfig.getQuestions(currentBaseProfile);
  }, [moduleConfig, currentBaseProfile]);

  // Nạp lại các câu trả lời đã lưu từ Facts trong Database hoặc LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    const initialMap: Record<string, string> = {};

    // 1. Nạp từ Facts hiện có trong Database
    if (facts && facts.length > 0) {
      facts.forEach((f) => {
        if (f.key && f.currentValue) {
          initialMap[f.key] = f.currentValue;
        }
      });
    }

    // 2. Nạp bổ sung từ LocalStorage nếu có
    try {
      const savedCompletedAnswers = localStorage.getItem('celra_survey_completed_answers');
      if (savedCompletedAnswers) {
        const parsed = JSON.parse(savedCompletedAnswers);
        Object.assign(initialMap, parsed);
      }
    } catch {
      // Ignore
    }

    setSelectedAnswers(initialMap);
  }, [isOpen, facts]);

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const answeredCount = useMemo(() => {
    return questions.filter((q) => Boolean(selectedAnswers[q.id])).length;
  }, [questions, selectedAnswers]);

  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSubmitSurvey = async () => {
    if (questions.length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu câu hỏi kèm lựa chọn
      const questionsWithAnswers = questions.map((q) => ({
        ...q,
        selectedOption: selectedAnswers[q.id] || 'Chưa thực hiện / Chưa có',
      }));

      const answersPayload = questions.map((q, idx) => ({
        questionId: idx + 1,
        selectedOption: selectedAnswers[q.id] || 'Chưa thực hiện / Chưa có',
        note: `[${q.branchCode}] ${q.title}`,
      }));

      // Gửi lên Backend để upsert các Context Fact
      await apiClient.post(
        '/surveys/submit',
        {
          baseProfile: currentBaseProfile,
          questions: questionsWithAnswers,
          answers: answersPayload,
        },
        {
          headers: activeOrg?.id ? { 'x-organization-id': activeOrg.id } : {},
        }
      );

      // Cập nhật LocalStorage
      try {
        if (groupKey === 'thue_ke_toan') {
          localStorage.setItem('celra_survey_tax_completed', 'true');
        }
        localStorage.setItem('celra_survey_completed', 'true');
        const existingAnswers = JSON.parse(localStorage.getItem('celra_survey_completed_answers') || '{}');
        Object.assign(existingAnswers, selectedAnswers);
        localStorage.setItem('celra_survey_completed_answers', JSON.stringify(existingAnswers));
      } catch {
        // Ignore
      }

      // Làm mới danh sách facts từ store
      await fetchFacts();

      message.success(`🎉 Đã lưu thành công dữ kiện khảo sát tình huống cho phân hệ ${moduleConfig?.groupTitle || 'này'}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || 'Không thể lưu dữ kiện khảo sát. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!moduleConfig) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={860}
      centered
      destroyOnClose
      closeIcon={null}
      styles={{
        body: {
          padding: 0,
          borderRadius: '1.25rem',
          overflow: 'hidden',
        },
      }}
    >
      <div className="flex flex-col max-h-[88vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 px-6 border-b border-teal-800/40 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  {moduleConfig.moduleTag}
                </span>
                <span className="text-slate-400 text-xs">
                  • {totalQuestions} câu hỏi tình huống • ~{moduleConfig.estimatedMinutes} phút
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Khảo Sát Tình Huống Tuân Thủ: {moduleConfig.groupTitle}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            {moduleConfig.description} Trả lời chính xác tình hình thực tế để hệ thống đối chiếu với luật định và phát hiện nguy cơ xử phạt.
          </p>

          {/* THANH TIẾN ĐỘ TIẾN TRÌNH */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Tiến độ khảo sát: {answeredCount}/{totalQuestions} câu hỏi ({progressPercent}%)</span>
            </div>
            <div className="w-48 hidden sm:block">
              <Progress
                percent={progressPercent}
                size="small"
                status={progressPercent === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#14b8a6',
                  '100%': '#10b981',
                }}
                showInfo={false}
              />
            </div>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE LIST) */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id]);
            const selectedVal = selectedAnswers[q.id];

            const severityBadge =
              q.severity === 'urgent' ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase">
                  Trọng yếu / Khẩn cấp
                </span>
              ) : q.severity === 'high' ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase">
                  Rủi ro cao
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase">
                  Quy chuẩn
                </span>
              );

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isAnswered
                    ? 'border-teal-300 shadow-sm'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Header câu hỏi */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{q.branchLabel || 'Tình huống'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {severityBadge}
                    {isAnswered && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã chọn
                      </span>
                    )}
                  </div>
                </div>

                {/* Tiêu đề câu hỏi */}
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                  {q.title}
                </h3>

                {/* Căn cứ pháp lý */}
                {q.legalBasis && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-slate-700">Cơ sở pháp lý: </span>
                      <span>{q.legalBasis}</span>
                      {q.verificationUrl && (
                        <div className="mt-1">
                          <a
                            href={q.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          >
                            <span>Tra cứu văn bản gốc tại dulieuphapluat.vn</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lựa chọn trắc nghiệm */}
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedVal === opt;
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 text-teal-950 font-semibold ring-2 ring-teal-500/15'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.id, opt)}
                          className="mt-0.5 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Có thể điều chỉnh lại câu trả lời bất kỳ lúc nào tại màn hình Rà soát.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer w-full sm:w-auto"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSubmitSurvey}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu dữ kiện...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>Lưu Dữ Kiện &amp; Tiến Hành Rà Soát</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
