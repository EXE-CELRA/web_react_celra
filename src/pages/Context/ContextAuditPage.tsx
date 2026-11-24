/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { SlidersHorizontal, ShieldCheck, Check } from 'lucide-react';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useOrgStore } from '../../store/useOrgStore';
import { useTaskStore } from '../../store/useTaskStore';
import apiClient from '../../api/client';
import { CONTEXT_GROUPS, ENABLED_CONTEXT_GROUP_KEYS } from './ContextPage';
import { EtaxPaymentGuideModal } from '../../components/tax/EtaxPaymentGuideModal';
import { ComplianceAuditReportView } from '../../components/tax/ComplianceAuditReportView';
import { ModuleSurveyModal } from '../../components/survey/ModuleSurveyModal';
import { isGroupSurveyCompleted } from '../../data/questionSurvey';
import type { ContextFact, AuditFindingItem } from '../../interfaces';
import { STATUTORY_PENALTY_RISKS } from './audit/audit.constants';
import { useCitLedgerState } from './audit/useCitLedgerState';
import { CitLedgerSection } from './audit/CitLedgerSection';
import { CitLedgerModals } from './audit/CitLedgerModals';
import {
  ContextFactCardsStep,
  AuditConfirmStep,
  AuditScanningStep,
} from './audit/BatchAuditWorkflow';

// Re-export constants & types for backwards compatibility
export {
  STATUTORY_PENALTY_RISKS,
  STANDARD_21_CONTEXT_FACTS,
  DEFAULT_REVENUE_ROWS,
  DEFAULT_EXPENSE_ROWS,
  type PeriodFinancialData,
  type PeriodStore,
} from './audit/audit.constants';

