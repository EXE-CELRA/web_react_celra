/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useOrgStore } from '../../store/useOrgStore';
import apiClient from '../../api/client';
import { message, Upload, Button, Tag, Select, Modal, Form, Input, InputNumber, Radio, Popconfirm, Alert } from 'antd';
import {
  DownloadOutlined,
  WarningOutlined,
  FileExcelOutlined,
  CreditCardOutlined,
  CompassOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { 
  ShieldCheck,
  Wallet, 
  ArrowRight, 
  Sparkles,
  PlusCircle, 
  ExternalLink,
  Check,
  AlertTriangle,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  DollarSign,
  FileText,
  Upload as UploadIcon
} from 'lucide-react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { CONTEXT_GROUPS, ENABLED_CONTEXT_GROUP_KEYS } from './ContextPage';
import { downloadCitExcelTemplate, parseCitExcelFile, detectPeriodFromCitData, type ParsedCitData, type RevenueRow, type ExpenseRow } from '../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone } from '../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult } from '../../utils/citTaxCalculator';
import { EtaxPaymentGuideModal } from '../../components/tax/EtaxPaymentGuideModal';
import { ModuleSurveyModal } from '../../components/survey/ModuleSurveyModal';
import { isGroupSurveyCompleted } from '../../data/questionSurvey';
import type { ContextFact, AuditFindingItem } from '../../interfaces';

const COST_PER_CARD = 25; // 25 Credit / thẻ bối cảnh

// Bảng rủi ro chế tài xử phạt thực tế theo các Nghị định hiện hành về Thuế & Hóa đơn
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
    label: 'Doanh nghiệp có rà soát điều kiện thanh toán không dùng tiền mặt qua ngân hàng đối với các hóa đơn mua vào từng lần từ 20 triệu đồng trở lên không?',
    group: 'thue_ke_toan',
    currentValue: '100% hóa đơn từ 20 triệu trở lên đều được chuyển khoản qua tài khoản ngân hàng của doanh nghiệp',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
];

// Dữ liệu mẫu khởi tạo ban đầu cho Phân hệ Thuế TNDN (Chuẩn hóa để rà soát rủi ro thuế)
export const DEFAULT_REVENUE_ROWS: RevenueRow[] = [
  {
    date: '15/01/2025',
    invoiceNo: 'HD000128',
    description: 'Cung cấp dịch vụ tư vấn doanh nghiệp cho Cty An Bình',
    amount: 120000000,
  },
  {
    date: '28/02/2025',
    invoiceNo: 'HD000129',
    description: 'Thực hiện hợp đồng cung ứng gói phần mềm số đợt 1',
    amount: 250000000,
  },
  {
    date: '20/03/2025',
    invoiceNo: 'HD000130',
    description: 'Bán lẻ hàng hóa qua kênh thương mại điện tử',
    amount: 85000000,
  },
];

export const DEFAULT_EXPENSE_ROWS: ExpenseRow[] = [
  {
    date: '10/01/2025',
    category: 'Tiền thuê mặt bằng văn phòng làm việc',
    amount: 30000000,
    paymentMethod: 'Chuyển khoản',
    hasInvoice: 'Có',
    note: 'Hóa đơn tiền thuê nhà số 00412 chuyển khoản qua NH Vietcombank',
  },
  {
    date: '18/01/2025',
    category: 'Lương Chủ tịch kiêm Giám đốc (Công ty TNHH 1TV)',
    amount: 25000000,
    paymentMethod: 'Chuyển khoản',
    hasInvoice: 'Không',
    note: 'Thù lao điều hành của chủ sở hữu cá nhân (Rủi ro bị loại B4)',
  },
  {
    date: '05/02/2025',
    category: 'Mua thiết bị máy tính văn phòng',
    amount: 22000000,
    paymentMethod: 'Tiền mặt',
    hasInvoice: 'Có',
    note: 'Hóa đơn > 20 triệu nhưng trả tiền mặt (Rủi ro bị loại B4 Điều 4 TT 96/2015/TT-BTC)',
  },
  {
    date: '15/02/2025',
    category: 'Chi phí quảng cáo Facebook Ads trực tiếp qua thẻ',
    amount: 15000000,
    paymentMethod: 'Chuyển khoản',
    hasInvoice: 'Không',
    note: 'Dịch vụ nước ngoài xuyên biên giới (Cần nộp thuế nhà thầu FCT)',
  },
  {
    date: '22/02/2025',
    category: 'Mua văn phòng phẩm, giấy in lặt vặt tiếp khách',
    amount: 4500000,
    paymentMethod: 'Tiền mặt',
    hasInvoice: 'Không',
    note: 'Chi phí không có hóa đơn chứng từ hợp lệ (Rủi ro bị loại B4)',
  },
  {
    date: '10/03/2025',
    category: 'Thanh toán cước Internet và điện thoại công ty',
    amount: 3500000,
    paymentMethod: 'Chuyển khoản',
    hasInvoice: 'Có',
    note: 'Hóa đơn điện tử VNPT đầy đủ',
  },
];

