/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import apiClient from '../../api/client';
import { message, Upload, Button, Tag, Select } from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  WarningOutlined,
  FileExcelOutlined,
  CreditCardOutlined,
  CompassOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  BellOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useOrgStore } from '../../store/useOrgStore';
import { downloadCitExcelTemplate, parseCitExcelFile, detectPeriodFromCitData, type ParsedCitData } from '../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone } from '../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult } from '../../utils/citTaxCalculator';
import { determineCitTaxRate, type CitTaxTierResult } from '../../utils/taxRateChecker';
import { EtaxPaymentGuideModal } from '../tax/EtaxPaymentGuideModal';
import type { ContextFact, AuditFindingItem, ContextComplianceAuditModalProps } from '../../interfaces';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  ExternalLink,
  Coins,
  Check,
  AlertTriangle
} from 'lucide-react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { CONTEXT_GROUPS, ENABLED_CONTEXT_GROUP_KEYS } from '../../pages/Context/ContextPage';





const COST_PER_CARD = 25; // 25 Credit / thẻ bối cảnh

// Bảng rủi ro chế tài xử phạt thực tế theo các Nghị định hiện hành về Thuế & Hóa đơn
// eslint-disable-next-line react-refresh/only-export-components
export const STATUTORY_PENALTY_RISKS: Record<string, string> = {
  'RULE-TAX-GTGT':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá thời hạn quy định.',
  'RULE-TAX-TNDN-80':
    'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% quyết toán theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
  'RULE-TAX-MB':
    'Phạt tiền từ 2.000.000đ - 5.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai lệ phí môn bài quá hạn quy định.',
  'RULE-TAX-FCT-10D':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế nhà thầu quá hạn quy định.',
  'RULE-TAX-CYCLE-CHANGE-20D':
    'Phạt cảnh cáo hoặc phạt tiền từ 1.000.000đ - 5.000.000đ theo Điều 10 Nghị định 125/2020/NĐ-CP khi vi phạm thời hạn thông báo chuyển đổi kỳ tính thuế.',
  'RULE-TAX-DISSOLUTION-45D':
    'Phạt tiền từ 8.000.000đ - 15.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai quyết toán thuế khi giải thể chậm quá 90 ngày.',
  'RULE-TAX-POS-FNB':
    'Phạt cảnh cáo hoặc phạt tiền từ 4.000.000đ - 8.000.000đ theo Điều 24 Nghị định 125/2020/NĐ-CP đối với hành vi không lập hóa đơn điện tử máy tính tiền khi bán lẻ hàng hóa, dịch vụ ăn uống.',
};