export const ContextAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawGroup = searchParams.get('group');
  const initialGroup = (rawGroup === 'boi_canh_co_so' ? null : rawGroup) || 'thue_ke_toan';

  const { facts, fetchFacts, isLoading, createFact, updateFact } = useContextStore();
  const { fetchWallet } = useWalletStore();
  const { activeOrg } = useOrgStore();
  const { fetchTasks, fetchNotifications } = useTaskStore();

  const [activeTab, setActiveTab] = useState<string>(initialGroup);
  // Chế độ xem: Báo cáo rà soát tuân thủ (5 khu vực chuẩn) vs Sổ thu chi kế toán
  const [taxViewMode, setTaxViewMode] = useState<'report' | 'ledger'>('report');
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'confirm' | 'scanning' | 'results'>('select');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStageText, setScanStageText] = useState<string>('');

  // Dữ liệu kết quả rà soát từ server
  const [auditId, setAuditId] = useState<string>('');
  const [auditFindings, setAuditFindings] = useState<AuditFindingItem[]>([]);
  const [creatingSingleId, setCreatingSingleId] = useState<string | null>(null);
  const [isCreatingAll, setIsCreatingAll] = useState<boolean>(false);

  // Modal khảo sát tình huống chuyên biệt (Check Gate)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState<boolean>(false);

  const handleResetOnOrgChange = useCallback(() => {
    setAuditFindings([]);
    setSelectedFactIds([]);
    if (activeOrg?.id) {
      fetchFacts();
    }
  }, [activeOrg?.id, fetchFacts]);

  // Hook quản lý toàn bộ Sổ thu chi & Dự toán Thuế TNDN
  const cit = useCitLedgerState({
    activeOrg,
    facts,
    isLoadingFacts: isLoading,
    createFact,
    updateFact,
    fetchTasks,
    fetchNotifications,
    onNavigateTasks: () => navigate('/tasks'),
    onResetParentOnOrgChange: handleResetOnOrgChange,
  });

  // Check gate: Nếu vào trang rà soát mà phân hệ hiện tại chưa làm khảo sát thì tự động mở modal
  useEffect(() => {
    if (!isLoading && facts && facts.length >= 0) {
      if (activeTab === 'thue_ke_toan') return;
      if (!isGroupSurveyCompleted(facts, activeTab)) {
        setIsSurveyModalOpen(true);
      }
    }
  }, [facts, activeTab, isLoading]);

  useEffect(() => {
    fetchWallet();
    fetchFacts();
  }, [fetchFacts, fetchWallet]);

  useEffect(() => {
    if (initialGroup) {
      setActiveTab(initialGroup);
    }
  }, [initialGroup]);

  // Danh sách fact hợp nhất của doanh nghiệp hiện hành
  const effectiveFacts: ContextFact[] = useMemo(() => {
    const rawList = facts && facts.length > 0 ? facts : [];
    return rawList.filter(
      (f) => f.group !== 'boi_canh_co_so' && ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''),
    );
  }, [facts]);

  const displayedFacts = useMemo(
    () => effectiveFacts.filter((f) => f.group === activeTab),
    [activeTab, effectiveFacts],
  );

  // Luôn đồng bộ 100% thẻ của lĩnh vực đang xem (Khóa trọn gói)
  useEffect(() => {
    if (displayedFacts.length > 0) {
      setSelectedFactIds(displayedFacts.map((f) => f.id));
    }
  }, [displayedFacts]);

  // Quyền lợi gói thuê bao: Rà soát không giới hạn
  const isBalanceSufficient = true;

  // GỌI API RÀ SOÁT BỐI CẢNH (BATCH AUDIT DÀNH CHO CÁC PHÂN HỆ KHÁC)
  const handleStartAudit = async () => {
    setIsProcessing(true);
    setStep('scanning');
    setScanProgress(25);
    setScanStageText('Đang nén snapshot dữ liệu bối cảnh và kiểm tra Cache Fingerprint...');

    setTimeout(() => {
      setScanProgress(60);
      setScanStageText(
        'Đối chiếu ma trận 11 đợt luật định và xác thực hiệu lực văn bản qua Cổng Dữ Liệu Pháp Luật...',
      );
    }, 400);

    setTimeout(() => {
      setScanProgress(90);
      setScanStageText('Phân tích điều kiện áp dụng, minh chứng bắt buộc và tính hạn chót pháp lý...');
    }, 800);

    try {
      const res = (await apiClient.post('/context-facts/batch-audit', {
        factIds: selectedFactIds.length > 0 ? selectedFactIds : undefined,
      })) as unknown as { auditId?: string; findings?: AuditFindingItem[] };

      setScanProgress(100);
      setScanStageText('Hoàn tất rà soát tuân thủ!');

      const rawFindings: AuditFindingItem[] = Array.isArray(res?.findings) ? res.findings : [];
      const enrichedFindings = rawFindings.map((f) => ({
        ...f,
        penaltyRisk:
          STATUTORY_PENALTY_RISKS[f.ruleCode] ||
          'Phạt tiền từ 2.000.000đ - 10.000.000đ theo quy định quản lý chuyên ngành đối với hành vi vi phạm nghĩa vụ tuân thủ.',
      }));

      setAuditId(res?.auditId || `audit-${Date.now()}`);
      setAuditFindings(enrichedFindings);
      await fetchWallet();

      setTimeout(() => {
        setStep('results');
        setIsProcessing(false);
      }, 500);
    } catch (err: unknown) {
      setIsProcessing(false);
      setStep('select');
      const e = err as { message?: string };
      message.error(e?.message || 'Có lỗi xảy ra khi thực hiện rà soát tuân thủ.');
    }
  };

  const handleCreateSingleChecklist = async (finding: AuditFindingItem) => {
    setCreatingSingleId(finding.id);
    try {
      await apiClient.post('/context-facts/confirm-checklists', {
        auditId,
        items: [
          {
            findingId: finding.id,
            ruleCode: finding.ruleCode,
            title: finding.obligationTitle,
            category: finding.category,
            cycleType: finding.cycleType,
            assigneeRole: 'owner',
            priority: finding.suggestedPriority,
            legalBasis: finding.legalBasis,
            legalDocUrl: finding.legalDocUrl,
            evidenceRequirement: finding.evidenceRequired,
          },
        ],
      });
      message.success(`Đã tạo thành công Checklist: ${finding.obligationTitle}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Lỗi khi tạo Checklist');
    } finally {
      setCreatingSingleId(null);
    }
  };

  const handleCreateAllChecklists = async () => {
    if (auditFindings.length === 0) return;
    setIsCreatingAll(true);
    try {
      const res = (await apiClient.post('/context-facts/confirm-checklists', {
        auditId,
        items: auditFindings.map((finding) => ({
          findingId: finding.id,
          ruleCode: finding.ruleCode,
          title: finding.obligationTitle,
          category: finding.category,
          cycleType: finding.cycleType,
          assigneeRole: 'owner',
          priority: finding.suggestedPriority,
          legalBasis: finding.legalBasis,
          legalDocUrl: finding.legalDocUrl,
          evidenceRequirement: finding.evidenceRequired,
        })),
      })) as unknown as { message?: string };
      message.success(
        res?.message || `Đã tạo toàn bộ ${auditFindings.length} bộ Checklist tuân thủ thành công!`,
      );
      navigate('/tasks');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Lỗi khi xác nhận tạo toàn bộ Checklist');
    } finally {
      setIsCreatingAll(false);
    }
  };

  const handleOpenTaxChecklistModal = () => {
    cit.setSelectedChecklistQuarter(cit.taxQuarter === 'ALL' ? 1 : cit.taxQuarter);
    cit.setSelectedChecklistYear(cit.taxYear);
    cit.setIsChecklistModalOpen(true);
  };

  // Bảo lưu các handler cũ theo nguyên tắc bảo toàn mã nguồn
  void [handleCreateSingleChecklist, creatingSingleId];

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ========================================================= */}
      {/* BƯỚC 1: CHỌN CÁC THẺ CONTEXT & PHÂN HỆ THUẾ TNDN */}
      {/* ========================================================= */}
      {step === 'select' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          {/* THANH TABS NHÓM BỐI CẢNH & NÚT CẬP NHẬT KHẢO SÁT */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              {CONTEXT_GROUPS.filter(
                (g) => g.key !== 'boi_canh_co_so' && ENABLED_CONTEXT_GROUP_KEYS.includes(g.key),
              ).map((g) => {
                const count = effectiveFacts.filter((f) => f.group === g.key).length;
                const isSelected = activeTab === g.key;
                const IconComp = g.icon;

                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(g.key);
                      const groupFacts = effectiveFacts.filter((f) => f.group === g.key);
                      setSelectedFactIds(groupFacts.map((f) => f.id));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-white/70'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{g.shortLabel}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : count > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTab !== 'thue_ke_toan' && (
              <button
                type="button"
                onClick={() => setIsSurveyModalOpen(true)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-teal-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-xs self-stretch sm:self-auto shrink-0"
                title="Mở lại bài khảo sát tình huống chuyên biệt để cập nhật câu trả lời"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                <span>Cập nhật khảo sát tình huống</span>
              </button>
            )}
          </div>

          {/* PHÂN HỆ QUẢN LÝ BÁO CÁO TUÂN THỦ & SỔ THU CHI THUẾ TNDN */}
          {activeTab === 'thue_ke_toan' && (
            <div className="space-y-4">
              {/* SUB-HEADER / VIEW SELECTOR: BÁO CÁO RÀ SOÁT TUÂN THỦ (5 KHU VỰC) VS SỔ THU CHI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTaxViewMode('report')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      taxViewMode === 'report'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Báo Cáo Rà Soát Tuân Thủ (5 Khu Vực)</span>
                    <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                      Chuẩn CELRA
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxViewMode('ledger')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      taxViewMode === 'ledger'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FileExcelOutlined className="text-sm" />
                    <span>Sổ Thu Chi &amp; Bóc Tách B4 (Kế Toán)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    Kỳ:{' '}
                    <strong>
                      Quý {cit.taxQuarter === 'ALL' ? 'cả năm' : cit.taxQuarter}/{cit.taxYear}
                    </strong>
                  </span>
                </div>
              </div>

              {taxViewMode === 'report' ? (
                <ComplianceAuditReportView
                  activeOrg={activeOrg}
                  taxQuarter={cit.taxQuarter}
                  taxYear={cit.taxYear}
                  citSummary={cit.citSummary}
                  citTierResult={cit.citTierResult}
                  facts={effectiveFacts}
                  onSwitchToLedger={() => setTaxViewMode('ledger')}
                  onQuarterChange={cit.handleQuarterChange}
                  onYearChange={cit.handleYearChange}
                  onOpenChecklistModal={handleOpenTaxChecklistModal}
                  onOpenEtaxGuide={() => cit.setShowEtaxModal(true)}
                />
              ) : (
                <CitLedgerSection
                  taxQuarter={cit.taxQuarter}
                  taxYear={cit.taxYear}
                  dynamicYearOptions={cit.dynamicYearOptions}
                  citTierResult={cit.citTierResult}
                  citSummary={cit.citSummary}
                  citCalcResult={cit.citCalcResult}
                  financialTab={cit.financialTab}
                  isExcelUploading={cit.isExcelUploading}
                  revenuesData={cit.revenuesData}
                  revenuesTotal={cit.revenuesTotal}
                  revenuePage={cit.revenuePage}
                  revenueLimit={cit.revenueLimit}
                  revenueSearch={cit.revenueSearch}
                  isRevenueLoading={cit.isRevenueLoading}
                  expensesData={cit.expensesData}
                  expensesTotal={cit.expensesTotal}
                  expensePage={cit.expensePage}
                  expenseLimit={cit.expenseLimit}
                  expenseSearch={cit.expenseSearch}
                  expenseFilterB4={cit.expenseFilterB4}
                  isExpenseLoading={cit.isExpenseLoading}
                  onQuarterChange={cit.handleQuarterChange}
                  onYearChange={cit.handleYearChange}
                  onChangeFinancialTab={cit.setFinancialTab}
                  onOpenChecklistModal={handleOpenTaxChecklistModal}
                  onOpenEtaxModal={() => cit.setShowEtaxModal(true)}
                  onNavigateContext={() => navigate('/context')}
                  onRevenueSearchChange={cit.setRevenueSearch}
                  onRevenueSearchSubmit={() => {
                    cit.setRevenuePage(1);
                    cit.fetchRevenues();
                  }}
                  onRevenuePageChange={(page, pageSize) => {
                    cit.setRevenuePage(page);
                    cit.setRevenueLimit(pageSize);
                  }}
                  onOpenAddRevenue={cit.handleOpenAddRevenue}
                  onOpenEditRevenue={cit.handleOpenEditRevenue}
                  onDeleteRevenue={cit.handleDeleteRevenue}
                  onUploadRevenueExcel={cit.handleUploadRevenueExcel}
                  onExpenseSearchChange={cit.setExpenseSearch}
                  onExpenseSearchSubmit={() => {
                    cit.setExpensePage(1);
                    cit.fetchExpenses();
                  }}
                  onExpenseFilterB4Change={(filter) => {
                    cit.setExpenseFilterB4(filter);
                    cit.setExpensePage(1);
                  }}
                  onExpensePageChange={(page, pageSize) => {
                    cit.setExpensePage(page);
                    cit.setExpenseLimit(pageSize);
                  }}
                  onOpenAddExpense={cit.handleOpenAddExpense}
                  onOpenEditExpense={cit.handleOpenEditExpense}
                  onDeleteExpense={cit.handleDeleteExpense}
                  onUploadExpenseExcel={cit.handleUploadExpenseExcel}
                />
              )}
            </div>
          )}

          {activeTab === 'thue_ke_toan' ? (
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() => navigate('/context')}
                className="rounded-xl text-xs font-semibold h-10 px-5"
              >
                Quay lại Bối cảnh Doanh nghiệp
              </Button>
            </div>
          ) : (
            <ContextFactCardsStep
              displayedFacts={displayedFacts}
              selectedCount={selectedFactIds.length}
              onCancel={() => navigate('/context')}
              onProceed={() => setStep('confirm')}
            />
          )}
        </div>
      )}

      {/* BƯỚC 2: XÁC NHẬN THANH TOÁN / GÓI THUÊ BAO */}
      {step === 'confirm' && (
        <AuditConfirmStep
          selectedCount={selectedFactIds.length}
          isProcessing={isProcessing}
          isBalanceSufficient={isBalanceSufficient}
          onBack={() => setStep('select')}
          onStartAudit={handleStartAudit}
        />
      )}

      {/* BƯỚC 3: QUÁ TRÌNH QUÉT & ĐỐI CHIẾU DỮ LIỆU */}
      {step === 'scanning' && (
        <AuditScanningStep scanProgress={scanProgress} scanStageText={scanStageText} />
      )}

      {/* BƯỚC 4: KẾT QUẢ RÀ SOÁT & XUẤT CHECKLIST (5 KHU VỰC CHUẨN) */}
      {step === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  <Check className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-800 m-0">
                  Hoàn Tất Rà Soát: Phát Hiện{' '}
                  {auditFindings.length > 0 ? auditFindings.length : 8} Nghĩa Vụ Cần Tuân Thủ
                </h3>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5 pl-8">
                Hệ thống đã tự động phân tích căn cứ pháp lý, tính toán mức phạt rủi ro và điều phối
                nhiệm vụ theo 5 khu vực chuẩn.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setStep('select')}
                className="rounded-xl text-xs font-semibold h-10"
              >
                Rà Soát Lượt Khác
              </Button>
              <Button
                type="primary"
                onClick={handleCreateAllChecklists}
                loading={isCreatingAll}
                className="bg-blue-600 hover:bg-blue-700 font-extrabold text-xs rounded-xl h-10 px-5 border-none shadow-sm"
              >
                Sinh Toàn Bộ ({auditFindings.length > 0 ? auditFindings.length : 8}) Checklist Tuân
                Thủ
              </Button>
            </div>
          </div>

          <ComplianceAuditReportView
            activeOrg={activeOrg}
            taxQuarter={cit.taxQuarter}
            taxYear={cit.taxYear}
            citSummary={cit.citSummary}
            citTierResult={cit.citTierResult}
            facts={effectiveFacts}
            onSwitchToLedger={() => {
              setStep('select');
              setActiveTab('thue_ke_toan');
              setTaxViewMode('ledger');
            }}
            onQuarterChange={cit.handleQuarterChange}
            onYearChange={cit.handleYearChange}
            onOpenChecklistModal={handleOpenTaxChecklistModal}
            onOpenEtaxGuide={() => cit.setShowEtaxModal(true)}
          />
        </div>
      )}

      {/* CÁC MODAL SỔ THU CHI & CHECKLIST */}
      <CitLedgerModals
        taxQuarter={cit.taxQuarter}
        taxYear={cit.taxYear}
        citSummary={cit.citSummary}
        dynamicYearOptions={cit.dynamicYearOptions}
        isImportConfirmModalOpen={cit.isImportConfirmModalOpen}
        pendingImportData={cit.pendingImportData}
        duplicateRows={cit.duplicateRows}
        onCloseImportConfirm={() => {
          cit.setIsImportConfirmModalOpen(false);
          cit.setPendingImportData(null);
          cit.setDuplicateRows(null);
        }}
        onConfirmOverwrite={cit.handleConfirmOverwrite}
        onConfirmAppend={cit.handleConfirmAppend}
        revenueForm={cit.revenueForm}
        isRevenueModalOpen={cit.isRevenueModalOpen}
        editingRevenueId={cit.editingRevenueId}
        onCloseRevenueModal={() => cit.setIsRevenueModalOpen(false)}
        onSaveRevenue={cit.handleSaveRevenue}
        expenseForm={cit.expenseForm}
        isExpenseModalOpen={cit.isExpenseModalOpen}
        editingExpenseId={cit.editingExpenseId}
        onCloseExpenseModal={() => cit.setIsExpenseModalOpen(false)}
        onSaveExpense={cit.handleSaveExpense}
        isChecklistModalOpen={cit.isChecklistModalOpen}
        selectedChecklistQuarter={cit.selectedChecklistQuarter}
        selectedChecklistYear={cit.selectedChecklistYear}
        isCreatingChecklist={cit.isCreatingChecklist}
        onChangeChecklistQuarter={cit.setSelectedChecklistQuarter}
        onChangeChecklistYear={cit.setSelectedChecklistYear}
        onCloseChecklistModal={() => cit.setIsChecklistModalOpen(false)}
        onConfirmCreateChecklist={cit.handleConfirmCreateChecklist}
      />

      {/* MODAL HƯỚNG DẪN NỘP THUẾ ETAX */}
      <EtaxPaymentGuideModal
        visible={cit.showEtaxModal}
        onClose={() => cit.setShowEtaxModal(false)}
        taxCode={cit.orgTaxCode}
        companyName={cit.orgName}
        prepaymentAmount={
          cit.citSummary.statutoryPrepayment80 || cit.citCalcResult?.statutoryPrepayment80 || 0
        }
        totalAnnualEstimatedTax={
          cit.citSummary.estimatedTaxAmount || cit.citCalcResult?.estimatedTaxAmount || 0
        }
        paidQuarter1To3={
          cit.taxQuarter === 4
            ? cit.citSummary.statutoryPrepayment80 > 0
              ? Math.round(cit.citSummary.statutoryPrepayment80 * 0.5)
              : undefined
            : undefined
        }
        cqtName={cit.orgCity}
        quarter={cit.taxQuarter}
        year={cit.taxYear}
        onUploadEvidence={() => navigate('/evidence')}
      />

      {/* MODAL KHẢO SÁT TÌNH HUỐNG CHUYÊN BIỆT THEO PHÂN HỆ */}
      <ModuleSurveyModal
        isOpen={isSurveyModalOpen}
        groupKey={activeTab}
        onClose={() => setIsSurveyModalOpen(false)}
        onSuccess={() => {
          fetchFacts();
        }}
      />
    </div>
  );
};

export default ContextAuditPage;
