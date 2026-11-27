import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { Form, Modal, message } from 'antd';
import apiClient from '../../../api/client';
import {
  downloadCitExcelTemplate,
  parseCitExcelFile,
  parseRevenueExcelOnly,
  parseExpenseExcelOnly,
  parseRowQuarterYear,
  type ParsedCitData,
  type RevenueRow,
  type ExpenseRow,
} from '../../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone } from '../../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult } from '../../../utils/citTaxCalculator';
import { determineCitTaxRate, type CitTaxTierResult } from '../../../utils/taxRateChecker';
import type { ContextFact, Organization } from '../../../interfaces';
import {
  type PeriodFinancialData,
  type PeriodStore,
  type CitSummaryData,
  type CitRevenueRecord,
  type CitExpenseRecord,
  EMPTY_CIT_SUMMARY,
} from './audit.constants';

interface UseCitLedgerStateParams {
  activeOrg: Organization | null;
  facts: ContextFact[];
  isLoadingFacts: boolean;
  createFact: (data: {
    key: string;
    label: string;
    group: string;
    currentValue: string;
    source?: string;
  }) => Promise<unknown>;
  updateFact: (id: string, value: string, reason?: string) => Promise<unknown>;
  fetchTasks?: () => Promise<unknown> | void;
  fetchNotifications?: () => Promise<unknown> | void;
  onNavigateTasks: () => void;
  onResetParentOnOrgChange: () => void;
}