export const ContextAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawGroup = searchParams.get('group');
  const initialGroup = (rawGroup === 'boi_canh_co_so' ? null : rawGroup) || 'thue_ke_toan';

  const { facts, fetchFacts, isLoading, createFact, updateFact } = useContextStore();
  const { wallet, fetchWallet, buyPackage } = useWalletStore();
  const { activeOrg } = useOrgStore();

  const [activeTab, setActiveTab] = useState<string>(initialGroup);
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'confirm' | 'scanning' | 'results'>('select');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStageText, setScanStageText] = useState<string>('');

  // Dữ liệu kết quả từ server
  const [auditId, setAuditId] = useState<string>('');
  const [auditFindings, setAuditFindings] = useState<AuditFindingItem[]>([]);
  const [creatingSingleId, setCreatingSingleId] = useState<string | null>(null);
  const [isCreatingAll, setIsCreatingAll] = useState<boolean>(false);

  // Modal khảo sát tình huống chuyên biệt (Check Gate)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState<boolean>(false);

  // Check gate: Nếu vào trang rà soát mà phân hệ hiện tại chưa làm khảo sát thì tự động mở modal
  useEffect(() => {
    if (!isLoading && facts && facts.length >= 0) {
      if (activeTab === 'thue_ke_toan') return;
      const isCompleted = isGroupSurveyCompleted(facts, activeTab);
      if (!isCompleted) {
        setIsSurveyModalOpen(true);
      }
    }
  }, [facts, activeTab, isLoading]);

  // 🏢 DỮ LIỆU DOANH NGHIỆP & SỔ THU CHI THUẾ TNDN
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentQuarter = useMemo(() => Math.floor(new Date().getMonth() / 3) + 1, []);
  const [taxQuarter, setTaxQuarter] = useState<number | 'ALL'>(currentQuarter);
  const [taxYear, setTaxYear] = useState<number>(currentYear);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [hasLoadedDbRecords, setHasLoadedDbRecords] = useState<boolean>(false);
  const [citCalcResult, setCitCalcResult] = useState<CitCalculationResult | null>(null);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showEtaxModal, setShowEtaxModal] = useState(false);

  // State Modal Import Excel & Chống Trùng Lặp
  const [pendingImportData, setPendingImportData] = useState<ParsedCitData | null>(null);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<{ revenues: RevenueRow[]; expenses: ExpenseRow[] } | null>(null);

  // State Modal Thêm/Sửa Khoản Thu
  const [revenueForm] = Form.useForm();
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingRevenueIndex, setEditingRevenueIndex] = useState<number | null>(null);

  // State Modal Thêm/Sửa Khoản Chi
  const [expenseForm] = Form.useForm();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);

  // Theo dõi Form chi phí để cảnh báo trực tiếp trong Modal khi vi phạm
  const expAmountWatch = Form.useWatch('amount', expenseForm);
  const expPaymentMethodWatch = Form.useWatch('paymentMethod', expenseForm);
  const expHasInvoiceWatch = Form.useWatch('hasInvoice', expenseForm);

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

  const orgAddress = activeOrg?.address || activeOrg?.diaChi || 'Quận Ninh Kiều, TP. Cần Thơ';
  const orgTaxCode = activeOrg?.taxCode || activeOrg?.maSoThue || '0101234567';
  const orgName = activeOrg?.legalName || activeOrg?.name || activeOrg?.tenDoanhNghiep || 'Doanh nghiệp';
  const orgModel = activeOrg?.legalType || activeOrg?.loaiHinhPhapLy || 'TAG_TNHH_1TV';
  const orgCity = activeOrg?.city ? `Cục Thuế ${activeOrg.city}` : 'Cơ quan thuế quản lý trực tiếp';

  const incentiveInfo = useMemo(() => {
    return detectTaxIncentiveZone(orgAddress);
  }, [orgAddress]);

  // 1. TẢI DỮ LIỆU TỪ DATABASE (POSTGRESQL QUA NESTJS API) KHI MỞ TRANG
  useEffect(() => {
    if (!isLoading && facts) {
      const citFact = facts.find((f) => f.key === 'cit_financial_records');
      if (citFact && citFact.currentValue) {
        try {
          const parsed = JSON.parse(citFact.currentValue);
          if (Array.isArray(parsed.revenues) && Array.isArray(parsed.expenses)) {
            setRevenues(parsed.revenues);
            setExpenses(parsed.expenses);
            if (parsed.taxQuarter !== undefined) setTaxQuarter(parsed.taxQuarter);
            if (parsed.taxYear) setTaxYear(parsed.taxYear);
            setHasLoadedDbRecords(true);
            return;
          }
        } catch (e) {
          console.error('Lỗi đọc cit_financial_records từ cơ sở dữ liệu:', e);
        }
      }
      // Nếu chưa có fact trong Database, khởi tạo bằng bộ dữ liệu chuẩn
      if (!hasLoadedDbRecords) {
        setRevenues(DEFAULT_REVENUE_ROWS);
        setExpenses(DEFAULT_EXPENSE_ROWS);
        setHasLoadedDbRecords(true);
      }
    }
  }, [facts, isLoading, hasLoadedDbRecords]);

  // 2. LƯU DỮ LIỆU VÀO DATABASE (POSTGRESQL QUA NESTJS API)
  const saveRecordsToDb = async (
    newRevenues: RevenueRow[],
    newExpenses: ExpenseRow[],
    quarter: number | 'ALL' = taxQuarter,
    year: number = taxYear,
    quiet = false
  ) => {
    try {
      const payloadString = JSON.stringify({
        revenues: newRevenues,
        expenses: newExpenses,
        taxQuarter: quarter,
        taxYear: year,
        updatedAt: new Date().toISOString(),
      });
      const existingFact = facts.find((f) => f.key === 'cit_financial_records');
      if (existingFact?.id) {
        await updateFact(existingFact.id, payloadString, 'Cập nhật sổ thu chi thuế TNDN');
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
    } catch (err: any) {
      console.error('Lỗi khi lưu dữ liệu lên máy chủ:', err);
      message.error('Không thể đồng bộ dữ liệu với máy chủ.');
    }
  };

  // 3. TÍNH TOÁN LẠI NGHĨA VỤ THUẾ & LỢI NHUẬN RÒNG SAU THUẾ TỨC THÌ MỖI KHI DỮ LIỆU ĐỔI
  useEffect(() => {
    const res = calculateCitTax(revenues, expenses, incentiveInfo, orgModel);
    setCitCalcResult(res);
  }, [revenues, expenses, incentiveInfo, orgModel]);

  // Thay đổi Quý / Năm
  const handleQuarterChange = (val: number | 'ALL') => {
    setTaxQuarter(val);
    saveRecordsToDb(revenues, expenses, val, taxYear, true);
  };

  const handleYearChange = (val: number) => {
    setTaxYear(val);
    saveRecordsToDb(revenues, expenses, taxQuarter, val, true);
  };

  // 4. IMPORT EXCEL & QUY TRÌNH CONFIRM CHỐNG TRÙNG LẶP DỮ LIỆU
  const handleExcelUpload = async (file: File) => {
    setIsExcelUploading(true);
    try {
      const parsed = await parseCitExcelFile(file);
      setPendingImportData(parsed);
      setDuplicateRows(null);
      setIsImportConfirmModalOpen(true);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể đọc file Excel. Vui lòng tải đúng file mẫu chuẩn 2 Sheet (DOANH_THU & CHI_PHI) của CELRA!');
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  // Lựa chọn 1: Xóa dữ liệu cũ & Ghi đè toàn bộ
  const handleConfirmOverwrite = async () => {
    if (!pendingImportData) return;
    const detected = detectPeriodFromCitData(pendingImportData.revenues, pendingImportData.expenses);
    const newQuarter = detected.quarter || taxQuarter;
    const newYear = detected.year || taxYear;
    if (detected.quarter) setTaxQuarter(detected.quarter);
    if (detected.year) setTaxYear(detected.year);

    setRevenues(pendingImportData.revenues);
    setExpenses(pendingImportData.expenses);
    setIsImportConfirmModalOpen(false);
    await saveRecordsToDb(pendingImportData.revenues, pendingImportData.expenses, newQuarter, newYear, true);
    message.success(`Đã xóa dữ liệu cũ và nạp mới toàn bộ (${pendingImportData.revenues.length} khoản thu, ${pendingImportData.expenses.length} khoản chi)!`);
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  // Lựa chọn 2: Giữ dữ liệu cũ & Nối thêm mới (Kiểm tra trùng lặp)
  const handleConfirmAppend = async () => {
    if (!pendingImportData) return;

    // Kiểm tra trùng lặp Doanh thu (Trùng Ngày + Số HĐ + Số tiền, hoặc Trùng Ngày + Diễn giải + Số tiền)
    const dupRevenues = pendingImportData.revenues.filter((newRev) =>
      revenues.some(
        (cur) =>
          cur.date.trim() === newRev.date.trim() &&
          ((cur.invoiceNo && newRev.invoiceNo && cur.invoiceNo.trim().toLowerCase() === newRev.invoiceNo.trim().toLowerCase()) ||
            cur.description.trim().toLowerCase() === newRev.description.trim().toLowerCase()) &&
          Number(cur.amount) === Number(newRev.amount)
      )
    );

    // Kiểm tra trùng lặp Chi phí (Trùng Ngày + Khoản mục + Số tiền)
    const dupExpenses = pendingImportData.expenses.filter((newExp) =>
      expenses.some(
        (cur) =>
          cur.date.trim() === newExp.date.trim() &&
          cur.category.trim().toLowerCase() === newExp.category.trim().toLowerCase() &&
          Number(cur.amount) === Number(newExp.amount)
      )
    );

    const totalDuplicates = dupRevenues.length + dupExpenses.length;
    if (totalDuplicates > 0) {
      // ⚠️ CHẶN HOÀN TOÀN KHÔNG CHO IMPORT KHI TRÙNG DỮ LIỆU
      setDuplicateRows({ revenues: dupRevenues, expenses: dupExpenses });
      message.error(
        `Phát hiện ${totalDuplicates} dòng dữ liệu bị trùng lặp với bảng hiện tại! Hệ thống đã chặn nạp dữ liệu. Vui lòng chọn "Xóa dữ liệu cũ & Ghi đè" hoặc làm sạch file Excel!`
      );
      return;
    }

    // Nếu không có trùng lặp, tiến hành nối thêm
    const mergedRevenues = [...revenues, ...pendingImportData.revenues];
    const mergedExpenses = [...expenses, ...pendingImportData.expenses];

    const detected = detectPeriodFromCitData(pendingImportData.revenues, pendingImportData.expenses);
    const newQuarter = detected.quarter || taxQuarter;
    const newYear = detected.year || taxYear;
    if (detected.quarter) setTaxQuarter(detected.quarter);
    if (detected.year) setTaxYear(detected.year);

    setRevenues(mergedRevenues);
    setExpenses(mergedExpenses);
    setIsImportConfirmModalOpen(false);
    await saveRecordsToDb(mergedRevenues, mergedExpenses, newQuarter, newYear, true);
    message.success(`Đã nối thêm ${pendingImportData.revenues.length} khoản thu và ${pendingImportData.expenses.length} khoản chi thành công!`);
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  // 5. THAO TÁC THÊM / SỬA / XÓA THỦ CÔNG DOANH THU
  const handleOpenAddRevenue = () => {
    revenueForm.resetFields();
    revenueForm.setFieldsValue({
      date: new Date().toLocaleDateString('vi-VN'),
      amount: 10000000,
    });
    setEditingRevenueIndex(null);
    setIsRevenueModalOpen(true);
  };

  const handleOpenEditRevenue = (index: number) => {
    setEditingRevenueIndex(index);
    revenueForm.setFieldsValue(revenues[index]);
    setIsRevenueModalOpen(true);
  };

  const handleSaveRevenue = async () => {
    try {
      const values = await revenueForm.validateFields();
      const row: RevenueRow = {
        date: values.date,
        invoiceNo: values.invoiceNo || '',
        description: values.description,
        amount: Number(values.amount),
      };
      let updated: RevenueRow[];
      if (editingRevenueIndex !== null) {
        updated = revenues.map((r, i) => (i === editingRevenueIndex ? row : r));
      } else {
        updated = [row, ...revenues];
      }
      setRevenues(updated);
      setIsRevenueModalOpen(false);
      await saveRecordsToDb(updated, expenses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRevenue = async (index: number) => {
    const updated = revenues.filter((_, i) => i !== index);
    setRevenues(updated);
    await saveRecordsToDb(updated, expenses);
    message.success('Đã xóa khoản thu thành công!');
  };

  // 6. THAO TÁC THÊM / SỬA / XÓA THỦ CÔNG CHI PHÍ
  const handleOpenAddExpense = () => {
    expenseForm.resetFields();
    expenseForm.setFieldsValue({
      date: new Date().toLocaleDateString('vi-VN'),
      paymentMethod: 'Chuyển khoản',
      hasInvoice: 'Có',
      amount: 5000000,
    });
    setEditingExpenseIndex(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (index: number) => {
    setEditingExpenseIndex(index);
    expenseForm.setFieldsValue(expenses[index]);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async () => {
    try {
      const values = await expenseForm.validateFields();
      const row: ExpenseRow = {
        date: values.date,
        category: values.category,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        hasInvoice: values.hasInvoice,
        note: values.note || '',
      };
      let updated: ExpenseRow[];
      if (editingExpenseIndex !== null) {
        updated = expenses.map((e, i) => (i === editingExpenseIndex ? row : e));
      } else {
        updated = [row, ...expenses];
      }
      setExpenses(updated);
      setIsExpenseModalOpen(false);
      await saveRecordsToDb(revenues, updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (index: number) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
    await saveRecordsToDb(revenues, updated);
    message.success('Đã xóa khoản chi thành công!');
  };

  useEffect(() => {
    fetchWallet();
    fetchFacts();
  }, [fetchFacts, fetchWallet]);

  // Danh sách fact hợp nhất: Ưu tiên facts từ Database, nếu rỗng thì dùng chuẩn thẻ
  const effectiveFacts: ContextFact[] = useMemo(() => {
    const rawList = facts && facts.length > 0 ? facts : (STANDARD_21_CONTEXT_FACTS as ContextFact[]);
    return rawList.filter((f) => f.group !== 'boi_canh_co_so' && ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''));
  }, [facts]);

  // Khởi tạo tab từ query parameter nếu có
  useEffect(() => {
    if (initialGroup) {
      setActiveTab(initialGroup);
    }
  }, [initialGroup]);

  // Nhóm hiển thị thẻ theo Tab
  const displayedFacts = useMemo(() => {
    return effectiveFacts.filter((f) => f.group === activeTab);
  }, [activeTab, effectiveFacts]);

  // Luôn luôn đồng bộ 100% thẻ của lĩnh vực đang xem (Khóa trọn gói)
  useEffect(() => {
    if (displayedFacts.length > 0) {
      setSelectedFactIds(displayedFacts.map((f) => f.id));
    }
  }, [displayedFacts]);

  // Tính toán chi phí: 25 Credit / thẻ
  const totalCost = selectedFactIds.length * COST_PER_CARD;
  const currentBalance = wallet?.balance ?? (wallet as any)?.soDu ?? 40;
  const isBalanceSufficient = currentBalance >= totalCost;
  const missingCredit = Math.max(0, totalCost - currentBalance);

  // GỌI API RÀ SOÁT BỐI CẢNH (BATCH AUDIT DÀNH CHO CÁC PHÂN HỆ KHÁC)
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
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi tạo Checklist');
    } finally {
      setCreatingSingleId(null);
    }
  };

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
      navigate('/tasks');
    } catch (err: any) {
      message.error(err?.message || 'Lỗi khi xác nhận tạo toàn bộ Checklist');
    } finally {
      setIsCreatingAll(false);
    }
  };

  const handleDepositQuick = async () => {
    try {
      await buyPackage('PKG_120');
      message.success('Đã nạp gói (+120 Credit) vào ví CELRA thành công!');
      await fetchWallet();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi nạp Credit');
    }
  };

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
              {CONTEXT_GROUPS.filter((g) => g.key !== 'boi_canh_co_so' && ENABLED_CONTEXT_GROUP_KEYS.includes(g.key)).map((g) => {
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

          {/* 📊 PHÂN HỆ QUẢN LÝ SỔ THU CHI & DỰ TOÁN THUẾ TNDN */}
          {activeTab === 'thue_ke_toan' && (
            <div className="bg-linear-to-br from-amber-500/10 via-amber-50/60 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-5 space-y-5 shadow-xs">
              {/* HEADER PHÂN HỆ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20 mt-0.5">
                    <FileExcelOutlined className="text-xl" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-extrabold text-amber-950 m-0">
                      Sổ Kê Khai Thu Chi, Rà Soát Xuất Toán (Mục B4) & Lợi Nhuận Ròng Thuế TNDN
                    </h4>
                    <p className="text-xs text-slate-600 m-0">
                      Tự động tính thuế TNDN, rà soát chi phí không hợp lệ theo Thông tư 96/2015/TT-BTC và tính lợi nhuận ròng sau thuế theo thời gian thực.
                    </p>
                  </div>
                </div>

                {/* VÙNG ƯU ĐÃI THUẾ THEO ĐỊA CHỈ */}
                <div className="bg-white/95 border border-amber-200/90 rounded-xl px-3.5 py-2 shrink-0 flex items-center gap-2.5 shadow-xs">
                  <CompassOutlined className="text-teal-600 text-base" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Ưu đãi vùng & Thuế suất:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{incentiveInfo.title}</span>
                      <Tag color={incentiveInfo.tier === 'ZONE_STANDARD' ? 'default' : 'success'} className="font-extrabold text-xs m-0">
                        {incentiveInfo.taxRatePercentText}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📅 BỘ CHỌN KỲ TÍNH THUẾ (QUÝ VÀ NĂM) & HẠN NỘP */}
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
                      onChange={handleQuarterChange}
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
                      onChange={handleYearChange}
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

              {/* 🌟 4 THẺ THỐNG KÊ TỔNG QUAN / KPI TRỰC QUAN */}
              {citCalcResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* CARD 1: TỔNG DOANH THU */}
                  <div className="bg-white rounded-2xl p-4 border border-teal-200 shadow-xs flex flex-col justify-between hover:border-teal-400 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">1. Tổng Doanh Thu</span>
                      <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <DollarSign className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-teal-800">
                      {citCalcResult.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{revenues.length} khoản thu ghi nhận</span>
                      <span className="text-teal-700 font-semibold font-mono">100% doanh thu</span>
                    </div>
                  </div>

                  {/* CARD 2: TỔNG CHI PHÍ KẾ TOÁN */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">2. Tổng Chi Phí Kế Toán</span>
                      <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                      {citCalcResult.totalAccountingExpense.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-emerald-700 font-semibold">
                        Được trừ: {citCalcResult.totalDeductibleExpense.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-rose-600 font-bold">
                        Bị loại (B4): -{citCalcResult.totalDisallowedExpense.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: THUẾ TNDN DỰ KIẾN */}
                  <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">3. Thuế TNDN Dự Kiến</span>
                      <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-amber-800">
                      {citCalcResult.estimatedTaxAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] text-amber-900 font-medium mt-1 flex items-center justify-between">
                      <span>Tạm nộp 80%: <strong className="font-mono">{citCalcResult.statutoryPrepayment80.toLocaleString('vi-VN')} đ</strong></span>
                      <Tag color="orange" className="font-extrabold text-[10px] m-0">Thuế suất {citCalcResult.incentiveInfo.taxRatePercentText}</Tag>
                    </div>
                  </div>

                  {/* CARD 4: LỢI NHUẬN RÒNG SAU THUẾ (NET PROFIT AFTER TAX) */}
                  <div className="bg-linear-to-br from-emerald-500/10 via-teal-50/70 to-emerald-50/60 rounded-2xl p-4 border-2 border-emerald-500 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex items-center justify-between text-emerald-800 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">4. Lợi Nhuận Ròng Sau Thuế</span>
                      <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <TrendingUp className="w-4 h-4" />
                      </span>
                    </div>
                    <div className={`text-xl sm:text-2xl font-black font-mono ${citCalcResult.netProfitAfterTax >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                      {citCalcResult.netProfitAfterTax.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center justify-between">
                      <span>= Doanh thu - Chi phí - Thuế</span>
                      <span className="text-emerald-900 font-bold font-mono">
                        {citCalcResult.totalRevenue > 0
                          ? `${((citCalcResult.netProfitAfterTax / citCalcResult.totalRevenue) * 100).toFixed(1)}% ROS`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 📋 BẢNG 1: BẢNG KÊ DOANH THU GHI NHẬN */}
              <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden shadow-xs">
                <div className="bg-teal-50/90 px-4 py-3 border-b border-teal-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                    <h5 className="text-xs sm:text-sm font-extrabold text-teal-950 uppercase m-0 tracking-wider">
                      1. Bảng Kê Doanh Thu Ghi Nhận ({revenues.length} khoản)
                    </h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                      onClick={handleOpenAddRevenue}
                      className="bg-teal-600 hover:bg-teal-700 border-none font-bold text-xs rounded-lg"
                    >
                      Thêm khoản thu
                    </Button>
                    <Upload
                      accept=".xlsx, .xls"
                      multiple={false}
                      beforeUpload={handleExcelUpload}
                      showUploadList={false}
                      disabled={isExcelUploading}
                    >
                      <Button
                        size="small"
                        icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1" />}
                        className="font-bold text-xs rounded-lg"
                        loading={isExcelUploading}
                      >
                        Import Excel
                      </Button>
                    </Upload>
                    <button
                      type="button"
                      onClick={() => downloadCitExcelTemplate(taxQuarter, taxYear)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer bg-transparent border-none p-0 ml-1 transition-colors"
                    >
                      <DownloadOutlined className="text-xs" />
                      <span>Tải file mẫu Excel</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3 w-28">Ngày ghi nhận</th>
                        <th className="py-2.5 px-3 w-28">Số hóa đơn</th>
                        <th className="py-2.5 px-3">Diễn giải / Khách hàng</th>
                        <th className="py-2.5 px-4 text-right w-44">Doanh thu chưa thuế (VNĐ)</th>
                        <th className="py-2.5 px-3 text-center w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenues.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            Chưa có khoản doanh thu nào. Bấm "+ Thêm khoản thu" hoặc "Import Excel" để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        revenues.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{row.date}</td>
                            <td className="py-2.5 px-3">
                              {row.invoiceNo ? (
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {row.invoiceNo}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium">{row.description}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700 whitespace-nowrap">
                              {row.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                                  onClick={() => handleOpenEditRevenue(idx)}
                                  className="hover:bg-blue-50"
                                  title="Sửa khoản thu"
                                />
                                <Popconfirm
                                  title="Xác nhận xóa"
                                  description="Bạn có chắc chắn muốn xóa khoản thu này không?"
                                  onConfirm={() => handleDeleteRevenue(idx)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                                    className="hover:bg-rose-50"
                                    title="Xóa khoản thu"
                                  />
                                </Popconfirm>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-teal-50/80 border-t-2 border-teal-300 font-bold text-xs">
                        <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-teal-950">
                          Tổng Doanh Thu Ghi Nhận:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm sm:text-base font-black text-teal-800 whitespace-nowrap">
                          {citCalcResult ? citCalcResult.totalRevenue.toLocaleString('vi-VN') : 0} đ
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 📋 BẢNG 2: BẢNG KÊ CHI PHÍ KẾ TOÁN & RÀ SOÁT XUẤT TOÁN (MỤC B4) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase m-0 tracking-wider">
                      2. Bảng Kê Chi Phí Kế Toán & Rà Soát Xuất Toán ({expenses.length} khoản)
                    </h5>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                      onClick={handleOpenAddExpense}
                      className="bg-amber-600 hover:bg-amber-700 border-none font-bold text-xs rounded-lg"
                    >
                      Thêm khoản chi
                    </Button>
                    <Upload
                      accept=".xlsx, .xls"
                      multiple={false}
                      beforeUpload={handleExcelUpload}
                      showUploadList={false}
                      disabled={isExcelUploading}
                    >
                      <Button
                        size="small"
                        icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1" />}
                        className="font-bold text-xs rounded-lg"
                        loading={isExcelUploading}
                      >
                        Import Excel
                      </Button>
                    </Upload>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-12">#</th>
                        <th className="py-2.5 px-3 w-24">Ngày chi</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Khoản mục chi</th>
                        <th className="py-2.5 px-3 w-28 text-center">Thanh toán</th>
                        <th className="py-2.5 px-3 w-24 text-center">Hóa đơn</th>
                        <th className="py-2.5 px-4 text-right w-36">Số tiền (VNĐ)</th>
                        <th className="py-2.5 px-4 min-w-[240px]">Đánh giá tính hợp lý (Mục B4)</th>
                        <th className="py-2.5 px-3 text-center w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                            Chưa có khoản chi phí nào. Bấm "+ Thêm khoản chi" hoặc "Import Excel" để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((row, idx) => {
                          const disallowed = citCalcResult?.disallowedItems.find(
                            (d) => d.id.endsWith(`_${idx}`) || (d.date === row.date && d.category === row.category && d.amount === row.amount)
                          );
                          const isCash = row.paymentMethod.toLowerCase().includes('tiền mặt') || row.paymentMethod.toLowerCase().includes('cash');
                          const hasInv = row.hasInvoice.toLowerCase().includes('có') || row.hasInvoice.toLowerCase().includes('yes');
                          const hasNoInv = !hasInv;
                          const isCashOver20M = isCash && row.amount >= 20000000;
                          const isOwnerSalary = orgModel === 'TAG_TNHH_1TV' && (
                            row.category.toLowerCase().includes('lương chủ') ||
                            row.category.toLowerCase().includes('lương giám đốc') ||
                            row.category.toLowerCase().includes('lương chủ tịch')
                          );
                          const isDisallowed = Boolean(disallowed || isCashOver20M || hasNoInv || isOwnerSalary);

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                isDisallowed
                                  ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">{row.date}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800 block">{row.category}</span>
                                {row.note && <span className="text-[11px] text-slate-400 italic block mt-0.5">{row.note}</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {isCash ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Tiền mặt
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Chuyển khoản
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {hasInv ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Có HĐ
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                    Không HĐ
                                  </span>
                                )}
                              </td>
                              <td className={`py-2.5 px-4 text-right font-mono font-bold whitespace-nowrap ${isDisallowed ? 'text-rose-700' : 'text-slate-800'}`}>
                                {row.amount.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="py-2.5 px-4">
                                {isDisallowed ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                      <WarningOutlined /> BỊ LOẠI (MỤC B4)
                                    </span>
                                    <p className="text-[11px] text-rose-700 m-0 font-bold leading-snug">
                                      {isCashOver20M
                                        ? 'Hóa đơn ≥ 20 triệu thanh toán tiền mặt (không có chứng từ ngân hàng).'
                                        : hasNoInv
                                        ? 'Chi phí không có hóa đơn chứng từ hợp pháp.'
                                        : isOwnerSalary
                                        ? 'Lương/thù lao của chủ công ty TNHH 1TV do cá nhân làm chủ.'
                                        : disallowed?.reason || 'Chi phí bị loại trừ theo luật thuế.'}
                                    </p>
                                    <p className="text-[10px] text-rose-600/80 italic m-0">
                                      Căn cứ: {isCashOver20M ? 'Điều 4 Thông tư 96/2015/TT-BTC & Điều 15 TT 219/2013/TT-BTC' : (disallowed?.legalBasis || 'Thông tư 96/2015/TT-BTC')}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" /> Được trừ hợp lý
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
                                    onClick={() => handleOpenEditExpense(idx)}
                                    className="hover:bg-blue-50"
                                    title="Sửa dòng chi phí"
                                  />
                                  <Popconfirm
                                    title="Xác nhận xóa"
                                    description="Bạn có chắc chắn muốn xóa khoản chi này không?"
                                    onConfirm={() => handleDeleteExpense(idx)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                                      className="hover:bg-rose-50"
                                      title="Xóa dòng chi phí"
                                    />
                                  </Popconfirm>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                        <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-slate-800">
                          Tổng Chi Phí Kế Toán:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">
                          {citCalcResult ? citCalcResult.totalAccountingExpense.toLocaleString('vi-VN') : 0} đ
                        </td>
                        <td colSpan={2} className="py-3 px-4">
                          {citCalcResult && (
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Được trừ: <strong className="font-mono">{citCalcResult.totalDeductibleExpense.toLocaleString('vi-VN')} đ</strong>
                              </span>
                              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Bị loại (B4): <strong className="font-mono">-{citCalcResult.totalDisallowedExpense.toLocaleString('vi-VN')} đ</strong>
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* KHỐI TỔNG KẾT NGHĨA VỤ THUẾ TNDN & TẠM NỘP 80% */}
              {citCalcResult && (
                <div className="bg-linear-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-lg border border-teal-800/40 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-400/20 text-teal-300 text-xs font-black uppercase tracking-wider border border-teal-400/30">
                          % Thuế Suất Áp Dụng: {citCalcResult.incentiveInfo.taxRatePercentText}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
                          {incentiveInfo.title}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                          Kỳ tính thuế: {taxQuarter === 'ALL' ? `Cả năm ${taxYear}` : `Quý ${taxQuarter} / ${taxYear}`}
                        </span>
                        <span className="text-xs text-slate-300">
                          Thu nhập tính thuế: <strong className="font-mono text-white">{citCalcResult.assessableIncome.toLocaleString('vi-VN')} đ</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-amber-200/80 font-bold uppercase tracking-wider">
                          Số Tiền Thuế TNDN {taxQuarter === 'ALL' ? `Cả Năm ${taxYear}` : `Quý ${taxQuarter}/${taxYear}`} Dự Kiến Cần Đóng:
                        </div>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-tight">
                          {citCalcResult.estimatedTaxAmount.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-teal-100 bg-teal-950/60 border border-teal-500/30 px-3 py-2 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          Nghĩa vụ tạm nộp 4 quý tối thiểu 80% (Nghị định 91/2022/NĐ-CP):{' '}
                          <strong className="text-amber-300 font-mono text-sm font-bold">
                            {citCalcResult.statutoryPrepayment80.toLocaleString('vi-VN')} VNĐ
                          </strong>{' '}
                          (Hạn chót nộp kỳ {taxQuarter === 'ALL' ? `năm ${taxYear}` : `Q${taxQuarter}/${taxYear}`}: <strong>{getQuarterDeadline(taxQuarter, taxYear)}</strong>).
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-center">
                      <Button
                        type="primary"
                        icon={<CreditCardOutlined />}
                        onClick={() => setShowEtaxModal(true)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl h-11 px-5 border-none shadow-md shadow-amber-400/20 flex items-center justify-center gap-2"
                      >
                        Hướng Dẫn Nộp Thuế eTax (Tiểu mục 1052)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NẾU LÀ PHÂN HỆ THUẾ TNDN: CHỈ CẦN NÚT QUAY LẠI VÌ ĐÃ CÓ TOÀN BỘ SỔ THU CHI Ở TRÊN */}
          {activeTab === 'thue_ke_toan' ? (
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 italic">
                * Dữ liệu Sổ Thu Chi được lưu trữ trực tiếp trên PostgreSQL qua API NestJS và được bảo lưu trọn vẹn khi đổi thiết bị hoặc tải lại trang.
              </span>
              <Button
                onClick={() => navigate('/context')}
                className="rounded-xl text-xs font-semibold h-10 px-5"
              >
                Quay lại Bối cảnh Doanh nghiệp
              </Button>
            </div>
          ) : (
            <>
              {/* GRID DANH SÁCH THẺ CONTEXT (DÀNH CHO CÁC PHÂN HỆ KHÁC) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedFacts.map((fact, idx) => {
                  const isConfirmed = fact.status === 'confirmed';

                  return (
                    <div
                      key={fact.id}
                      className="p-4.5 rounded-2xl border border-teal-200/80 bg-teal-50/20 shadow-xs space-y-2.5 select-none"
                    >
                      {/* Top Thẻ */}
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

                      {/* Tiêu đề câu hỏi */}
                      <p className="text-xs font-bold text-slate-800 leading-snug m-0">
                        {fact.nhan || fact.label}
                      </p>

                      {/* Giá trị ghi nhận */}
                      <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-teal-100 leading-relaxed font-medium">
                        {fact.giaTriHienTai || fact.currentValue || (
                          <span className="text-slate-400 italic">Chưa có thông tin ghi nhận</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FOOTER BƯỚC 1: XÁC NHẬN CHI PHÍ */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Tổng chi phí rà soát:{' '}
                  <strong className="text-teal-700 font-mono text-sm">
                    {totalCost.toLocaleString('vi-VN')} Credit
                  </strong>{' '}
                  ({selectedFactIds.length} thẻ $\times$ {COST_PER_CARD} Credit).
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate('/context')} className="rounded-xl text-xs font-semibold h-10 px-4">
                    Hủy & Quay lại
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setStep('confirm')}
                    disabled={selectedFactIds.length === 0}
                    className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-6 shadow-xs border-none"
                  >
                    Tiếp tục: Xác nhận chi phí <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* BƯỚC 2: XÁC NHẬN THANH TOÁN TỪ VÍ */}
      {/* ========================================================= */}
      {step === 'confirm' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800 m-0">
              Xác Nhận Thanh Toán Phí Kiểm Toán Rà Soát
            </h3>
            <p className="text-xs text-slate-500 m-0">
              Phí dịch vụ sẽ được trừ trực tiếp từ số dư Ví CELRA của doanh nghiệp bạn.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Số lượng thẻ bối cảnh:</span>
              <span className="font-bold text-slate-800">{selectedFactIds.length} thẻ trọn gói</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Đơn giá mỗi thẻ:</span>
              <span className="font-mono text-slate-700">{COST_PER_CARD} Credit</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-sm">
              <span className="font-bold text-slate-800">Tổng phí thanh toán:</span>
              <span className="font-mono font-black text-teal-700 text-base">{totalCost} Credit</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Số dư ví hiện tại:</span>
              <span className="font-mono font-bold text-slate-800">{currentBalance} Credit</span>
            </div>
          </div>

          {!isBalanceSufficient && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Số dư không đủ để thực hiện (Thiếu {missingCredit} Credit)</span>
              </div>
              <p className="m-0 text-[11px]">
                Vui lòng nạp nhanh gói Credit để tiếp tục quy trình kiểm toán tuân thủ.
              </p>
              <Button
                type="primary"
                onClick={handleDepositQuick}
                className="bg-rose-600 hover:bg-rose-700 border-none font-bold text-xs rounded-xl h-8.5"
              >
                Nạp Nhanh +120 Credit
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button onClick={() => setStep('select')} className="rounded-xl text-xs font-semibold h-10 px-4">
              Quay lại xem thẻ
            </Button>
            <Button
              type="primary"
              onClick={handleStartAudit}
              disabled={isProcessing || !isBalanceSufficient}
              className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-6 border-none shadow-sm"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác Nhận & Bắt Đầu Rà Soát Ngay'}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BƯỚC 3: QUÁ TRÌNH QUÉT & ĐỐI CHIẾU DỮ LIỆU */}
      {/* ========================================================= */}
      {step === 'scanning' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800 m-0">
              Đang Đối Chiếu Ma Trận Pháp Lý & Thuế
            </h3>
            <p className="text-xs text-slate-500 m-0 max-w-sm mx-auto leading-relaxed">
              {scanStageText}
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-linear-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-teal-700 block">{scanProgress}%</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* BƯỚC 4: KẾT QUẢ RÀ SOÁT & XUẤT CHECKLIST */}
      {/* ========================================================= */}
      {step === 'results' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                  <Check className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-800 m-0">
                  Hoàn Tất Rà Soát: Phát Hiện {auditFindings.length} Nghĩa Vụ Cần Tuân Thủ
                </h3>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5 pl-8">
                Hệ thống đã tự động phân tích căn cứ pháp lý, tính toán mức phạt rủi ro và sẵn sàng sinh Checklist nhiệm vụ.
              </p>
            </div>

            <Button
              type="primary"
              onClick={handleCreateAllChecklists}
              loading={isCreatingAll}
              className="bg-teal-600 hover:bg-teal-700 font-extrabold text-xs rounded-xl h-10 px-5 border-none shadow-sm"
            >
              Sinh Toàn Bộ ({auditFindings.length}) Checklist Tuân Thủ
            </Button>
          </div>

          <div className="space-y-4">
            {auditFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag color="cyan" className="font-bold text-[10px] m-0 uppercase">
                        {finding.ruleCode}
                      </Tag>
                      <Tag color="red" className="font-extrabold text-[10px] m-0 uppercase">
                        {finding.suggestedPriority || 'HIGH'}
                      </Tag>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 m-0">
                      {finding.obligationTitle}
                    </h4>
                  </div>

                  <Button
                    size="small"
                    type="default"
                    icon={<PlusCircle className="w-3.5 h-3.5 inline mr-1" />}
                    onClick={() => handleCreateSingleChecklist(finding)}
                    loading={creatingSingleId === finding.id}
                    className="rounded-lg text-xs font-semibold"
                  >
                    Tạo Checklist Này
                  </Button>
                </div>

                {/* CĂN CỨ PHÁP LÝ & RỦI RO PHẠT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Căn Cứ Pháp Luật</span>
                    <p className="text-slate-700 m-0 font-medium">{finding.legalBasis}</p>
                    {finding.legalDocUrl && (
                      <a
                        href={matchCoreLegalDocUrl(finding.ruleCode) || cleanDLPLUrl(finding.legalDocUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 hover:underline inline-flex items-center gap-1 text-[11px] font-bold mt-1"
                      >
                        Tra cứu văn bản gốc <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Chế Tài & Rủi Ro Xử Phạt</span>
                    <p className="text-amber-900 m-0 font-medium">{finding.penaltyRisk}</p>
                  </div>
                </div>

                {/* MINH CHỨNG YÊU CẦU */}
                {finding.evidenceRequired && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="font-bold text-slate-700 shrink-0">Hồ sơ chứng minh bắt buộc:</span>
                    <span>{finding.evidenceRequired}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button onClick={() => setStep('select')} className="rounded-xl text-xs font-semibold h-9">
              Rà Soát Lượt Khác
            </Button>

            <Button
              type="primary"
              onClick={() => navigate('/tasks')}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl h-9 px-5 border-none"
            >
              Mở Trang Quản Lý Tasks & Calendar <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: XÁC NHẬN NẠP FILE EXCEL & CHẶN TRÙNG LẶP */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <FileExcelOutlined className="text-emerald-600 text-lg" />
            <span>Xác Nhận Nạp Dữ Liệu Từ File Excel</span>
          </div>
        }
        open={isImportConfirmModalOpen}
        onCancel={() => {
          setIsImportConfirmModalOpen(false);
          setPendingImportData(null);
          setDuplicateRows(null);
        }}
        footer={null}
        width={620}
        centered
        className="rounded-2xl"
      >
        {pendingImportData && (
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tệp tin đã chọn:</span>
                <span className="font-bold text-slate-800 font-mono">{pendingImportData.fileName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Dữ liệu bóc tách được:</span>
                <span className="font-bold text-teal-800">
                  {pendingImportData.revenues.length} khoản thu ({pendingImportData.totalRawRevenue.toLocaleString('vi-VN')} đ)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chi phí kế toán:</span>
                <span className="font-bold text-amber-800">
                  {pendingImportData.expenses.length} khoản chi ({pendingImportData.totalRawExpense.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            {/* CẢNH BÁO NẾU PHÁT HIỆN DÒNG TRÙNG LẶP (CHẶN HOÀN TOÀN IMPORT NỐI TIẾP) */}
            {duplicateRows && (
              <Alert
                type="error"
                showIcon
                className="rounded-xl border border-rose-300 bg-rose-50 text-rose-900"
                message={
                  <span className="font-black text-xs">
                    🚫 ĐÃ CHẶN IMPORT: Phát hiện {duplicateRows.revenues.length + duplicateRows.expenses.length} dòng dữ liệu bị trùng lặp!
                  </span>
                }
                description={
                  <div className="space-y-2 text-[11px] mt-1">
                    <p className="m-0 leading-relaxed">
                      Để đảm bảo tính chính xác và không bị tính trùng chi phí hoặc doanh thu khi kê khai thuế, hệ thống <strong>chặn hoàn toàn việc import nối tiếp</strong> khi có bản ghi trùng với bảng hiện tại.
                    </p>
                    {duplicateRows.revenues.length > 0 && (
                      <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block">Khoản thu bị trùng ({duplicateRows.revenues.length}):</span>
                        <ul className="list-disc list-inside m-0 pl-1 text-[10px] space-y-0.5">
                          {duplicateRows.revenues.slice(0, 3).map((r, i) => (
                            <li key={i}>{r.date} - {r.description || r.invoiceNo} - {r.amount.toLocaleString('vi-VN')} đ</li>
                          ))}
                          {duplicateRows.revenues.length > 3 && <li>...và {duplicateRows.revenues.length - 3} dòng khác</li>}
                        </ul>
                      </div>
                    )}
                    {duplicateRows.expenses.length > 0 && (
                      <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block">Khoản chi bị trùng ({duplicateRows.expenses.length}):</span>
                        <ul className="list-disc list-inside m-0 pl-1 text-[10px] space-y-0.5">
                          {duplicateRows.expenses.slice(0, 3).map((e, i) => (
                            <li key={i}>{e.date} - {e.category} - {e.amount.toLocaleString('vi-VN')} đ</li>
                          ))}
                          {duplicateRows.expenses.length > 3 && <li>...và {duplicateRows.expenses.length - 3} dòng khác</li>}
                        </ul>
                      </div>
                    )}
                    <p className="m-0 text-slate-600 italic">
                      * Giải pháp: Hãy chọn <strong>"Xóa dữ liệu cũ & Ghi đè"</strong> để nạp mới toàn bộ, hoặc mở file Excel lọc bỏ các dòng trên rồi nạp lại.
                    </p>
                  </div>
                }
              />
            )}

            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold block">Bạn muốn xử lý dữ liệu hiện có trên bảng như thế nào?</span>
              <p className="m-0 text-[11px] text-slate-600">
                • <strong>Xóa dữ liệu cũ & Ghi đè:</strong> Xóa toàn bộ số liệu hiện tại trên bảng và nạp 100% từ file Excel mới.
                <br />
                • <strong>Giữ dữ liệu cũ & Nối thêm mới:</strong> Kiểm tra nghiêm ngặt trùng lặp; nếu có bất kỳ dòng nào bị trùng sẽ bị chặn ngay lập tức.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                onClick={() => {
                  setIsImportConfirmModalOpen(false);
                  setPendingImportData(null);
                  setDuplicateRows(null);
                }}
                className="rounded-xl text-xs font-semibold h-10 px-4 w-full sm:w-auto"
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleConfirmOverwrite}
                className="rounded-xl text-xs font-bold h-10 px-4 w-full sm:w-auto shadow-xs"
              >
                Xóa dữ liệu cũ & Ghi đè toàn bộ
              </Button>
              <Button
                type="primary"
                onClick={handleConfirmAppend}
                className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-5 w-full sm:w-auto border-none shadow-xs"
              >
                Giữ dữ liệu cũ & Nối thêm mới
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: THÊM / SỬA KHOẢN THU (DOANH THU) */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <DollarSign className="w-5 h-5 text-teal-600" />
            <span>{editingRevenueIndex !== null ? 'Chỉnh Sửa Khoản Thu Doanh Thu' : 'Thêm Mới Khoản Thu Doanh Thu'}</span>
          </div>
        }
        open={isRevenueModalOpen}
        onCancel={() => setIsRevenueModalOpen(false)}
        onOk={handleSaveRevenue}
        okText={editingRevenueIndex !== null ? 'Cập nhật' : 'Thêm vào bảng'}
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-teal-600 hover:bg-teal-700 border-none font-bold rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl font-semibold' }}
        centered
        width={500}
      >
        <Form form={revenueForm} layout="vertical" className="pt-3 space-y-1">
          <Form.Item
            name="date"
            label={<span className="text-xs font-bold text-slate-700">Ngày ghi nhận (DD/MM/YYYY)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập ngày ghi nhận' }]}
          >
            <Input placeholder="Ví dụ: 15/03/2025" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="invoiceNo"
            label={<span className="text-xs font-bold text-slate-700">Số hóa đơn (Nếu có)</span>}
          >
            <Input placeholder="Ví dụ: HD000128" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-bold text-slate-700">Diễn giải / Khách hàng</span>}
            rules={[{ required: true, message: 'Vui lòng nhập diễn giải khách hàng hoặc dịch vụ' }]}
          >
            <Input.TextArea rows={2} placeholder="Ví dụ: Cung cấp dịch vụ giải pháp chuyển đổi số cho Cty An Bình" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="amount"
            label={<span className="text-xs font-bold text-slate-700">Doanh thu chưa thuế (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập số tiền doanh thu' }]}
          >
            <InputNumber
              className="w-full rounded-xl"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
              min={1000 as number}
              step={1000000}
              placeholder="Nhập số tiền VNĐ"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: THÊM / SỬA KHOẢN CHI PHÍ & CẢNH BÁO RỦI RO THỜI GIAN THỰC */}
      {/* ========================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>{editingExpenseIndex !== null ? 'Chỉnh Sửa Khoản Chi Phí Kế Toán' : 'Thêm Mới Khoản Chi Phí Kế Toán'}</span>
          </div>
        }
        open={isExpenseModalOpen}
        onCancel={() => setIsExpenseModalOpen(false)}
        onOk={handleSaveExpense}
        okText={editingExpenseIndex !== null ? 'Cập nhật' : 'Thêm vào bảng'}
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-amber-600 hover:bg-amber-700 border-none font-bold rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl font-semibold' }}
        centered
        width={560}
      >
        <Form form={expenseForm} layout="vertical" className="pt-3 space-y-1">
          <Form.Item
            name="date"
            label={<span className="text-xs font-bold text-slate-700">Ngày chi (DD/MM/YYYY)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập ngày chi' }]}
          >
            <Input placeholder="Ví dụ: 20/03/2025" className="rounded-xl" />
          </Form.Item>

          <Form.Item
            name="category"
            label={<span className="text-xs font-bold text-slate-700">Khoản mục chi phí</span>}
            rules={[{ required: true, message: 'Vui lòng nhập khoản mục chi' }]}
          >
            <Input placeholder="Ví dụ: Mua máy tính văn phòng, Tiền thuê nhà, Chi phí quảng cáo..." className="rounded-xl" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="paymentMethod"
              label={<span className="text-xs font-bold text-slate-700">Hình thức thanh toán</span>}
              rules={[{ required: true, message: 'Chọn hình thức thanh toán' }]}
            >
              <Radio.Group buttonStyle="solid" className="w-full flex">
                <Radio.Button value="Chuyển khoản" className="w-1/2 text-center text-xs font-semibold">Chuyển khoản</Radio.Button>
                <Radio.Button value="Tiền mặt" className="w-1/2 text-center text-xs font-semibold">Tiền mặt</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="hasInvoice"
              label={<span className="text-xs font-bold text-slate-700">Có hóa đơn GTGT / hợp pháp?</span>}
              rules={[{ required: true, message: 'Chọn trạng thái hóa đơn' }]}
            >
              <Radio.Group buttonStyle="solid" className="w-full flex">
                <Radio.Button value="Có" className="w-1/2 text-center text-xs font-semibold">Có hóa đơn</Radio.Button>
                <Radio.Button value="Không" className="w-1/2 text-center text-xs font-semibold">Không có</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>

          <Form.Item
            name="amount"
            label={<span className="text-xs font-bold text-slate-700">Số tiền chi phí (VNĐ)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập số tiền chi' }]}
          >
            <InputNumber
              className="w-full rounded-xl"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
              min={1000 as number}
              step={1000000}
              placeholder="Nhập số tiền VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="note"
            label={<span className="text-xs font-bold text-slate-700">Ghi chú kèm theo (Nếu có)</span>}
          >
            <Input placeholder="Ví dụ: Mua tại Thế Giới Di Động, có ủy nhiệm chi ngân hàng..." className="rounded-xl" />
          </Form.Item>

          {/* ⚠️ CẢNH BÁO VI PHẠM TỨC THÌ TRONG MODAL */}
          {expPaymentMethodWatch === 'Tiền mặt' && (expAmountWatch || 0) >= 20000000 && (
            <Alert
              type="error"
              showIcon
              className="rounded-xl border border-rose-300 bg-rose-50/90 text-rose-900 mt-2"
              message={<span className="font-black text-xs">⚠️ CẢNH BÁO VI PHẠM MỤC B4 (Điều 4 Thông tư 96/2015/TT-BTC)</span>}
              description={
                <p className="text-[11px] leading-relaxed m-0 mt-0.5">
                  Hóa đơn từng lần từ <strong>20.000.000 VNĐ</strong> trở lên bắt buộc phải thanh toán không dùng tiền mặt qua tài khoản ngân hàng của doanh nghiệp. Nếu thanh toán bằng tiền mặt, toàn bộ khoản chi này sẽ <strong>BỊ LOẠI KHỎI CHI PHÍ ĐƯỢC TRỪ</strong> (kê vào Mục B4 trên tờ khai 03/TNDN) và làm phát sinh thêm 20% tiền thuế!
                </p>
              }
            />
          )}

          {expHasInvoiceWatch === 'Không' && (
            <Alert
              type="warning"
              showIcon
              className="rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 mt-2"
              message={<span className="font-black text-xs">⚠️ RỦI RO KHÔNG CÓ HÓA ĐƠN HỢP PHÁP</span>}
              description={
                <p className="text-[11px] leading-relaxed m-0 mt-0.5">
                  Chi phí mua hàng hóa dịch vụ không có hóa đơn GTGT/hóa đơn bán hàng theo quy định sẽ bị cơ quan thuế loại toàn bộ khi thanh tra quyết toán thuế.
                </p>
              }
            />
          )}
        </Form>
      </Modal>

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