// 21 Thẻ Bối Cảnh Chuẩn Luật Định Doanh Nghiệp Việt Nam (Dùng khi khởi tạo hoặc context rỗng)
const STANDARD_21_CONTEXT_FACTS: Array<Omit<ContextFact, 'id'> & { id: string }> = [
  // 1. Thuế (6 thẻ)
  {
    id: 'fact-tax-1',
    key: 'q_tax_corp_1',
    label: 'Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01) đúng hạn không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã nộp tờ khai và tiền thuế đầy đủ đúng hạn theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01)',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-2',
    key: 'q_tax_corp_2',
    label: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã tạm nộp định kỳ hàng quý, lũy kế 4 quý đạt tối thiểu 80% thuế TNDN cả năm',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-3',
    key: 'q_tax_corp_3',
    label: 'Doanh nghiệp có thực hiện kê khai và nộp Lệ phí môn bài hàng năm trước ngày 30/01 không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã nộp đầy đủ lệ phí môn bài bậc quy định trước ngày 30/01',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-4',
    key: 'q_tax_corp_4',
    label: 'Doanh nghiệp có thực hiện khấu trừ 10% thuế TNCN tại nguồn khi chi trả thù lao từ 2 triệu đồng/lần trở lên cho cá nhân vãng lai không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã thực hiện khấu trừ 10% và cấp chứng từ khấu trừ thuế TNCN điện tử',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-5',
    key: 'q_tax_corp_5',
    label: 'Doanh nghiệp có thanh toán chi phí quảng cáo trực tuyến (Facebook, Google, TikTok) và kê khai thuế nhà thầu (FCT) trong vòng 10 ngày không?',
    group: 'thue_ke_toan',
    currentValue: 'Có phát sinh chi phí quảng cáo và đã nộp tờ khai thuế nhà thầu mẫu 01/NTNN',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-6',
    key: 'q_tax_corp_6',
    label: 'Doanh nghiệp có lập và nộp Báo cáo tài chính, Quyết toán thuế TNDN & TNCN năm trước ngày 31/03 năm sau không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã nộp đầy đủ BCTC và hồ sơ quyết toán năm đúng thời hạn quy định',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  // 2. Hóa Đơn & Dòng Tiền (Phục vụ trực tiếp khấu trừ thuế GTGT & chi phí hợp lý TNDN)
  {
    id: 'fact-inv-1',
    key: 'q_invoice_1',
    label: 'Doanh nghiệp có sử dụng 100% hóa đơn điện tử có mã hoặc không có mã của cơ quan thuế theo Nghị định 123/2020/NĐ-CP không?',
    group: 'hoa_don_dong_tien',
    currentValue: 'Đã đăng ký và được cơ quan thuế chấp thuận sử dụng HĐĐT Mẫu 01/ĐKTĐ-HĐĐT',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-inv-2',
    key: 'q_invoice_2',
    label: 'Doanh nghiệp có gửi Mẫu 04/SS-HĐĐT giải trình với cơ quan thuế khi phát hiện hóa đơn điện tử có sai sót không?',
    group: 'hoa_don_dong_tien',
    currentValue: 'Đã lập và gửi thông báo Mẫu 04/SS-HĐĐT trong kỳ kê khai phát sinh',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-inv-3',
    key: 'q_invoice_3',
    label: 'Doanh nghiệp có lưu trữ dữ liệu hóa đơn điện tử an toàn tối thiểu 10 năm theo Luật Kế toán không?',
    group: 'hoa_don_dong_tien',
    currentValue: 'Đã thiết lập hệ thống sao lưu định kỳ hóa đơn XML và PDF lưu trữ an toàn',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-inv-4',
    key: 'q_invoice_4',
    label: 'Các hóa đơn đầu vào có giá trị từ 20 triệu đồng trở lên có được thanh toán qua tài khoản ngân hàng của doanh nghiệp không?',
    group: 'hoa_don_dong_tien',
    currentValue: '100% hóa đơn từ 20 triệu trở lên thanh toán không dùng tiền mặt',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-inv-5',
    key: 'q_invoice_5',
    label: 'Doanh nghiệp có đối chiếu số lượng hóa đơn đầu ra - đầu vào định kỳ hàng tháng để tránh chênh lệch tờ khai không?',
    group: 'hoa_don_dong_tien',
    currentValue: 'Đã đối soát khớp đúng giữa bảng kê hóa đơn và dữ liệu trên Cổng Thuế',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
];

export const ContextComplianceAuditModal: React.FC<ContextComplianceAuditModalProps> = ({
  isOpen,
  onClose,
  initialSelectedFactId,
  initialSelectedGroup,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { facts, fetchFacts } = useContextStore();
  const { wallet, fetchWallet, buyPackage } = useWalletStore();

  const [activeTab, setActiveTab] = useState<string>('thue_ke_toan');
  const [step, setStep] = useState<'select' | 'confirm' | 'scanning' | 'results'>('select');
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('Đang kết nối hệ thống dữ liệu bối cảnh...');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dữ liệu kết quả từ server
  const [auditId, setAuditId] = useState<string>('');
  const [auditFindings, setAuditFindings] = useState<AuditFindingItem[]>([]);
  const [creatingSingleId, setCreatingSingleId] = useState<string | null>(null);
  const [isCreatingAll, setIsCreatingAll] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('select');
      setScanProgress(0);
      setAuditFindings([]);
      fetchWallet();
      fetchFacts();
    }
  }, [fetchFacts, fetchWallet, isOpen]);

  // Danh sách fact hợp nhất: Ưu tiên facts từ Database, nếu rỗng thì dùng chuẩn 21 thẻ
  const effectiveFacts: ContextFact[] = useMemo(() => {
    const rawList = facts && facts.length > 0 ? facts : (STANDARD_21_CONTEXT_FACTS as ContextFact[]);
    // Hiện tại chỉ mở rà soát chuyên sâu cho phân hệ Thuế Doanh Nghiệp
    return rawList.filter((f) => ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''));
  }, [facts]);

  // Khởi tạo chọn toàn bộ thẻ theo Lĩnh Vực ban đầu (Không cho phép chọn lẻ)
  useEffect(() => {
    if (isOpen && effectiveFacts.length > 0) {
      if (initialSelectedGroup && initialSelectedGroup !== 'all') {
        const groupFacts = effectiveFacts.filter((f) => f.group === initialSelectedGroup);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedFactIds(groupFacts.map((f) => f.id));
        setActiveTab(initialSelectedGroup);
      } else if (initialSelectedFactId) {
        const target = effectiveFacts.find((f) => f.id === initialSelectedFactId);
        const targetGroup = target?.group || 'thue_ke_toan';
        const groupFacts = effectiveFacts.filter((f) => f.group === targetGroup);
        setSelectedFactIds(groupFacts.map((f) => f.id));
        setActiveTab(targetGroup);
      } else {
        const taxFacts = effectiveFacts.filter((f) => f.group === 'thue_ke_toan');
        setSelectedFactIds(taxFacts.map((f) => f.id));
        setActiveTab('thue_ke_toan');
      }
    }
  }, [isOpen, initialSelectedFactId, initialSelectedGroup, effectiveFacts]);

  // Nhóm hiển thị thẻ theo Tab
  const displayedFacts = useMemo(() => {
    return effectiveFacts.filter((f) => f.group === activeTab);
  }, [activeTab, effectiveFacts]);

  // Luôn luôn đồng bộ 100% thẻ của lĩnh vực đang xem (Khóa trọn gói, tuyệt đối không cho tick lẻ)
  useEffect(() => {
    if (isOpen && displayedFacts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFactIds(displayedFacts.map((f) => f.id));
    }
  }, [isOpen, displayedFacts]);

  // Tính toán chi phí: 25 Credit / thẻ
  const totalCost = selectedFactIds.length * COST_PER_CARD;
  const currentBalance = wallet?.balance ?? (wallet as any)?.soDu ?? 40;
  const isBalanceSufficient = currentBalance >= totalCost;
  const missingCredit = Math.max(0, totalCost - currentBalance);

  // 🏢 DỮ LIỆU DOANH NGHIỆP & DỰ TOÁN THUẾ TNDN QUA EXCEL
  const { activeOrg } = useOrgStore();
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
  const [citCalcResult, setCitCalcResult] = useState<CitCalculationResult | null>(null);
  const [parsedExcelData, setParsedExcelData] = useState<ParsedCitData | null>(null);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showEtaxModal, setShowEtaxModal] = useState(false);

  // Sinh danh sách năm động linh hoạt: từ (currentYear + 2) lùi về (currentYear - 5)
  const dynamicYearOptions = useMemo(() => {
    const years: number[] = [];
    const startYear = currentYear + 2;
    const endYear = currentYear - 5;
    for (let y = startYear; y >= endYear; y--) {
      years.push(y);
    }
    if (taxYear && !years.includes(taxYear)) {
      years.push(taxYear);
      years.sort((a, b) => b - a);
    }
    return years.map((y) => ({ value: y, label: `Năm ${y}` }));
  }, [currentYear, taxYear]);

  // Helper tính hạn nộp tờ khai và tiền thuế theo Luật Quản lý thuế số 38/2019/QH14 & NĐ 91/2022/NĐ-CP
  const getQuarterDeadline = (quarter: number | 'ALL', year: number) => {
    switch (quarter) {
      case 1: return `30/04/${year}`;
      case 2: return `31/07/${year}`;
      case 3: return `31/10/${year}`;
      case 4: return `31/01/${year + 1}`;
      case 'ALL': return `31/03/${year + 1}`;
      default: return `30/01/${year + 1}`;
    }
  };

  const getQuarterReminderDate = (quarter: number | 'ALL', year: number) => {
    switch (quarter) {
      case 1: return `23/04/${year}`;
      case 2: return `24/07/${year}`;
      case 3: return `24/10/${year}`;
      case 4: return `24/01/${year + 1}`;
      case 'ALL': return `24/03/${year + 1}`;
      default: return `24/01/${year + 1}`;
    }
  };

  const [isSyncingChecklist, setIsSyncingChecklist] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const { fetchTasks, fetchNotifications } = useTaskStore();

  const handleSyncChecklist = async () => {
    if (!citCalcResult) return;
    setIsSyncingChecklist(true);
    try {
      await apiClient.post('/cit-ledger/sync-compliance-checklist', {
        year: taxYear,
        quarter: taxQuarter,
        estimatedTaxAmount: citCalcResult.statutoryPrepayment80,
        revenueCount: parsedExcelData?.revenues?.length || 0,
        expenseCount: parsedExcelData?.expenses?.length || 0,
        disallowedExpenseAmount: citCalcResult.totalDisallowedExpense,
      });
      setIsSynced(true);
      message.success(
        `Đã tạo thành công Checklist Hạn nộp thuế Quý ${taxQuarter}/${taxYear} & kích hoạt nhắc hạn trước 7 ngày!`
      );
      if (fetchTasks) fetchTasks();
      if (fetchNotifications) fetchNotifications();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Không thể đồng bộ Checklist. Vui lòng thử lại!');
    } finally {
      setIsSyncingChecklist(false);
    }
  };

  const orgAddress = activeOrg?.address || activeOrg?.diaChi || 'Quận Ninh Kiều, TP. Cần Thơ';
  const orgTaxCode = activeOrg?.taxCode || activeOrg?.maSoThue || '0101234567';
  const orgName = activeOrg?.legalName || activeOrg?.name || activeOrg?.tenDoanhNghiep || 'Doanh nghiệp';
  const orgModel = activeOrg?.legalType || activeOrg?.loaiHinhPhapLy || 'TAG_TNHH_1TV';
  const orgCity = activeOrg?.city ? `Cục Thuế ${activeOrg.city}` : 'Cơ quan thuế quản lý trực tiếp';

  const incentiveInfo = useMemo(() => {
    return detectTaxIncentiveZone(orgAddress);
  }, [orgAddress]);

  // Rà soát thuế suất TNDN động theo Luật Thuế TNDN 67/2025 & NĐ 141/2026, NĐ 20/2026
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
  // Tự động khôi phục dữ liệu Thu - Chi từ Cơ sở dữ liệu PostgreSQL khi mở Modal hoặc đổi Kỳ
  const loadCitFromDb = useCallback(async (quarter: number | 'ALL', year: number) => {
    try {
      const [revRes, expRes]: [any, any] = await Promise.all([
        apiClient.get('/cit-ledger/revenues', { params: { year, quarter, limit: 100 } }),
        apiClient.get('/cit-ledger/expenses', { params: { year, quarter, limit: 100 } }),
      ]);
      const revs = Array.isArray(revRes?.data) ? revRes.data : (Array.isArray(revRes) ? revRes : []);
      const exps = Array.isArray(expRes?.data) ? expRes.data : (Array.isArray(expRes) ? expRes : []);

      if (revs.length > 0 || exps.length > 0) {
        const parsed: ParsedCitData = {
          fileName: 'cit_ledger_db.xlsx',
          totalRawRevenue: revs.length,
          totalRawExpense: exps.length,
          revenues: revs.map((r: any) => ({
            date: r.date,
            invoiceNo: r.invoiceNo || '',
            description: r.description,
            amount: Number(r.amount),
          })),
          expenses: exps.map((e: any) => ({
            date: e.date,
            category: e.category,
            amount: Number(e.amount),
            paymentMethod: e.paymentMethod,
            hasInvoice: e.hasInvoice,
            note: e.note || '',
          })),
        };
        setParsedExcelData(parsed);
        const res = calculateCitTax(
          parsed.revenues,
          parsed.expenses,
          incentiveInfo,
          orgModel,
          citTierResult.taxRate,
          citTierResult.taxRatePercentText,
        );
        setCitCalcResult(res);
      } else {
        setParsedExcelData(null);
        setCitCalcResult(null);
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu CIT từ DB:', err);
    }
  }, [incentiveInfo, orgModel]);

  useEffect(() => {
    if (isOpen) {
      loadCitFromDb(taxQuarter, taxYear);
    }
  }, [isOpen, taxQuarter, taxYear, loadCitFromDb]);

  const handleExcelUpload = async (file: File) => {
    setIsExcelUploading(true);
    setIsSynced(false);
    try {
      const parsed = await parseCitExcelFile(file);
      // Tự động bóc tách Quý & Năm từ dữ liệu ngày trong file Excel nếu có
      const detected = detectPeriodFromCitData(parsed.revenues, parsed.expenses);
      const effectiveYear = detected.year || taxYear;
      const effectiveQuarter = detected.quarter || taxQuarter;
      if (detected.year) {
        setTaxYear(detected.year);
      }
      if (detected.quarter) {
        setTaxQuarter(detected.quarter);
      }

      const res = calculateCitTax(
        parsed.revenues,
        parsed.expenses,
        incentiveInfo,
        orgModel,
        citTierResult.taxRate,
        citTierResult.taxRatePercentText,
      );
      setParsedExcelData(parsed);

      // 💾 LƯU DỮ LIỆU VĨNH VIỄN VÀO CƠ SỞ DỮ LIỆU POSTGRESQL QUA API NESTJS
      try {
        if (parsed.revenues.length > 0) {
          await apiClient.post('/cit-ledger/revenues/import', {
            year: effectiveYear,
            quarter: Number(effectiveQuarter),
            items: parsed.revenues,
          });
        }
        if (parsed.expenses.length > 0) {
          await apiClient.post('/cit-ledger/expenses/import', {
            year: effectiveYear,
            quarter: Number(effectiveQuarter),
            items: parsed.expenses,
          });
        }
        localStorage.setItem(citQuarterKey, String(effectiveQuarter));
        localStorage.setItem(citYearKey, String(effectiveYear));
      } catch (dbErr) {
        console.warn('Lỗi lưu vào DB cit-ledger:', dbErr);
      }

      // 📥 TỰ ĐỘNG LƯU FILE VÀO KHO HỒ SƠ & BẰNG CHỨNG
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', `Bảng kê Doanh thu & Chi phí (${effectiveQuarter === 'ALL' ? `Cả năm ${effectiveYear}` : `Quý ${effectiveQuarter}/${effectiveYear}`})`);
        formData.append('category', 'Thuế Doanh Nghiệp');
        formData.append('tag', 'Bảng kê thu - chi');
        formData.append('quarter', String(effectiveQuarter));
        formData.append('year', String(effectiveYear));
        formData.append('metadata', JSON.stringify({
          quarter: effectiveQuarter,
          year: effectiveYear,
          tag: 'Bảng kê thu - chi',
          documentType: 'BẢNG KÊ THU CHI TNDN',
          totalRevenue: res.totalRevenue,
          totalExpense: res.totalAccountingExpense,
          estimatedTax: res.estimatedTaxAmount,
        }));

        await apiClient.post('/evidence-documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (uploadErr) {
        console.warn('Lưu hồ sơ bằng chứng tự động gặp lỗi:', uploadErr);
      }

      const periodTag = detected.quarter && detected.year ? ` (Tự động nhận diện: Quý ${detected.quarter}/${detected.year})` : '';
      message.success(`Đã phân tích thành công và tự động lưu vào mục Hồ Sơ & Bằng Chứng!${periodTag}`);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể đọc file Excel. Vui lòng tải đúng file mẫu chuẩn 2 Sheet của CELRA!');
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  if (!isOpen) return null;

  // 1. GỌI API RÀ SOÁT BỐI CẢNH (BATCH AUDIT)
  const handleStartAudit = async () => {
    if (!isBalanceSufficient) {
      message.error(`Số dư Ví CELRA không đủ. Bạn đang thiếu ${missingCredit} Credit. Vui lòng nạp thêm.`);
      return;
    }

    setIsProcessing(true);
    setStep('scanning');
    setScanProgress(25);
    setScanStageText('Đang nén snapshot dữ liệu bối cảnh và kiểm tra Cache Fingerprint...');

    setTimeout(() => {
      setScanProgress(60);
      setScanStageText('Đối chiếu ma trận 11 đợt luật định và xác thực hiệu lực văn bản qua Cổng Dữ Liệu Pháp Luật...');
    }, 400);

    setTimeout(() => {
      setScanProgress(90);
      setScanStageText('Phân tích điều kiện áp dụng, minh chứng bắt buộc và tính hạn chót pháp lý...');
    }, 800);

    try {
      const res: any = await apiClient.post('/context-facts/batch-audit', {
        factIds: selectedFactIds.length > 0 ? selectedFactIds : undefined,
      });

      setScanProgress(100);
      setScanStageText('Hoàn tất rà soát tuân thủ!');

      const rawFindings: AuditFindingItem[] = Array.isArray(res?.findings) ? res.findings : [];
      // Bổ sung chế tài xử phạt nếu vi phạm theo quy định thực tế
      const enrichedFindings = rawFindings.map((f) => ({
        ...f,
        penaltyRisk: STATUTORY_PENALTY_RISKS[f.ruleCode] || 'Phạt tiền từ 2.000.000đ - 10.000.000đ theo quy định quản lý chuyên ngành đối với hành vi vi phạm nghĩa vụ tuân thủ.',
      }));

      setAuditId(res?.auditId || `audit-${Date.now()}`);
      setAuditFindings(enrichedFindings);
      await fetchWallet();

      setTimeout(() => {
        setStep('results');
        setIsProcessing(false);
      }, 500);
    } catch (err: any) {
      setIsProcessing(false);
      setStep('select');
      message.error(err?.message || 'Có lỗi xảy ra khi thực hiện rà soát tuân thủ.');
    }
  };

  // 2. TẠO RIÊNG TỪNG CHECKLIST
  const handleCreateSingleChecklist = async (finding: AuditFindingItem) => {
    setCreatingSingleId(finding.id);
    try {
      const payload = {
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
      };

      await apiClient.post('/context-facts/confirm-checklists', payload);
      message.success(`Đã tạo thành công Checklist: ${finding.obligationTitle}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi tạo Checklist');
    } finally {
      setCreatingSingleId(null);
    }
  };

  // 3. TẠO TOÀN BỘ CHECKLIST TUÂN THỦ (ALL BỘ)
  const handleCreateAllChecklists = async () => {
    if (auditFindings.length === 0) return;
    setIsCreatingAll(true);
    try {
      const payload = {
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
      };

      const res: any = await apiClient.post('/context-facts/confirm-checklists', payload);
      message.success(res?.message || `Đã tạo toàn bộ ${auditFindings.length} bộ Checklist tuân thủ thành công!`);
      if (onSuccess) onSuccess();
      onClose();
      navigate('/tasks');
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi xác nhận tạo toàn bộ Checklist');
    } finally {
      setIsCreatingAll(false);
    }
  };

  // Nạp nhanh gói Credit
  const handleDepositQuick = async () => {
    try {
      await buyPackage('PKG_120');
      message.success('Đã nạp gói (+120 Credit) vào ví CELRA thành công!');
      await fetchWallet();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi nạp Credit');
    }
  };

  // Helper render module tag tên đẹp
  const getModuleTag = (groupKey?: string) => {
    switch (groupKey) {
      case 'thue_ke_toan': return 'MODULE 1: THUẾ TNDN';
      case 'phap_ly_von': return 'MODULE 2: PHÁP LÝ';
      case 'nganh_nghe_van_hanh': return 'MODULE 3: VẬN HÀNH';
      case 'hoa_don_dong_tien': return 'MODULE 4: HÓA ĐƠN';
      case 'lao_dong_bhxh': return 'MODULE 5: LAO ĐỘNG';
      case 'dia_diem_pccc': return 'MODULE 6: PCCC';
      default: return 'MODULE BỐI CẢNH';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      style={{ zIndex: 2000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-linear-to-r from-teal-950 via-slate-950 to-teal-900 text-white flex items-center justify-between shrink-0 border-b border-teal-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-500/20 text-teal-300 rounded-lg border border-teal-400/30">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Rà soát Tuân thủ theo Context Doanh nghiệp
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  CELRA Compliance Audit
                </span>
              </h3>
            </div>
            <p className="text-xs text-teal-100/75 pl-9">
              Kiểm toán nghĩa vụ pháp lý từ dữ liệu thực tế, phát hiện rủi ro phạt và tự động sinh Checklist tuân thủ tức thời.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* ========================================================= */}
          {/* BƯỚC 1: CHỌN CÁC THẺ CONTEXT */}
          {/* ========================================================= */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* THANH TABS NHÓM BỐI CẢNH */}
              <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto">
                {CONTEXT_GROUPS.filter((g) => ENABLED_CONTEXT_GROUP_KEYS.includes(g.key)).map((g) => {
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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

              {/* HỘP HƯỚNG DẪN RÀ SOÁT TRỌN GÓI LĨNH VỰC (KHÔNG CÒN NÚT CHỌN LẺ) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/80 border border-teal-200 rounded-xl p-3.5">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2 m-0">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Rà soát trọn gói Lĩnh vực: {activeTab === 'all' ? 'Tất cả lĩnh vực bối cảnh' : CONTEXT_GROUPS.find((g) => g.key === activeTab)?.label || activeTab}</span>
                  </h4>
                  <p className="text-xs text-teal-800 m-0 mt-0.5">
                    Hệ thống sẽ đối chiếu đồng bộ toàn bộ {displayedFacts.length} thẻ bối cảnh thuộc lĩnh vực này với CSDL văn bản luật định để xác định rủi ro và xuất Checklist tuân thủ.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-xs font-bold px-3.5 py-2 bg-teal-600 text-white rounded-xl shadow-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-200" />
                    <span>Trọn gói: {displayedFacts.length} thẻ</span>
                  </span>
                </div>
              </div>

              {/* 📊 PHÂN HỆ NỘP FILE EXCEL THU - CHI DỰ TOÁN THUẾ TNDN (CHỈ HIỆN KHI CHỌN TAB THUẾ) */}
              {activeTab === 'thue_ke_toan' && (
                <div className="bg-linear-to-br from-amber-500/10 via-amber-50/60 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  {/* HEADER PHÂN HỆ */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 mt-0.5">
                        <FileExcelOutlined className="text-lg" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-amber-950 m-0">
                          Yêu Cầu Nộp Bảng Kê Doanh Thu & Chi Phí (File Excel) Để Dự Toán Thuế TNDN
                        </h4>
                        <div>
                          <button
                            type="button"
                            onClick={() => downloadCitExcelTemplate(taxQuarter, taxYear)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors"
                          >
                            <DownloadOutlined className="text-xs" />
                            <span>tải xuống file mẫu excel {taxQuarter === 'ALL' ? `(Cả năm ${taxYear})` : `(Quý ${taxQuarter}/${taxYear})`}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* VÙNG ƯU ĐÃI THUẾ THEO ĐỊA CHỈ */}
                    <div className="bg-white/90 border border-amber-200/90 rounded-xl px-3.5 py-2 shrink-0 flex items-center gap-2.5 shadow-xs">
                      <CompassOutlined className="text-teal-600 text-base" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Thuế suất TNDN 2026:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{citTierResult.title}</span>
                          <Tag color="purple" className="font-extrabold text-xs m-0">
                            {citTierResult.taxRatePercentText}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 📅 BỘ CHỌN KỲ TÍNH THUẾ (QUÝ VÀ NĂM) */}
                  <div className="bg-white/95 border border-amber-200/90 rounded-xl p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-amber-600 text-base" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Kỳ tính thuế:
                        </span>
                      </div>

                      {/* CHỌN QUÝ */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-slate-600">Quý:</label>
                        <Select
                          value={taxQuarter}
                          onChange={(val) => {
                            setTaxQuarter(val);
                            localStorage.setItem(citQuarterKey, String(val));
                            loadCitFromDb(val, taxYear);
                          }}
                          className="w-32"
                          size="middle"
                          options={[
                            { value: 1, label: 'Quý 1 (Q1)' },
                            { value: 2, label: 'Quý 2 (Q2)' },
                            { value: 3, label: 'Quý 3 (Q3)' },
                            { value: 4, label: 'Quý 4 (Q4)' },
                            { value: 'ALL', label: 'Cả năm' },
                          ]}
                        />
                      </div>

                      {/* CHỌN NĂM */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-slate-600">Năm:</label>
                        <Select
                          value={taxYear}
                          onChange={(val) => {
                            const y = Number(val);
                            setTaxYear(y);
                            localStorage.setItem(citYearKey, String(y));
                            loadCitFromDb(taxQuarter, y);
                          }}
                          className="w-32"
                          size="middle"
                          showSearch
                          options={dynamicYearOptions}
                          placeholder="Chọn năm"
                        />
                      </div>
                    </div>

                    {/* HẠN NỘP THEO LUẬT ĐỊNH */}
                    <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/80 shrink-0">
                      <ClockCircleOutlined className="text-amber-600" />
                      <span>
                        Hạn nộp tờ khai & thuế:{' '}
                        <strong className="font-extrabold text-amber-950 font-mono">
                          {getQuarterDeadline(taxQuarter, taxYear)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* KHU VỰC KÉO THẢ UPLOAD EXCEL TRỌN VÙNG */}
                  <div>
                    <Upload.Dragger
                      name="file"
                      accept=".xlsx, .xls"
                      multiple={false}
                      beforeUpload={handleExcelUpload}
                      showUploadList={false}
                      disabled={isExcelUploading}
                      className="rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white/60 p-4 transition-colors"
                    >
                      <p className="ant-upload-drag-icon text-amber-500 mb-1">
                        <InboxOutlined className="text-2xl" />
                      </p>
                      <p className="ant-upload-text text-xs font-bold text-slate-800 m-0">
                        Kéo thả file Excel thu - chi vào đây để hệ thống tự động bóc tách
                      </p>
                      <p className="ant-upload-hint text-[11px] text-slate-500 m-0 mt-0.5">
                        Hỗ trợ định dạng .xlsx tiêu chuẩn ({taxQuarter === 'ALL' ? `Cả năm ${taxYear}` : `Quý ${taxQuarter}/${taxYear}`}), tự động phân loại chi phí hợp lệ / bị loại trong 1 giây
                      </p>
                    </Upload.Dragger>
                  </div>

                  {/* KẾT QUẢ PHÂN TÍCH: 2 BẢNG THU & CHI + KHỐI TỔNG KẾT NGHĨA VỤ THUẾ */}
                  {citCalcResult && parsedExcelData && (
                    <div className="space-y-4 pt-2">
                      {/* BẢNG 1: BẢNG KÊ DOANH THU (SHEET DOANH_THU) */}
                      <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden shadow-xs">
                        <div className="bg-teal-50/90 px-4 py-2.5 border-b border-teal-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                            <h5 className="text-xs font-extrabold text-teal-950 uppercase m-0 tracking-wider">
                              1. Bảng Kê Doanh Thu Ghi Nhận ({parsedExcelData.revenues.length} khoản)
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                            Sheet: DOANH_THU
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                                <th className="py-2 px-2.5 text-center w-10">#</th>
                                <th className="py-2 px-2.5 w-24">Ngày</th>
                                <th className="py-2 px-2.5 w-24">Số HĐ</th>
                                <th className="py-2 px-2.5">Diễn giải / Khách hàng</th>
                                <th className="py-2 px-3 text-right w-36">Doanh thu chưa thuế</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parsedExcelData.revenues.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2 px-2.5 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                                  <td className="py-2 px-2.5 text-slate-700 font-medium whitespace-nowrap">{row.date}</td>
                                  <td className="py-2 px-2.5">
                                    {row.invoiceNo ? (
                                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                        {row.invoiceNo}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2.5 text-slate-800 font-medium">{row.description}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-teal-700 whitespace-nowrap">
                                    {row.amount.toLocaleString('vi-VN')} đ
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-teal-50/80 border-t-2 border-teal-300 font-bold text-xs">
                                <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider font-extrabold text-teal-950">
                                  Tổng Doanh Thu Ghi Nhận:
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-teal-800 whitespace-nowrap">
                                  {citCalcResult.totalRevenue.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* BẢNG 2: BẢNG KÊ CHI PHÍ KẾ TOÁN & RÀ SOÁT XUẤT TOÁN (SHEET CHI_PHI) */}
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                        <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <h5 className="text-xs font-extrabold text-slate-900 uppercase m-0 tracking-wider">
                              2. Bảng Kê Chi Phí Kế Toán & Rà Soát Xuất Toán ({parsedExcelData.expenses.length} khoản)
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Sheet: CHI_PHI
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                                <th className="py-2 px-2.5 text-center w-10">#</th>
                                <th className="py-2 px-2.5 w-20">Ngày chi</th>
                                <th className="py-2 px-2.5 min-w-[150px]">Khoản mục chi</th>
                                <th className="py-2 px-2.5 w-24 text-center">Thanh toán</th>
                                <th className="py-2 px-2.5 w-20 text-center">Hóa đơn</th>
                                <th className="py-2 px-3 text-right w-32">Số tiền (VNĐ)</th>
                                <th className="py-2 px-3 min-w-[200px]">Đánh giá tính hợp lý (Mục B4)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parsedExcelData.expenses.map((row, idx) => {
                                const disallowed = citCalcResult.disallowedItems.find(
                                  (d) => d.id.endsWith(`_${idx}`) || (d.date === row.date && d.category === row.category && d.amount === row.amount)
                                );
                                const isCash = row.paymentMethod.toLowerCase().includes('tiền mặt') || row.paymentMethod.toLowerCase().includes('cash');
                                const hasInv = row.hasInvoice.toLowerCase().includes('có') || row.hasInvoice.toLowerCase().includes('yes');

                                return (
                                  <tr
                                    key={idx}
                                    className={`transition-colors ${
                                      disallowed ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'
                                    }`}
                                  >
                                    <td className="py-2 px-2.5 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                                    <td className="py-2 px-2.5 text-slate-700 font-medium whitespace-nowrap">{row.date}</td>
                                    <td className="py-2 px-2.5">
                                      <span className="font-semibold text-slate-800 block">{row.category}</span>
                                      {row.note && <span className="text-[10px] text-slate-400 italic block mt-0.5">{row.note}</span>}
                                    </td>
                                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                                      {isCash ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                          Tiền mặt
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                          Chuyển khoản
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                                      {hasInv ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Có HĐ
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                          Không HĐ
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                      {row.amount.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="py-2 px-3">
                                      {disallowed ? (
                                        <div className="space-y-0.5">
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                            <WarningOutlined /> BỊ LOẠI (MỤC B4)
                                          </span>
                                          <p className="text-[10px] text-rose-700 m-0 font-medium leading-tight">
                                            {disallowed.reason}
                                          </p>
                                          <p className="text-[9px] text-slate-400 italic m-0">
                                            Căn cứ: {disallowed.legalBasis}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <Check className="w-3 h-3 text-emerald-600" /> Được trừ hợp lý
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider font-extrabold text-slate-800">
                                  Tổng Chi Phí Kế Toán:
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-slate-900 whitespace-nowrap">
                                  {citCalcResult.totalAccountingExpense.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Được trừ: <strong className="font-mono">{citCalcResult.totalDeductibleExpense.toLocaleString('vi-VN')} đ</strong>
                                    </span>
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                      Bị loại (B4): <strong className="font-mono">-{citCalcResult.totalDisallowedExpense.toLocaleString('vi-VN')} đ</strong>
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* KHỐI TỔNG KẾT NGHĨA VỤ THUẾ TNDN & TẠM NỘP 80% */}
                      <div className="bg-linear-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-xl p-4 shadow-md border border-teal-800/40 space-y-3">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-300 text-[11px] font-black uppercase tracking-wider border border-teal-400/30">
                                % Thuế Suất Áp Dụng: {citCalcResult.taxRatePercentText || citTierResult.taxRatePercentText}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10">
                                {citTierResult.title}
                              </span>
                              <span className="text-xs text-slate-300">
                                Thu nhập tính thuế: <strong className="font-mono text-white">{citCalcResult.assessableIncome.toLocaleString('vi-VN')} đ</strong>
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <div className="text-[11px] text-amber-200/80 font-bold uppercase tracking-wider">
                                Số Tiền Thuế TNDN Cả Năm Dự Kiến Cần Đóng:
                              </div>
                              <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-tight">
                                {citCalcResult.estimatedTaxAmount.toLocaleString('vi-VN')} VNĐ
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-teal-100 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1.5 rounded-lg">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                Nghĩa vụ tạm nộp 4 quý tối thiểu 80% (NĐ 91/2022/NĐ-CP):{' '}
                                <strong className="text-amber-300 font-mono text-xs font-bold">
                                  {citCalcResult.statutoryPrepayment80.toLocaleString('vi-VN')} VNĐ
                                </strong>{' '}
                                (Hạn chót: 30/01 năm sau).
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end">
                            <Button
                              type="primary"
                              icon={<CreditCardOutlined />}
                              onClick={() => setShowEtaxModal(true)}
                              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-10 px-4 border-none shadow-md shadow-amber-400/20 flex items-center justify-center gap-2"
                            >
                              Hướng Dẫn Nộp Thuế eTax (1052)
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* KHỐI SINH CHECKLIST HẠN NỘP THUẾ & NHẮC HẠN TRƯỚC 7 NGÀY */}
                      <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag color="cyan" className="font-extrabold px-2.5 py-0.5 rounded-lg border-cyan-300 text-xs m-0">
                              Checklist Quý {taxQuarter}/{taxYear}
                            </Tag>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <ClockCircleOutlined className="text-emerald-600" />
                              Hạn nộp đúng hạn: <strong className="text-slate-900 font-mono">{getQuarterDeadline(taxQuarter, taxYear)}</strong>
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-1.5">
                            <BellOutlined className="text-amber-500 text-sm" />
                            <span>
                              Tự động kích hoạt thông báo nhắc hạn: <strong className="text-amber-700 font-mono">{getQuarterReminderDate(taxQuarter, taxYear)}</strong> (cách hạn đúng 7 ngày).
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 m-0">
                            * Khởi tạo lộ trình tuân thủ 4 quý trong năm và đưa vào Lịch Tuân Thủ để không bị phạt chậm nộp 0,03%/ngày.
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isSynced ? (
                            <div className="flex items-center gap-2">
                              <Tag color="success" icon={<CheckCircleOutlined />} className="px-3 py-1.5 text-xs font-bold rounded-xl m-0">
                                Đã Lưu Checklist & Bật Nhắc Hạn
                              </Tag>
                              <Button
                                type="default"
                                icon={<CalendarOutlined />}
                                onClick={() => {
                                  onClose();
                                  navigate('/tasks');
                                }}
                                className="rounded-xl text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600"
                              >
                                Xem Lịch Tuân Thủ
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="primary"
                              icon={<CheckSquareOutlined />}
                              loading={isSyncingChecklist}
                              onClick={handleSyncChecklist}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 px-5 rounded-xl border-none shadow-md shadow-emerald-700/20"
                            >
                              Tạo Checklist & Bật Nhắc Hạn (Cách 7 Ngày)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GRID DANH SÁCH THẺ CONTEXT (TRỌN GÓI 100%, KHÔNG CÓ CHECKBOX, KHÔNG CHO TICK LẺ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedFacts.map((fact, idx) => {
                  const isConfirmed = fact.status === 'confirmed';

                  return (
                    <div
                      key={fact.id}
                      className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/20 shadow-xs space-y-2.5 relative select-none"
                    >
                      {/* Top Thẻ: Số thứ tự cố định, Module tag, Badge Trọn gói, Status tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 border border-teal-200 px-2 py-0.5 rounded">
                            {getModuleTag(fact.group)}
                          </span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-white border border-teal-200 px-1.5 py-0.2 rounded">
                            Trọn gói
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isConfirmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isConfirmed ? 'Đã xác nhận' : 'Chờ đối soát'}
                        </span>
                      </div>

                      {/* Tiêu đề câu hỏi / Fact label */}
                      <p className="text-xs font-bold text-slate-800 leading-snug m-0">
                        {fact.nhan || fact.label}
                      </p>

                      {/* Khung câu trả lời / Giá trị ghi nhận */}
                      <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-teal-100 leading-relaxed font-medium">
                        {fact.giaTriHienTai || fact.currentValue || fact.value || 'Chưa ghi nhận dữ liệu'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 2: XÁC NHẬN CHI PHÍ & RÀ SOÁT */}
          {/* ========================================================= */}
          {step === 'confirm' && (
            <div className="max-w-2xl mx-auto py-4 space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Xác nhận Chi phí Lượt Rà soát Tuân thủ
                </h4>
                <p className="text-xs text-slate-600">
                  Hệ thống sẽ khấu trừ số dư Credit ví CELRA để cấp quyền rà soát tức thì.
                </p>
              </div>

              {/* BẢNG TÍNH TOÁN CHI PHÍ */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs text-slate-600 font-medium">Số lượng thẻ Context được chọn:</span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                    {selectedFactIds.length} thẻ
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs text-slate-600 font-medium">Đơn giá kiểm toán tuân thủ / thẻ:</span>
                  <span className="text-xs font-semibold text-slate-800">{COST_PER_CARD} Credit / thẻ</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-slate-900">Tổng Credit cần thanh toán:</span>
                  <span className="text-lg font-extrabold text-teal-700">{totalCost} Credit</span>
                </div>
              </div>

              {/* KHUNG SỐ DƯ VÍ CREDIT */}
              <div
                className={`p-4 rounded-xl border ${
                  isBalanceSufficient 
                    ? 'bg-emerald-50/70 border-emerald-200' 
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isBalanceSufficient ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Số dư Ví Credit hiện tại:</div>
                      <div className="text-base font-extrabold text-slate-900">{currentBalance} Credit</div>
                    </div>
                  </div>

                  {!isBalanceSufficient ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Thiếu {missingCredit} Credit
                      </span>
                      <button
                        onClick={handleDepositQuick}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        + Nạp 120 Credit ngay
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                      ✓ Đủ điều kiện thanh toán
                    </span>
                  )}
                </div>
              </div>

              {/* DANH SÁCH CÁC THẺ CONTEXT CHUẨN BỊ RÀ SOÁT */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">
                  Danh sách các thẻ Context chuẩn bị rà soát:
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {effectiveFacts
                    .filter((f) => selectedFactIds.includes(f.id))
                    .map((fact) => (
                      <div key={fact.id} className="text-xs text-slate-700 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                        <span className="leading-snug">{fact.nhan || fact.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 3: TIẾN TRÌNH QUÉT (ANIMATION) */}
          {/* ========================================================= */}
          {step === 'scanning' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-teal-500 border-t-transparent animate-spin flex items-center justify-center bg-teal-50">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">CELRA Statutory Engine</h4>
                <p className="text-xs text-slate-600 font-medium">{scanStageText}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-linear-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 4: KẾT QUẢ RÀ SOÁT VÀ TẠO CHECKLIST */}
          {/* ========================================================= */}
          {step === 'results' && (
            <div className="space-y-5">
              {/* BANNER THÀNH CÔNG */}
              <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                    <h4 className="text-sm sm:text-base font-bold text-teal-950">
                      Rà soát hoàn tất! Phát hiện {auditFindings.length} nghĩa vụ tuân thủ cần thực thi
                    </h4>
                  </div>
                  <p className="text-xs text-teal-800">
                    Dữ liệu đã được đối chiếu toàn diện với văn bản pháp luật hiện hành và các quy định ngành của CELRA.
                  </p>
                </div>

                <button
                  onClick={handleCreateAllChecklists}
                  disabled={isCreatingAll || auditFindings.length === 0}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isCreatingAll ? 'Đang tạo...' : `Tạo toàn bộ Checklist tuân thủ (${auditFindings.length} bộ)`}
                </button>
              </div>

              {/* DANH SÁCH CÁC THẺ KẾT QUẢ NGHĨA VỤ */}
              <div className="space-y-4">
                {auditFindings.map((finding) => {
                  const directUrl = finding.legalDocUrl
                    ? cleanDLPLUrl(finding.legalDocUrl)
                    : (finding.legalBasis ? matchCoreLegalDocUrl(finding.legalBasis) : null);
                  const isUrgent = finding.suggestedPriority === 'urgent' || finding.suggestedPriority === 'high';
                  const isCreatingThis = creatingSingleId === finding.id;

                  // Thẻ context nguồn
                  const sourceFact = effectiveFacts.find((f) => f.id === finding.factId);

                  return (
                    <div
                      key={finding.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs"
                    >
                      {/* HEADER THẺ: Tags & Nút Tạo riêng */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                            {finding.ruleCode}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Ưu tiên: {isUrgent ? 'Khẩn cấp' : 'Trung bình'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Phụ trách: Phòng Kế toán & Tài chính
                          </span>
                        </div>

                        <button
                          onClick={() => handleCreateSingleChecklist(finding)}
                          disabled={isCreatingThis}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          {isCreatingThis ? 'Đang tạo...' : 'Tạo Checklist này'}
                        </button>
                      </div>

                      {/* TIÊU ĐỀ NGHĨA VỤ */}
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {finding.obligationTitle}
                        </h4>
                        {sourceFact && (
                          <p className="text-xs text-slate-500">
                            <strong>Thẻ Context gốc:</strong> {sourceFact.label} ({sourceFact.currentValue})
                          </p>
                        )}
                      </div>

                      {/* 2 KHUNG CỘT: CĂN CỨ PHÁP LÝ & RỦI RO CHẾ TÀI XỬ PHẠT */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        {/* Cột 1: Căn cứ pháp lý */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 flex flex-col justify-between">
                          <div>
                            <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                              ⚖ CĂN CỨ PHÁP LÝ ÁP DỤNG:
                            </span>
                            <p className="text-slate-600 leading-relaxed">
                              {finding.legalBasis}
                            </p>
                          </div>
                          {directUrl && (
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 mt-2 self-start"
                            >
                              Xem văn bản DLPL <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Cột 2: Rủi ro & Chế tài xử phạt */}
                        <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200/80 space-y-1.5">
                          <span className="font-bold text-rose-800 uppercase tracking-wide block mb-1">
                            ⚠ RỦI RO & CHẾ TÀI XỬ PHẠT NẾU VI PHẠM:
                          </span>
                          <p className="text-rose-900 leading-relaxed font-medium">
                            {finding.penaltyRisk}
                          </p>
                        </div>
                      </div>

                      {/* KHUNG: NHỮNG GÌ DOANH NGHIỆP CẦN TUÂN THỦ NGAY */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          Những gì doanh nghiệp cần tuân thủ ngay:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc leading-relaxed">
                          <li>{finding.actionRequired}</li>
                          {finding.evidenceRequired && (
                            <li>Chuẩn bị chứng từ minh chứng: {finding.evidenceRequired}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER ACTION BUTTONS */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          
          {/* Footer Bước 1 */}
          {step === 'select' && (
            <>
              <div className="text-xs text-slate-600">
                Tổng chi phí:{' '}
                <strong className="text-teal-800 text-sm font-extrabold">{totalCost} đ</strong>{' '}
                <span className="text-slate-500">({selectedFactIds.length} thẻ × {COST_PER_CARD}đ)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={selectedFactIds.length === 0}
                  className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedFactIds.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  Tiếp tục: Xác nhận chi phí
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Footer Bước 2 */}
          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Quay lại xem lĩnh vực
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleStartAudit}
                  disabled={isProcessing || !isBalanceSufficient}
                  className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isProcessing || !isBalanceSufficient
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  {isProcessing ? 'Đang rà soát...' : 'Xác nhận thanh toán & Rà soát ngay'}
                </button>
              </div>
            </>
          )}

          {/* Footer Bước 4 (Results) */}
          {step === 'results' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Rà soát lượt khác
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/tasks');
                  }}
                  className="px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer transition-colors"
                >
                  Mở trang Checklist & Task
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          {/* MODAL HƯỚNG DẪN NỘP THUẾ ETAX (1052) */}
          <EtaxPaymentGuideModal
            visible={showEtaxModal}
            onClose={() => setShowEtaxModal(false)}
            taxCode={orgTaxCode}
            companyName={orgName}
            prepaymentAmount={citCalcResult?.statutoryPrepayment80 || 0}
            cqtName={orgCity}
            quarter={taxQuarter}
            year={taxYear}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContextComplianceAuditModal;