export function useCitLedgerState({
  activeOrg,
  facts,
  isLoadingFacts,
  createFact,
  updateFact,
  fetchTasks,
  fetchNotifications,
  onNavigateTasks,
  onResetParentOnOrgChange,
}: UseCitLedgerStateParams) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentQuarter = useMemo(() => Math.floor(new Date().getMonth() / 3) + 1, []);
  const citQuarterKey = activeOrg?.id ? `celra_cit_quarter_${activeOrg.id}` : 'celra_cit_quarter';
  const citYearKey = activeOrg?.id ? `celra_cit_year_${activeOrg.id}` : 'celra_cit_year';

  const [taxQuarter, setTaxQuarter] = useState<number | 'ALL'>(() => {
    const saved = localStorage.getItem(citQuarterKey);
    return saved ? (saved === 'ALL' ? 'ALL' : Number(saved)) : currentQuarter;
  });
  const [taxYear, setTaxYear] = useState<number>(() => {
    const saved = localStorage.getItem(citYearKey);
    return saved ? Number(saved) : currentYear;
  });

  const [periodStore, setPeriodStore] = useState<PeriodStore>({});
  const [hasLoadedDbRecords, setHasLoadedDbRecords] = useState<boolean>(false);
  const [citCalcResult, setCitCalcResult] = useState<CitCalculationResult | null>(null);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showEtaxModal, setShowEtaxModal] = useState(false);
  const [financialTab, setFinancialTab] = useState<'revenue' | 'expense'>('revenue');

  // KPI tổng hợp từ Backend
  const [citSummary, setCitSummary] = useState<CitSummaryData>(EMPTY_CIT_SUMMARY);

  // Phân trang Doanh thu (Server-side)
  const [revenuesData, setRevenuesData] = useState<CitRevenueRecord[]>([]);
  const [revenuesTotal, setRevenuesTotal] = useState<number>(0);
  const [revenuePage, setRevenuePage] = useState<number>(1);
  const [revenueLimit, setRevenueLimit] = useState<number>(20);
  const [revenueSearch, setRevenueSearch] = useState<string>('');
  const [isRevenueLoading, setIsRevenueLoading] = useState<boolean>(false);
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);

  // Phân trang Chi phí & lọc B4 (Server-side)
  const [expensesData, setExpensesData] = useState<CitExpenseRecord[]>([]);
  const [expensesTotal, setExpensesTotal] = useState<number>(0);
  const [expensePage, setExpensePage] = useState<number>(1);
  const [expenseLimit, setExpenseLimit] = useState<number>(20);
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseFilterB4, setExpenseFilterB4] = useState<'ALL' | 'DISALLOWED' | 'DEDUCTIBLE'>('ALL');
  const [isExpenseLoading, setIsExpenseLoading] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Modals state
  const [pendingImportData, setPendingImportData] = useState<ParsedCitData | null>(null);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<{
    revenues: RevenueRow[];
    expenses: ExpenseRow[];
  } | null>(null);

  const [revenueForm] = Form.useForm();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingRevenueIndex, setEditingRevenueIndex] = useState<number | null>(null);

  const [expenseForm] = Form.useForm();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);

  // Checklist modal state
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [selectedChecklistQuarter, setSelectedChecklistQuarter] = useState<number | 'ALL'>(1);
  const [selectedChecklistYear, setSelectedChecklistYear] = useState<number>(currentYear);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);

  // API 1: Tải KPI tổng hợp CIT
  const fetchCitSummary = useCallback(async () => {
    if (!activeOrg?.id) {
      setCitSummary(EMPTY_CIT_SUMMARY);
      return;
    }
    try {
      const res = (await apiClient.get('/cit-ledger/summary', {
        params: { year: taxYear, quarter: taxQuarter },
        headers: { 'x-organization-id': activeOrg.id },
      })) as unknown as { data?: CitSummaryData; totalRevenue?: number } & Partial<CitSummaryData>;
      const summary = res?.data !== undefined && !res.totalRevenue ? res.data : (res as CitSummaryData);
      if (summary) {
        setCitSummary(summary);
      }
    } catch (err) {
      console.warn('Lỗi tải KPI tổng hợp CIT:', err);
    }
  }, [activeOrg?.id, taxYear, taxQuarter]);

  // API 2: Tải danh sách doanh thu
  const fetchRevenues = useCallback(async () => {
    if (!activeOrg?.id) {
      setRevenuesData([]);
      setRevenuesTotal(0);
      return;
    }
    setIsRevenueLoading(true);
    try {
      const res = (await apiClient.get('/cit-ledger/revenues', {
        params: {
          year: taxYear,
          quarter: taxQuarter,
          page: revenuePage,
          limit: revenueLimit,
          search: revenueSearch,
        },
        headers: { 'x-organization-id': activeOrg.id },
      })) as unknown as {
        data?: CitRevenueRecord[] | { data?: CitRevenueRecord[]; total?: number };
        total?: number;
      };
      const list = Array.isArray(res)
        ? (res as CitRevenueRecord[])
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
      const total =
        typeof res?.total === 'number'
          ? res.total
          : !Array.isArray(res?.data) && typeof res?.data?.total === 'number'
            ? res.data.total
            : list.length;
      setRevenuesData(list);
      setRevenuesTotal(total);
    } catch (err) {
      console.warn('Lỗi tải doanh thu:', err);
    } finally {
      setIsRevenueLoading(false);
    }
  }, [activeOrg?.id, taxYear, taxQuarter, revenuePage, revenueLimit, revenueSearch]);

  // API 3: Tải danh sách chi phí
  const fetchExpenses = useCallback(async () => {
    if (!activeOrg?.id) {
      setExpensesData([]);
      setExpensesTotal(0);
      return;
    }
    setIsExpenseLoading(true);
    try {
      const res = (await apiClient.get('/cit-ledger/expenses', {
        params: {
          year: taxYear,
          quarter: taxQuarter,
          page: expensePage,
          limit: expenseLimit,
          search: expenseSearch,
          filterB4: expenseFilterB4,
        },
        headers: { 'x-organization-id': activeOrg.id },
      })) as unknown as {
        data?: CitExpenseRecord[] | { data?: CitExpenseRecord[]; total?: number };
        total?: number;
      };
      const list = Array.isArray(res)
        ? (res as CitExpenseRecord[])
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
      const total =
        typeof res?.total === 'number'
          ? res.total
          : !Array.isArray(res?.data) && typeof res?.data?.total === 'number'
            ? res.data.total
            : list.length;
      setExpensesData(list);
      setExpensesTotal(total);
    } catch (err) {
      console.warn('Lỗi tải chi phí:', err);
    } finally {
      setIsExpenseLoading(false);
    }
  }, [activeOrg?.id, taxYear, taxQuarter, expensePage, expenseLimit, expenseSearch, expenseFilterB4]);

  useEffect(() => {
    fetchCitSummary();
    fetchRevenues();
    fetchExpenses();
  }, [fetchCitSummary, fetchRevenues, fetchExpenses]);

  // Reset sổ khi đổi doanh nghiệp
  useEffect(() => {
    setRevenuesData([]);
    setRevenuesTotal(0);
    setExpensesData([]);
    setExpensesTotal(0);
    setPeriodStore({});
    setCitCalcResult(null);
    onResetParentOnOrgChange();
  }, [activeOrg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thông tin doanh nghiệp & địa bàn ưu đãi
  const orgAddress = activeOrg?.address || 'Quận Ninh Kiều, TP. Cần Thơ';
  const orgTaxCode = activeOrg?.taxCode || '0101234567';
  const orgName = activeOrg?.legalName || activeOrg?.name || 'Doanh nghiệp';
  const orgModel = activeOrg?.legalType || 'TAG_TNHH_1TV';
  const orgCity = activeOrg?.city ? `Cục Thuế ${activeOrg.city}` : 'Cơ quan thuế quản lý trực tiếp';

  const incentiveInfo = useMemo(() => detectTaxIncentiveZone(orgAddress), [orgAddress]);

  const citTierResult: CitTaxTierResult = useMemo(() => {
    let priorRev = 0;
    let priorMonths = 12;
    let isFirstStartup = false;
    let hasRelated = false;

    if (activeOrg?.id) {
      try {
        const raw = localStorage.getItem(`celra_survey_profile_${activeOrg.id}`);
        if (raw) {
          const p = JSON.parse(raw);
          priorRev = p.annualRevenue || 0;
          priorMonths = p.operatingMonthsPriorYear || 12;
          isFirstStartup = Boolean(p.isFirstTimeStartup);
          hasRelated = Boolean(p.hasRelatedParty);
        }
      } catch {
        // Fallback
      }
    }

    return determineCitTaxRate({
      priorYearRevenue: priorRev,
      operatingMonthsPriorYear: priorMonths,
      isNewlyEstablished: activeOrg?.revenueStatus === 'newly_established',
      isFirstTimeStartup: isFirstStartup,
      hasRelatedParty: hasRelated,
      zoneTaxRate: incentiveInfo.taxRate,
      zoneTitle: incentiveInfo.title,
      zoneLegalBasis: incentiveInfo.legalBasis,
    });
  }, [activeOrg, incentiveInfo]);

  const dynamicYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear + 2; y >= currentYear - 5; y--) {
      years.push(y);
    }
    if (taxYear && !years.includes(taxYear)) {
      years.push(taxYear);
      years.sort((a, b) => b - a);
    }
    return years.map((y) => ({ value: y, label: `Năm ${y}` }));
  }, [currentYear, taxYear]);

  // Trích xuất doanh thu & chi phí từ periodStore
  const { revenues, expenses } = useMemo(() => {
    if (taxQuarter === 'ALL') {
      const q1 = periodStore[`${taxYear}_Q1`] || { revenues: [], expenses: [] };
      const q2 = periodStore[`${taxYear}_Q2`] || { revenues: [], expenses: [] };
      const q3 = periodStore[`${taxYear}_Q3`] || { revenues: [], expenses: [] };
      const q4 = periodStore[`${taxYear}_Q4`] || { revenues: [], expenses: [] };
      return {
        revenues: [
          ...(q1.revenues || []),
          ...(q2.revenues || []),
          ...(q3.revenues || []),
          ...(q4.revenues || []),
        ],
        expenses: [
          ...(q1.expenses || []),
          ...(q2.expenses || []),
          ...(q3.expenses || []),
          ...(q4.expenses || []),
        ],
      };
    }
    const currentKey = `${taxYear}_Q${taxQuarter}`;
    const period = periodStore[currentKey] || { revenues: [], expenses: [] };
    return {
      revenues: period.revenues || [],
      expenses: period.expenses || [],
    };
  }, [periodStore, taxQuarter, taxYear]);

  // Tải cit_financial_records từ DB
  useEffect(() => {
    if (!isLoadingFacts && facts) {
      const citFact = facts.find((f) => f.key === 'cit_financial_records');
      if (citFact && citFact.currentValue) {
        try {
          const parsed = JSON.parse(citFact.currentValue);
          if (parsed.periods && typeof parsed.periods === 'object') {
            setPeriodStore(parsed.periods);
            if (parsed.lastQuarter !== undefined) setTaxQuarter(parsed.lastQuarter);
            if (parsed.lastYear) setTaxYear(parsed.lastYear);
            setHasLoadedDbRecords(true);
            return;
          }
          if (Array.isArray(parsed.revenues) && Array.isArray(parsed.expenses)) {
            const q = parsed.taxQuarter || currentQuarter;
            const y = parsed.taxYear || currentYear;
            const periodKey = q === 'ALL' ? `${y}_Q1` : `${y}_Q${q}`;
            setPeriodStore({
              [periodKey]: {
                revenues: parsed.revenues,
                expenses: parsed.expenses,
              },
            });
            if (parsed.taxQuarter !== undefined) setTaxQuarter(parsed.taxQuarter);
            if (parsed.taxYear) setTaxYear(parsed.taxYear);
            setHasLoadedDbRecords(true);
            return;
          }
        } catch (e) {
          console.error('Lỗi đọc cit_financial_records từ cơ sở dữ liệu:', e);
        }
      }
      if (!hasLoadedDbRecords) {
        setPeriodStore({});
        setHasLoadedDbRecords(true);
      }
    }
  }, [facts, isLoadingFacts, hasLoadedDbRecords, currentQuarter, currentYear]);

  const saveRecordsToDb = async (
    newStore: PeriodStore,
    quarter: number | 'ALL' = taxQuarter,
    year: number = taxYear,
    quiet = false,
  ) => {
    try {
      const payloadString = JSON.stringify({
        periods: newStore,
        lastQuarter: quarter,
        lastYear: year,
        updatedAt: new Date().toISOString(),
      });
      const existingFact = facts.find((f) => f.key === 'cit_financial_records');
      if (existingFact?.id) {
        await updateFact(existingFact.id, payloadString, 'Cập nhật sổ thu chi thuế TNDN theo quý');
      } else {
        await createFact({
          key: 'cit_financial_records',
          label: 'Sổ Kê Khai Thu Chi Dự Toán Thuế TNDN',
          group: 'thue_ke_toan',
          currentValue: payloadString,
          source: 'Hệ thống CELRA',
        });
      }
      if (!quiet) {
        message.success('Đã lưu dữ liệu vào hệ thống (PostgreSQL) thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu lên máy chủ:', err);
      message.error('Không thể đồng bộ dữ liệu với máy chủ.');
    }
  };

  const updateCurrentQuarterRecords = async (
    updater: (prev: PeriodFinancialData) => PeriodFinancialData,
    successMsg?: string,
  ) => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Kỳ Cả năm là chế độ tổng hợp số liệu từ 4 Quý. Vui lòng chuyển sang Quý tương ứng để chỉnh sửa giao dịch!',
      );
      return;
    }
    const currentKey = `${taxYear}_Q${taxQuarter}`;
    const currentPeriod = periodStore[currentKey] || { revenues: [], expenses: [] };
    const updatedPeriod = updater(currentPeriod);
    const newStore: PeriodStore = {
      ...periodStore,
      [currentKey]: updatedPeriod,
    };
    setPeriodStore(newStore);
    await saveRecordsToDb(newStore, taxQuarter, taxYear, true);
    if (successMsg) {
      message.success(successMsg);
    }
  };

  // Tính lại nghĩa vụ thuế mỗi khi dữ liệu thay đổi
  useEffect(() => {
    const res = calculateCitTax(
      revenues,
      expenses,
      incentiveInfo,
      orgModel,
      citTierResult.taxRate,
      citTierResult.taxRatePercentText,
    );
    setCitCalcResult(res);
  }, [revenues, expenses, incentiveInfo, orgModel, citTierResult]);

  const handleQuarterChange = (val: number | 'ALL') => {
    setTaxQuarter(val);
    localStorage.setItem(citQuarterKey, String(val));
    saveRecordsToDb(periodStore, val, taxYear, true);
  };

  const handleYearChange = (val: number) => {
    setTaxYear(val);
    localStorage.setItem(citYearKey, String(val));
    saveRecordsToDb(periodStore, taxQuarter, val, true);
  };

  // Helper upload file bằng chứng tự động
  const uploadEvidenceQuietly = async (
    file: File,
    title: string,
    metadata: Record<string, unknown>,
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', 'Thuế Doanh Nghiệp');
      formData.append('tag', 'Bảng kê thu - chi');
      formData.append('quarter', String(taxQuarter));
      formData.append('year', String(taxYear));
      formData.append('metadata', JSON.stringify(metadata));

      await apiClient.post('/evidence-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (uploadErr) {
      console.warn('Lưu hồ sơ bằng chứng tự động gặp lỗi:', uploadErr);
    }
  };

  // Nạp file Excel Doanh thu riêng
  const handleUploadRevenueExcel = async (file: File) => {
    if (taxQuarter === 'ALL') {
      message.warning('Vui lòng chọn Quý 1, 2, 3 hoặc 4 để nạp file Excel Doanh thu!');
      return false;
    }
    setIsExcelUploading(true);
    try {
      const rows = await parseRevenueExcelOnly(file, taxQuarter, taxYear);
      if (!rows || rows.length === 0) {
        message.error('Không tìm thấy dòng doanh thu hợp lệ trong file Excel');
        return false;
      }
      await apiClient.post('/cit-ledger/revenues/import', {
        year: taxYear,
        quarter: Number(taxQuarter),
        items: rows,
      });

      await uploadEvidenceQuietly(file, `Bảng kê Doanh thu (Quý ${taxQuarter}/${taxYear})`, {
        quarter: taxQuarter,
        year: taxYear,
        tag: 'Bảng kê thu - chi',
        documentType: 'BẢNG KÊ DOANH THU EXCEL',
        rowCount: rows.length,
      });

      message.success(
        `Nạp thành công ${rows.length} khoản doanh thu và đã lưu file vào Hồ sơ & Bằng chứng!`,
      );
      fetchCitSummary();
      fetchRevenues();
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { message?: string } } };
      const errMsg =
        e?.message || e?.response?.data?.message || 'Dữ liệu của bạn còn thiếu không thể import';
      Modal.error({
        title: 'Không thể Import Excel Doanh thu',
        content: React.createElement(
          'div',
          { className: 'whitespace-pre-line text-sm text-slate-700 font-sans leading-relaxed pt-2' },
          errMsg,
        ),
        okText: 'Đã hiểu',
        width: 520,
      });
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  // Nạp file Excel Chi phí riêng
  const handleUploadExpenseExcel = async (file: File) => {
    if (taxQuarter === 'ALL') {
      message.warning('Vui lòng chọn Quý 1, 2, 3 hoặc 4 để nạp file Excel Chi phí!');
      return false;
    }
    setIsExcelUploading(true);
    try {
      const rows = await parseExpenseExcelOnly(file, taxQuarter, taxYear);
      if (!rows || rows.length === 0) {
        message.error('Không tìm thấy dòng chi phí hợp lệ trong file Excel');
        return false;
      }
      await apiClient.post('/cit-ledger/expenses/import', {
        year: taxYear,
        quarter: Number(taxQuarter),
        items: rows,
      });

      await uploadEvidenceQuietly(file, `Bảng kê Chi phí (Quý ${taxQuarter}/${taxYear})`, {
        quarter: taxQuarter,
        year: taxYear,
        tag: 'Bảng kê thu - chi',
        documentType: 'BẢNG KÊ CHI PHÍ EXCEL',
        rowCount: rows.length,
      });

      message.success(
        `Nạp thành công ${rows.length} khoản chi phí và đã lưu file vào Hồ sơ & Bằng chứng!`,
      );
      fetchCitSummary();
      fetchExpenses();
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { message?: string } } };
      const errMsg =
        e?.message || e?.response?.data?.message || 'Dữ liệu của bạn còn thiếu không thể import';
      Modal.error({
        title: 'Không thể Import Excel Chi phí',
        content: React.createElement(
          'div',
          { className: 'whitespace-pre-line text-sm text-slate-700 font-sans leading-relaxed pt-2' },
          errMsg,
        ),
        okText: 'Đã hiểu',
        width: 520,
      });
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  // Import Excel 2 Sheet (giữ nguyên cho tương thích)
  const handleExcelUpload = async (file: File) => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Kỳ Cả năm là chế độ tổng hợp tự động từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 trước khi nạp file Excel!',
      );
      return false;
    }
    setIsExcelUploading(true);
    try {
      const parsed = await parseCitExcelFile(file);
      const invalidRows: Array<{
        type: 'revenue' | 'expense';
        date: string;
        index: number;
        reason: string;
      }> = [];

      parsed.revenues.forEach((r, idx) => {
        const parsedDate = parseRowQuarterYear(r.date);
        if (!parsedDate) {
          invalidRows.push({
            type: 'revenue',
            date: r.date,
            index: idx + 1,
            reason: 'Định dạng ngày không hợp lệ',
          });
        } else if (parsedDate.year !== taxYear || parsedDate.quarter !== taxQuarter) {
          invalidRows.push({
            type: 'revenue',
            date: r.date,
            index: idx + 1,
            reason: `Thuộc Quý ${parsedDate.quarter}/${parsedDate.year} (Không khớp Quý ${taxQuarter}/${taxYear})`,
          });
        }
      });

      parsed.expenses.forEach((e, idx) => {
        const parsedDate = parseRowQuarterYear(e.date);
        if (!parsedDate) {
          invalidRows.push({
            type: 'expense',
            date: e.date,
            index: idx + 1,
            reason: 'Định dạng ngày không hợp lệ',
          });
        } else if (parsedDate.year !== taxYear || parsedDate.quarter !== taxQuarter) {
          invalidRows.push({
            type: 'expense',
            date: e.date,
            index: idx + 1,
            reason: `Thuộc Quý ${parsedDate.quarter}/${parsedDate.year} (Không khớp Quý ${taxQuarter}/${taxYear})`,
          });
        }
      });

      if (invalidRows.length > 0) {
        const firstErr = invalidRows[0];
        const tableType = firstErr.type === 'revenue' ? 'Doanh thu' : 'Chi phí';
        Modal.error({
          title: 'Hủy nạp: Ngày tháng không khớp kỳ kế toán!',
          width: 520,
          content: `Phát hiện ${invalidRows.length} dòng dữ liệu không thuộc Quý ${taxQuarter} / Năm ${taxYear}. Ví dụ tại bảng ${tableType}, dòng #${firstErr.index}: ngày "${firstErr.date}" (${firstErr.reason}).`,
          okText: 'Đã hiểu',
        });
        return false;
      }

      const res = calculateCitTax(
        parsed.revenues,
        parsed.expenses,
        incentiveInfo,
        orgModel,
        citTierResult.taxRate,
        citTierResult.taxRatePercentText,
      );
      await uploadEvidenceQuietly(
        file,
        `Bảng kê Doanh thu & Chi phí (Quý ${taxQuarter}/${taxYear})`,
        {
          quarter: taxQuarter,
          year: taxYear,
          tag: 'Bảng kê thu - chi',
          documentType: 'BẢNG KÊ THU CHI TNDN',
          totalRevenue: res.totalRevenue,
          totalExpense: res.totalAccountingExpense,
          estimatedTax: res.estimatedTaxAmount,
        },
      );

      setPendingImportData(parsed);
      setDuplicateRows(null);
      setIsImportConfirmModalOpen(true);
    } catch (err) {
      console.error(err);
      message.error(
        'Không thể đọc file Excel. Vui lòng tải đúng file mẫu chuẩn 2 Sheet (DOANH_THU & CHI_PHI) của CELRA!',
      );
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingImportData || taxQuarter === 'ALL') return;
    const periodKey = `${taxYear}_Q${taxQuarter}`;
    const newStore: PeriodStore = {
      ...periodStore,
      [periodKey]: {
        revenues: pendingImportData.revenues,
        expenses: pendingImportData.expenses,
      },
    };
    setPeriodStore(newStore);
    setIsImportConfirmModalOpen(false);

    try {
      await apiClient
        .delete('/cit-ledger/clear', {
          params: { year: taxYear, quarter: Number(taxQuarter), type: 'both' },
        })
        .catch(() => {});

      if (pendingImportData.revenues.length > 0) {
        await apiClient.post('/cit-ledger/revenues/import', {
          year: taxYear,
          quarter: Number(taxQuarter),
          items: pendingImportData.revenues,
        });
      }
      if (pendingImportData.expenses.length > 0) {
        await apiClient.post('/cit-ledger/expenses/import', {
          year: taxYear,
          quarter: Number(taxQuarter),
          items: pendingImportData.expenses,
        });
      }
      localStorage.setItem(citQuarterKey, String(taxQuarter));
      localStorage.setItem(citYearKey, String(taxYear));
    } catch (e) {
      console.error('Lỗi lưu vào DB cit-ledger:', e);
    }

    await saveRecordsToDb(newStore, taxQuarter, taxYear, true);
    await fetchCitSummary();
    await fetchRevenues();
    await fetchExpenses();

    message.success(
      `Đã xóa dữ liệu cũ Quý ${taxQuarter}/${taxYear} và nạp mới toàn bộ (${pendingImportData.revenues.length} khoản thu, ${pendingImportData.expenses.length} khoản chi)!`,
    );
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  const handleConfirmAppend = async () => {
    if (!pendingImportData || taxQuarter === 'ALL') return;
    const periodKey = `${taxYear}_Q${taxQuarter}`;
    const currentPeriod = periodStore[periodKey] || { revenues: [], expenses: [] };
    const curRevenues = currentPeriod.revenues || [];
    const curExpenses = currentPeriod.expenses || [];

    const dupRevenues = pendingImportData.revenues.filter((newRev) =>
      curRevenues.some(
        (cur) =>
          cur.date.trim() === newRev.date.trim() &&
          ((cur.invoiceNo &&
            newRev.invoiceNo &&
            cur.invoiceNo.trim().toLowerCase() === newRev.invoiceNo.trim().toLowerCase()) ||
            cur.description.trim().toLowerCase() === newRev.description.trim().toLowerCase()) &&
          Number(cur.amount) === Number(newRev.amount),
      ),
    );

    const dupExpenses = pendingImportData.expenses.filter((newExp) =>
      curExpenses.some(
        (cur) =>
          cur.date.trim() === newExp.date.trim() &&
          cur.category.trim().toLowerCase() === newExp.category.trim().toLowerCase() &&
          Number(cur.amount) === Number(newExp.amount),
      ),
    );

    const totalDuplicates = dupRevenues.length + dupExpenses.length;
    if (totalDuplicates > 0) {
      setDuplicateRows({ revenues: dupRevenues, expenses: dupExpenses });
      message.error(
        `Phát hiện ${totalDuplicates} dòng dữ liệu bị trùng lặp với Quý ${taxQuarter}/${taxYear}! Hệ thống đã chặn nạp dữ liệu. Vui lòng chọn "Xóa dữ liệu cũ & Ghi đè" hoặc làm sạch file Excel!`,
      );
      return;
    }

    const newStore: PeriodStore = {
      ...periodStore,
      [periodKey]: {
        revenues: [...curRevenues, ...pendingImportData.revenues],
        expenses: [...curExpenses, ...pendingImportData.expenses],
      },
    };
    setPeriodStore(newStore);
    setIsImportConfirmModalOpen(false);

    try {
      if (pendingImportData.revenues.length > 0) {
        await apiClient.post('/cit-ledger/revenues/import', {
          year: taxYear,
          quarter: Number(taxQuarter),
          items: pendingImportData.revenues,
        });
      }
      if (pendingImportData.expenses.length > 0) {
        await apiClient.post('/cit-ledger/expenses/import', {
          year: taxYear,
          quarter: Number(taxQuarter),
          items: pendingImportData.expenses,
        });
      }
      localStorage.setItem(citQuarterKey, String(taxQuarter));
      localStorage.setItem(citYearKey, String(taxYear));
    } catch (e) {
      console.error('Lỗi nối thêm vào DB cit-ledger:', e);
    }

    await saveRecordsToDb(newStore, taxQuarter, taxYear, true);
    await fetchCitSummary();
    await fetchRevenues();
    await fetchExpenses();

    message.success(
      `Đã nối thêm ${pendingImportData.revenues.length} khoản thu và ${pendingImportData.expenses.length} khoản chi vào Quý ${taxQuarter}/${taxYear} thành công!`,
    );
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  // CRUD Doanh thu
  const handleOpenAddRevenue = () => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Số liệu Cả năm được tự động tổng hợp từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 để thêm khoản thu!',
      );
      return;
    }
    revenueForm.resetFields();
    revenueForm.setFieldsValue({ date: dayjs(), amount: 10000000 });
    setEditingRevenueId(null);
    setIsRevenueModalOpen(true);
  };

  const handleOpenEditRevenue = (record: CitRevenueRecord) => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Số liệu Cả năm là chế độ xem tổng hợp. Vui lòng chuyển về đúng Quý phát sinh để chỉnh sửa!',
      );
      return;
    }
    setEditingRevenueId(record.id);
    const parsedDate = record.date
      ? dayjs(record.date, 'DD/MM/YYYY').isValid()
        ? dayjs(record.date, 'DD/MM/YYYY')
        : dayjs(record.date)
      : dayjs();
    revenueForm.setFieldsValue({
      date: parsedDate,
      invoiceNo: record.invoiceNo,
      description: record.description,
      amount: record.amount,
    });
    setIsRevenueModalOpen(true);
  };

  const handleSaveRevenue = async () => {
    try {
      const values = await revenueForm.validateFields();
      const dateStr = values.date
        ? typeof values.date.format === 'function'
          ? values.date.format('DD/MM/YYYY')
          : String(values.date)
        : dayjs().format('DD/MM/YYYY');
      if (editingRevenueId) {
        await apiClient.put(`/cit-ledger/revenues/${editingRevenueId}`, {
          date: dateStr,
          invoiceNo: values.invoiceNo || '',
          description: values.description,
          amount: Number(values.amount),
        });
        message.success('Cập nhật khoản thu thành công!');
      } else {
        await apiClient.post('/cit-ledger/revenues', {
          year: taxYear,
          quarter: Number(taxQuarter),
          date: dateStr,
          invoiceNo: values.invoiceNo || '',
          description: values.description,
          amount: Number(values.amount),
        });
        message.success('Thêm khoản thu thành công!');
      }
      setIsRevenueModalOpen(false);
      fetchCitSummary();
      fetchRevenues();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    try {
      await apiClient.delete(`/cit-ledger/revenues/${id}`);
      message.success('Đã xóa khoản thu thành công!');
      fetchCitSummary();
      fetchRevenues();
    } catch {
      message.error('Lỗi xóa khoản thu');
    }
  };

  // CRUD Chi phí
  const handleOpenAddExpense = () => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Số liệu Cả năm được tự động tổng hợp từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 để thêm khoản chi!',
      );
      return;
    }
    expenseForm.resetFields();
    expenseForm.setFieldsValue({
      date: dayjs(),
      paymentMethod: 'Chuyển khoản',
      hasInvoice: 'Có',
      amount: 5000000,
    });
    setEditingExpenseId(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (record: CitExpenseRecord) => {
    if (taxQuarter === 'ALL') {
      message.warning(
        'Số liệu Cả năm là chế độ xem tổng hợp. Vui lòng chuyển về đúng Quý phát sinh để chỉnh sửa!',
      );
      return;
    }
    setEditingExpenseId(record.id);
    const parsedDate = record.date
      ? dayjs(record.date, 'DD/MM/YYYY').isValid()
        ? dayjs(record.date, 'DD/MM/YYYY')
        : dayjs(record.date)
      : dayjs();
    expenseForm.setFieldsValue({
      date: parsedDate,
      category: record.category,
      amount: record.amount,
      paymentMethod: record.paymentMethod,
      hasInvoice: record.hasInvoice,
      note: record.note,
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async () => {
    try {
      const values = await expenseForm.validateFields();
      const dateStr = values.date
        ? typeof values.date.format === 'function'
          ? values.date.format('DD/MM/YYYY')
          : String(values.date)
        : dayjs().format('DD/MM/YYYY');
      if (editingExpenseId) {
        await apiClient.put(`/cit-ledger/expenses/${editingExpenseId}`, {
          date: dateStr,
          category: values.category,
          amount: Number(values.amount),
          paymentMethod: values.paymentMethod,
          hasInvoice: values.hasInvoice,
          note: values.note || '',
        });
        message.success('Cập nhật khoản chi thành công!');
      } else {
        await apiClient.post('/cit-ledger/expenses', {
          year: taxYear,
          quarter: Number(taxQuarter),
          date: dateStr,
          category: values.category,
          amount: Number(values.amount),
          paymentMethod: values.paymentMethod,
          hasInvoice: values.hasInvoice,
          note: values.note || '',
        });
        message.success('Thêm khoản chi thành công!');
      }
      setIsExpenseModalOpen(false);
      fetchCitSummary();
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await apiClient.delete(`/cit-ledger/expenses/${id}`);
      message.success('Đã xóa khoản chi thành công!');
      fetchCitSummary();
      fetchExpenses();
    } catch {
      message.error('Lỗi xóa khoản chi');
    }
  };

  // Tạo checklist hạn nộp thuế
  const handleConfirmCreateChecklist = async () => {
    setIsCreatingChecklist(true);
    try {
      const isCurrentQuarter =
        String(selectedChecklistQuarter) === String(taxQuarter) &&
        selectedChecklistYear === taxYear;

      await apiClient.post('/cit-ledger/sync-compliance-checklist', {
        year: selectedChecklistYear,
        quarter: selectedChecklistQuarter,
        estimatedTaxAmount: isCurrentQuarter ? citSummary.statutoryPrepayment80 : 0,
        revenueCount: isCurrentQuarter ? citSummary.revenueCount : 0,
        expenseCount: isCurrentQuarter ? citSummary.expenseCount : 0,
        disallowedExpenseAmount: isCurrentQuarter ? citSummary.totalDisallowedExpense : 0,
      });

      message.success(
        `Đã tạo thành công Checklist Hạn nộp thuế Quý ${selectedChecklistQuarter}/${selectedChecklistYear} & kích hoạt nhắc hạn trước 7 ngày!`,
      );
      setIsChecklistModalOpen(false);
      if (fetchTasks) fetchTasks();
      if (fetchNotifications) fetchNotifications();
      onNavigateTasks();
    } catch (err: unknown) {
      console.error(err);
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e?.response?.data?.message || 'Không thể tạo Checklist. Vui lòng thử lại!');
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  // Bảo lưu các helper cũ theo nguyên tắc bảo toàn mã nguồn
  void [
    downloadCitExcelTemplate,
    editingRevenueIndex,
    setEditingRevenueIndex,
    editingExpenseIndex,
    setEditingExpenseIndex,
    updateCurrentQuarterRecords,
    handleExcelUpload,
  ];

  return {
    // Org info
    orgTaxCode,
    orgName,
    orgCity,

    // Period & Calculation
    taxQuarter,
    taxYear,
    dynamicYearOptions,
    citTierResult,
    citSummary,
    citCalcResult,
    financialTab,
    setFinancialTab,
    isExcelUploading,
    showEtaxModal,
    setShowEtaxModal,
    handleQuarterChange,
    handleYearChange,

    // Revenue state & handlers
    revenuesData,
    revenuesTotal,
    revenuePage,
    setRevenuePage,
    revenueLimit,
    setRevenueLimit,
    revenueSearch,
    setRevenueSearch,
    isRevenueLoading,
    fetchRevenues,
    revenueForm,
    isRevenueModalOpen,
    setIsRevenueModalOpen,
    editingRevenueId,
    handleOpenAddRevenue,
    handleOpenEditRevenue,
    handleSaveRevenue,
    handleDeleteRevenue,
    handleUploadRevenueExcel,

    // Expense state & handlers
    expensesData,
    expensesTotal,
    expensePage,
    setExpensePage,
    expenseLimit,
    setExpenseLimit,
    expenseSearch,
    setExpenseSearch,
    expenseFilterB4,
    setExpenseFilterB4,
    isExpenseLoading,
    fetchExpenses,
    expenseForm,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    editingExpenseId,
    handleOpenAddExpense,
    handleOpenEditExpense,
    handleSaveExpense,
    handleDeleteExpense,
    handleUploadExpenseExcel,

    // Import Confirm modal
    pendingImportData,
    setPendingImportData,
    isImportConfirmModalOpen,
    setIsImportConfirmModalOpen,
    duplicateRows,
    setDuplicateRows,
    handleConfirmOverwrite,
    handleConfirmAppend,

    // Checklist modal
    isChecklistModalOpen,
    setIsChecklistModalOpen,
    selectedChecklistQuarter,
    setSelectedChecklistQuarter,
    selectedChecklistYear,
    setSelectedChecklistYear,
    isCreatingChecklist,
    handleConfirmCreateChecklist,
  };
}
