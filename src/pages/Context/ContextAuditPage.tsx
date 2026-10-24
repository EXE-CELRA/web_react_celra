import dayjs from 'dayjs';
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useOrgStore } from '../../store/useOrgStore';
import apiClient from '../../api/client';
import { message, Upload, Button, Tag, Select, Modal, Form, Input, InputNumber, Radio, Popconfirm, Alert, Table, Tabs, DatePicker } from 'antd';
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
import {
  downloadCitExcelTemplate,
  downloadRevenueExcelTemplate,
  downloadExpenseExcelTemplate,
  parseCitExcelFile,
  parseRevenueExcelOnly,
  parseExpenseExcelOnly,
  parseRowQuarterYear,
  type ParsedCitData,
  type RevenueRow,
  type ExpenseRow,
} from '../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone } from '../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult } from '../../utils/citTaxCalculator';
import { EtaxPaymentGuideModal } from '../../components/tax/EtaxPaymentGuideModal';
import { ModuleSurveyModal } from '../../components/survey/ModuleSurveyModal';
import { isGroupSurveyCompleted } from '../../data/questionSurvey';
import type { ContextFact, AuditFindingItem } from '../../interfaces';

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

// Cấu trúc dữ liệu sổ thu chi lưu trữ theo từng Kỳ (Phương án A)
export interface PeriodFinancialData {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
}

export type PeriodStore = Record<string, PeriodFinancialData>;

// Khởi tạo ban đầu trống 100% cho Phân hệ Thuế TNDN (Zero-data canvas)
export const DEFAULT_REVENUE_ROWS: RevenueRow[] = [];
export const DEFAULT_EXPENSE_ROWS: ExpenseRow[] = [];

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

  // 🏢 DỮ LIỆU DOANH NGHIỆP & SỔ THU CHI THUẾ TNDN (PHÂN BỔ THEO KỲ PHƯƠNG ÁN A)
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentQuarter = useMemo(() => Math.floor(new Date().getMonth() / 3) + 1, []);
  const [taxQuarter, setTaxQuarter] = useState<number | 'ALL'>(currentQuarter);
  const [taxYear, setTaxYear] = useState<number>(currentYear);
  const [periodStore, setPeriodStore] = useState<PeriodStore>({});
  const [hasLoadedDbRecords, setHasLoadedDbRecords] = useState<boolean>(false);
  const [citCalcResult, setCitCalcResult] = useState<CitCalculationResult | null>(null);
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showEtaxModal, setShowEtaxModal] = useState(false);

  // 📑 TÁCH TAB SỔ THU CHI & QUẢN LÝ DỮ LIỆU SERVER-SIDE
  const [financialTab, setFinancialTab] = useState<'revenue' | 'expense'>('revenue');

  // KPI TỔNG HỢP TOÀN KỲ TÍNH TỪ BACKEND NESTJS / POSTGRESQL (GRAND TOTAL)
  const [citSummary, setCitSummary] = useState({
    totalRevenue: 0,
    revenueCount: 0,
    totalAccountingExpense: 0,
    expenseCount: 0,
    totalDisallowedExpense: 0,
    disallowedCount: 0,
    totalDeductibleExpense: 0,
    assessableIncome: 0,
    taxRate: 0.20,
    estimatedTaxAmount: 0,
    statutoryPrepayment80: 0,
    accountingProfitBeforeTax: 0,
    netProfitAfterTax: 0,
  });

  // PHÂN TRANG, TÌM KIẾM BẢNG DOANH THU (SERVER-SIDE)
  const [revenuesData, setRevenuesData] = useState<any[]>([]);
  const [revenuesTotal, setRevenuesTotal] = useState<number>(0);
  const [revenuePage, setRevenuePage] = useState<number>(1);
  const [revenueLimit, setRevenueLimit] = useState<number>(20);
  const [revenueSearch, setRevenueSearch] = useState<string>('');
  const [isRevenueLoading, setIsRevenueLoading] = useState<boolean>(false);
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);

  // PHÂN TRANG, TÌM KIẾM & BỘ LỌC B4 BẢNG CHI PHÍ (SERVER-SIDE)
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [expensesTotal, setExpensesTotal] = useState<number>(0);
  const [expensePage, setExpensePage] = useState<number>(1);
  const [expenseLimit, setExpenseLimit] = useState<number>(20);
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseFilterB4, setExpenseFilterB4] = useState<'ALL' | 'DISALLOWED' | 'DEDUCTIBLE'>('ALL');
  const [isExpenseLoading, setIsExpenseLoading] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // API 1: TẢI KPI TỔNG HỢP TỪ BACKEND (XỬ LÝ UNWRAP TỰ ĐỘNG CỦA APICLIENT)
  const fetchCitSummary = useCallback(async () => {
    try {
      const res: any = await apiClient.get('/cit-ledger/summary', {
        params: { year: taxYear, quarter: taxQuarter },
      });
      const summary = res?.data !== undefined && !res.totalRevenue ? res.data : res;
      if (summary) {
        setCitSummary(summary);
      }
    } catch (err) {
      console.warn('Lỗi tải KPI tổng hợp CIT:', err);
    }
  }, [taxYear, taxQuarter]);

  // API 2: TẢI DANH SÁCH DOANH THU PHÂN TRANG & TÌM KIẾM
  const fetchRevenues = useCallback(async () => {
    setIsRevenueLoading(true);
    try {
      const res: any = await apiClient.get('/cit-ledger/revenues', {
        params: {
          year: taxYear,
          quarter: taxQuarter,
          page: revenuePage,
          limit: revenueLimit,
          search: revenueSearch,
        },
      });
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []));
      const total = typeof res?.total === 'number' ? res.total : (typeof res?.data?.total === 'number' ? res.data.total : list.length);
      setRevenuesData(list);
      setRevenuesTotal(total);
    } catch (err) {
      console.warn('Lỗi tải doanh thu:', err);
    } finally {
      setIsRevenueLoading(false);
    }
  }, [taxYear, taxQuarter, revenuePage, revenueLimit, revenueSearch]);

  // API 3: TẢI DANH SÁCH CHI PHÍ PHÂN TRANG, TÌM KIẾM & LỌC B4
  const fetchExpenses = useCallback(async () => {
    setIsExpenseLoading(true);
    try {
      const res: any = await apiClient.get('/cit-ledger/expenses', {
        params: {
          year: taxYear,
          quarter: taxQuarter,
          page: expensePage,
          limit: expenseLimit,
          search: expenseSearch,
          filterB4: expenseFilterB4,
        },
      });
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []));
      const total = typeof res?.total === 'number' ? res.total : (typeof res?.data?.total === 'number' ? res.data.total : list.length);
      setExpensesData(list);
      setExpensesTotal(total);
    } catch (err) {
      console.warn('Lỗi tải chi phí:', err);
    } finally {
      setIsExpenseLoading(false);
    }
  }, [taxYear, taxQuarter, expensePage, expenseLimit, expenseSearch, expenseFilterB4]);

  // TỰ ĐỘNG GỌI API KHI ĐỔI KỲ (QUÝ / NĂM)
  useEffect(() => {
    fetchCitSummary();
    fetchRevenues();
    fetchExpenses();
  }, [fetchCitSummary, fetchRevenues, fetchExpenses]);

  // 📥 NẠP FILE EXCEL DOANH THU RIÊNG (TAB DOANH THU)
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
      message.success(`Nạp thành công ${rows.length} khoản doanh thu vào Quý ${taxQuarter}/${taxYear}!`);
      fetchCitSummary();
      fetchRevenues();
    } catch (err: any) {
      const errMsg = err.message || (err.response?.data?.message) || 'Dữ liệu của bạn còn thiếu không thể import';
      Modal.error({
        title: 'Không thể Import Excel Doanh thu',
        content: (
          <div className="whitespace-pre-line text-sm text-slate-700 font-sans leading-relaxed pt-2">
            {errMsg}
          </div>
        ),
        okText: 'Đã hiểu',
        width: 520,
      });
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  // 📥 NẠP FILE EXCEL CHI PHÍ RIÊNG (TAB CHI PHÍ)
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
      message.success(`Nạp thành công ${rows.length} khoản chi phí vào Quý ${taxQuarter}/${taxYear}!`);
      fetchCitSummary();
      fetchExpenses();
    } catch (err: any) {
      const errMsg = err.message || (err.response?.data?.message) || 'Dữ liệu của bạn còn thiếu không thể import';
      Modal.error({
        title: 'Không thể Import Excel Chi phí',
        content: (
          <div className="whitespace-pre-line text-sm text-slate-700 font-sans leading-relaxed pt-2">
            {errMsg}
          </div>
        ),
        okText: 'Đã hiểu',
        width: 520,
      });
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  // CỘT BẢNG DOANH THU (ANT DESIGN TABLE)
  const revenueColumns = [
    {
      title: '#',
      key: 'index',
      width: 55,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-slate-400 font-semibold text-xs">
          {(revenuePage - 1) * revenueLimit + index + 1}
        </span>
      ),
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val: string) => <span className="text-slate-700 font-medium text-xs whitespace-nowrap">{val}</span>,
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 120,
      render: (val: string) =>
        val ? (
          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {val}
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">-</span>
        ),
    },
    {
      title: 'Diễn giải / Khách hàng',
      dataIndex: 'description',
      key: 'description',
      render: (val: string) => <span className="text-slate-800 font-medium text-xs">{val}</span>,
    },
    {
      title: 'Doanh thu chưa thuế (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      align: 'right' as const,
      render: (val: number) => (
        <span className="font-mono font-bold text-teal-700 whitespace-nowrap text-xs">
          {Number(val || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => handleOpenEditRevenue(record)}
            disabled={taxQuarter === 'ALL'}
            className="hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
            title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để sửa' : 'Sửa khoản thu'}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa khoản thu này không?"
            onConfirm={() => handleDeleteRevenue(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={taxQuarter === 'ALL'}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              disabled={taxQuarter === 'ALL'}
              className="hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
              title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để xóa' : 'Xóa khoản thu'}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // CỘT BẢNG CHI PHÍ & RÀ SOÁT MỤC B4 (ANT DESIGN TABLE)
  const expenseColumns = [
    {
      title: '#',
      key: 'index',
      width: 55,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span className="font-mono text-slate-400 font-semibold text-xs">
          {(expensePage - 1) * expenseLimit + index + 1}
        </span>
      ),
    },
    {
      title: 'Ngày chi',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (val: string) => <span className="text-slate-700 font-medium text-xs whitespace-nowrap">{val}</span>,
    },
    {
      title: 'Khoản mục chi',
      dataIndex: 'category',
      key: 'category',
      minWidth: 180,
      render: (val: string, record: any) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{val}</span>
          {record.note && <span className="text-[11px] text-slate-400 italic block mt-0.5">{record.note}</span>}
        </div>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 110,
      align: 'center' as const,
      render: (val: string) => {
        const isCash = (val || '').toLowerCase().includes('tiền mặt') || (val || '').toLowerCase().includes('cash');
        return isCash ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Tiền mặt
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Chuyển khoản
          </span>
        );
      },
    },
    {
      title: 'Hóa đơn',
      dataIndex: 'hasInvoice',
      key: 'hasInvoice',
      width: 95,
      align: 'center' as const,
      render: (val: string) => {
        const hasInv = (val || '').toLowerCase().includes('có') || (val || '').toLowerCase().includes('yes');
        return hasInv ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Có HĐ
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            Không HĐ
          </span>
        );
      },
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <span className={`font-mono font-bold whitespace-nowrap text-xs ${record.isDisallowedB4 ? 'text-rose-700' : 'text-slate-800'}`}>
          {Number(val || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Đánh giá tính hợp lý (Mục B4)',
      key: 'b4Evaluation',
      minWidth: 220,
      render: (_: any, record: any) =>
        record.isDisallowedB4 ? (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
              <WarningOutlined /> BỊ LOẠI (MỤC B4)
            </span>
            <p className="text-[11px] text-rose-700 m-0 font-bold leading-snug">
              {record.disallowedReason || 'Chi phí bị loại trừ theo luật thuế.'}
            </p>
            {record.legalBasis && (
              <p className="text-[10px] text-rose-600/80 italic m-0">
                Căn cứ: {record.legalBasis}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Được trừ hợp lý
          </span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => handleOpenEditExpense(record)}
            disabled={taxQuarter === 'ALL'}
            className="hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
            title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để sửa' : 'Sửa khoản chi'}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa khoản chi này không?"
            onConfirm={() => handleDeleteExpense(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={taxQuarter === 'ALL'}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              disabled={taxQuarter === 'ALL'}
              className="hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
              title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để xóa' : 'Xóa khoản chi'}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Trích xuất doanh thu & chi phí hiện hành dựa trên Quý/Năm đang chọn
  // Nếu là 'ALL' (Cả năm): Tự động gộp dữ liệu từ 4 Quý (Q1 + Q2 + Q3 + Q4) của năm đó theo chuẩn kế toán
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
          // Định dạng theo Period Key Map mới: { periods: { "2026_Q1": ... } }
          if (parsed.periods && typeof parsed.periods === 'object') {
            setPeriodStore(parsed.periods);
            if (parsed.lastQuarter !== undefined) setTaxQuarter(parsed.lastQuarter);
            if (parsed.lastYear) setTaxYear(parsed.lastYear);
            setHasLoadedDbRecords(true);
            return;
          }
          // Tương thích ngược: dữ liệu cũ dạng phẳng { revenues: [...], expenses: [...] }
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
      // Nếu chưa có fact trong Database, khởi tạo rỗng (Zero demo data)
      if (!hasLoadedDbRecords) {
        setPeriodStore({});
        setHasLoadedDbRecords(true);
      }
    }
  }, [facts, isLoading, hasLoadedDbRecords, currentQuarter, currentYear]);

  // 2. LƯU DỮ LIỆU VÀO DATABASE (POSTGRESQL QUA NESTJS API)
  const saveRecordsToDb = async (
    newStore: PeriodStore,
    quarter: number | 'ALL' = taxQuarter,
    year: number = taxYear,
    quiet = false
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
    } catch (err: any) {
      console.error('Lỗi khi lưu dữ liệu lên máy chủ:', err);
      message.error('Không thể đồng bộ dữ liệu với máy chủ.');
    }
  };

  // Helper cập nhật dữ liệu Quý hiện hành an toàn
  const updateCurrentQuarterRecords = async (
    updater: (prev: PeriodFinancialData) => PeriodFinancialData,
    successMsg?: string
  ) => {
    if (taxQuarter === 'ALL') {
      message.warning('Kỳ Cả năm là chế độ tổng hợp số liệu từ 4 Quý. Vui lòng chuyển sang Quý tương ứng để chỉnh sửa giao dịch!');
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

  // 3. TÍNH TOÁN LẠI NGHĨA VỤ THUẾ & LỢI NHUẬN RÒNG SAU THUẾ TỨC THÌ MỖI KHI DỮ LIỆU ĐỔI
  useEffect(() => {
    const res = calculateCitTax(revenues, expenses, incentiveInfo, orgModel);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCitCalcResult(res);
  }, [revenues, expenses, incentiveInfo, orgModel]);

  // Thay đổi Quý / Năm
  const handleQuarterChange = (val: number | 'ALL') => {
    setTaxQuarter(val);
    saveRecordsToDb(periodStore, val, taxYear, true);
  };

  const handleYearChange = (val: number) => {
    setTaxYear(val);
    saveRecordsToDb(periodStore, taxQuarter, val, true);
  };

  // 4. IMPORT EXCEL & QUY TRÌNH CONFIRM CHỐNG TRÙNG LẶP + CHẶN NGHIÊM NGẶT NGÀY THÁNG
  const handleExcelUpload = async (file: File) => {
    if (taxQuarter === 'ALL') {
      message.warning('Kỳ Cả năm là chế độ tổng hợp tự động từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 trước khi nạp file Excel!');
      return false;
    }
    setIsExcelUploading(true);
    try {
      const parsed = await parseCitExcelFile(file);

      // 🔍 KIỂM TRA NGHIÊM NGẶT NGÀY THÁNG ĐỐI VỚI QUÝ ĐANG CHỌN (STRICT DATE FILTER)
      const invalidRows: { type: 'revenue' | 'expense'; date: string; index: number; reason: string }[] = [];

      parsed.revenues.forEach((r, idx) => {
        const parsedDate = parseRowQuarterYear(r.date);
        if (!parsedDate) {
          invalidRows.push({ type: 'revenue', date: r.date, index: idx + 1, reason: 'Định dạng ngày không hợp lệ' });
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
          invalidRows.push({ type: 'expense', date: e.date, index: idx + 1, reason: 'Định dạng ngày không hợp lệ' });
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
          content: (
            <div className="space-y-2 text-xs">
              <p className="text-rose-600 font-bold m-0">
                Phát hiện {invalidRows.length} dòng dữ liệu không thuộc Quý {taxQuarter} / Năm {taxYear}.
              </p>
              <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                Ví dụ tại bảng <strong>{tableType}</strong>, dòng <strong>#{firstErr.index}</strong>: ngày <strong>"{firstErr.date}"</strong> ({firstErr.reason}).
              </div>
              <p className="text-slate-600 m-0 leading-relaxed">
                Theo nguyên tắc kế toán thuế, mỗi Quý chỉ ghi nhận các nghiệp vụ kinh tế phát sinh trong Quý đó. Vui lòng chuyển sang đúng Quý hoặc điều chỉnh ngày tháng trong file Excel trước khi nạp lại!
              </p>
            </div>
          ),
          okText: 'Đã hiểu',
        });
        return false;
      }

      const res = calculateCitTax(parsed.revenues, parsed.expenses, incentiveInfo, orgModel);

      // 📥 TỰ ĐỘNG LƯU FILE VÀO KHO HỒ SƠ & BẰNG CHỨNG
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', `Bảng kê Doanh thu & Chi phí (Quý ${taxQuarter}/${taxYear})`);
        formData.append('category', 'Thuế Doanh Nghiệp');
        formData.append('tag', 'Bảng kê thu - chi');
        formData.append('quarter', String(taxQuarter));
        formData.append('year', String(taxYear));
        formData.append('metadata', JSON.stringify({
          quarter: taxQuarter,
          year: taxYear,
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

  // Lựa chọn 1: Xóa dữ liệu cũ & Ghi đè toàn bộ Quý hiện tại
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
    await saveRecordsToDb(newStore, taxQuarter, taxYear, true);
    message.success(`Đã xóa dữ liệu cũ Quý ${taxQuarter}/${taxYear} và nạp mới toàn bộ (${pendingImportData.revenues.length} khoản thu, ${pendingImportData.expenses.length} khoản chi)!`);
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  // Lựa chọn 2: Giữ dữ liệu cũ & Nối thêm mới vào Quý hiện tại (Kiểm tra trùng lặp)
  const handleConfirmAppend = async () => {
    if (!pendingImportData || taxQuarter === 'ALL') return;
    const periodKey = `${taxYear}_Q${taxQuarter}`;
    const currentPeriod = periodStore[periodKey] || { revenues: [], expenses: [] };
    const curRevenues = currentPeriod.revenues || [];
    const curExpenses = currentPeriod.expenses || [];

    // Kiểm tra trùng lặp Doanh thu (Trùng Ngày + Số HĐ + Số tiền, hoặc Trùng Ngày + Diễn giải + Số tiền)
    const dupRevenues = pendingImportData.revenues.filter((newRev) =>
      curRevenues.some(
        (cur) =>
          cur.date.trim() === newRev.date.trim() &&
          ((cur.invoiceNo && newRev.invoiceNo && cur.invoiceNo.trim().toLowerCase() === newRev.invoiceNo.trim().toLowerCase()) ||
            cur.description.trim().toLowerCase() === newRev.description.trim().toLowerCase()) &&
          Number(cur.amount) === Number(newRev.amount)
      )
    );

    // Kiểm tra trùng lặp Chi phí (Trùng Ngày + Khoản mục + Số tiền)
    const dupExpenses = pendingImportData.expenses.filter((newExp) =>
      curExpenses.some(
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
        `Phát hiện ${totalDuplicates} dòng dữ liệu bị trùng lặp với Quý ${taxQuarter}/${taxYear}! Hệ thống đã chặn nạp dữ liệu. Vui lòng chọn "Xóa dữ liệu cũ & Ghi đè" hoặc làm sạch file Excel!`
      );
      return;
    }

    // Nếu không có trùng lặp, tiến hành nối thêm
    const mergedRevenues = [...curRevenues, ...pendingImportData.revenues];
    const mergedExpenses = [...curExpenses, ...pendingImportData.expenses];

    const newStore: PeriodStore = {
      ...periodStore,
      [periodKey]: {
        revenues: mergedRevenues,
        expenses: mergedExpenses,
      },
    };
    setPeriodStore(newStore);
    setIsImportConfirmModalOpen(false);
    await saveRecordsToDb(newStore, taxQuarter, taxYear, true);
    message.success(`Đã nối thêm ${pendingImportData.revenues.length} khoản thu và ${pendingImportData.expenses.length} khoản chi vào Quý ${taxQuarter}/${taxYear} thành công!`);
    setPendingImportData(null);
    setDuplicateRows(null);
  };

  // 5. THAO TÁC THÊM / SỬA / XÓA THỦ CÔNG DOANH THU
  const handleOpenAddRevenue = () => {
    if (taxQuarter === 'ALL') {
      message.warning('Số liệu Cả năm được tự động tổng hợp từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 để thêm khoản thu!');
      return;
    }
    revenueForm.resetFields();
    revenueForm.setFieldsValue({
      date: dayjs(),
      amount: 10000000,
    });
    setEditingRevenueId(null);
    setIsRevenueModalOpen(true);
  };

  const handleOpenEditRevenue = (record: any) => {
    if (taxQuarter === 'ALL') {
      message.warning('Số liệu Cả năm là chế độ xem tổng hợp. Vui lòng chuyển về đúng Quý phát sinh để chỉnh sửa!');
      return;
    }
    setEditingRevenueId(record.id);
    const parsedDate = record.date ? (dayjs(record.date, 'DD/MM/YYYY').isValid() ? dayjs(record.date, 'DD/MM/YYYY') : dayjs(record.date)) : dayjs();
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
      const dateStr = values.date ? (typeof values.date.format === 'function' ? values.date.format('DD/MM/YYYY') : String(values.date)) : dayjs().format('DD/MM/YYYY');
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
    } catch (err) {
      message.error('Lỗi xóa khoản thu');
    }
  };

  // 6. THAO TÁC THÊM / SỬA / XÓA THỦ CÔNG CHI PHÍ
  const handleOpenAddExpense = () => {
    if (taxQuarter === 'ALL') {
      message.warning('Số liệu Cả năm được tự động tổng hợp từ 4 Quý. Vui lòng chọn Quý 1, 2, 3 hoặc 4 để thêm khoản chi!');
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

  const handleOpenEditExpense = (record: any) => {
    if (taxQuarter === 'ALL') {
      message.warning('Số liệu Cả năm là chế độ xem tổng hợp. Vui lòng chuyển về đúng Quý phát sinh để chỉnh sửa!');
      return;
    }
    setEditingExpenseId(record.id);
    const parsedDate = record.date ? (dayjs(record.date, 'DD/MM/YYYY').isValid() ? dayjs(record.date, 'DD/MM/YYYY') : dayjs(record.date)) : dayjs();
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
      const dateStr = values.date ? (typeof values.date.format === 'function' ? values.date.format('DD/MM/YYYY') : String(values.date)) : dayjs().format('DD/MM/YYYY');
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
    } catch (err) {
      message.error('Lỗi xóa khoản chi');
    }
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

  // Bảo lưu các helper cũ theo nguyên tắc bảo toàn mã nguồn
  void [downloadCitExcelTemplate, editingRevenueIndex, setEditingRevenueIndex, editingExpenseIndex, setEditingExpenseIndex, updateCurrentQuarterRecords, handleExcelUpload, ShieldCheck];

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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
              {/* HEADER PHÂN HỆ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20 mt-0.5">
                    <FileExcelOutlined className="text-xl" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
                      Sổ Kê Khai Thu Chi, Rà Soát Xuất Toán (Mục B4) & Lợi Nhuận Ròng Thuế TNDN
                    </h4>
                    <p className="text-xs text-slate-500 m-0">
                      Tự động tính thuế TNDN, rà soát chi phí không hợp lệ theo Thông tư 96/2015/TT-BTC và tính lợi nhuận ròng sau thuế theo thời gian thực.
                    </p>
                  </div>
                </div>

                {/* VÙNG ƯU ĐÃI THUẾ THEO ĐỊA CHỈ */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 shrink-0 flex items-center gap-2.5 shadow-2xs">
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
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-teal-600 text-base" />
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

                  {/* NÚT HƯỚNG DẪN ETAX */}
                  <Button
                    type="primary"
                    icon={<CreditCardOutlined />}
                    onClick={() => setShowEtaxModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-8 border-none shadow-xs flex items-center gap-1.5"
                  >
                    Hướng dẫn eTax
                  </Button>
                </div>

                {/* HẠN NỘP THEO LUẬT ĐỊNH */}
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                  <ClockCircleOutlined className="text-slate-500" />
                  <span>
                    Hạn nộp tờ khai & thuế:{' '}
                    <strong className="font-extrabold text-slate-900 font-mono">
                      {getQuarterDeadline(taxQuarter, taxYear)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 🌟 4 THẺ THỐNG KÊ TỔNG QUAN / KPI ĐỒNG BỘ FORMAT DASHBOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* CARD 1: TỔNG DOANH THU */}
                <div
                  className="bg-white rounded-xl border border-teal-100 shadow-xs p-3.5 flex items-center gap-3.5 transition-all hover:shadow-sm"
                  style={{ borderLeft: '5px solid #0d9488' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.28)',
                      outline: '3px solid rgba(13, 148, 136, 0.15)',
                    }}
                  >
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      1. TỔNG DOANH THU
                    </div>
                    <div className="text-lg sm:text-xl font-black font-mono text-teal-800 leading-tight mt-0.5 truncate">
                      {citSummary.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>{citSummary.revenueCount} khoản thu</span>
                      <span className="text-teal-600 font-bold">• 100% doanh thu</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: TỔNG CHI PHÍ KẾ TOÁN */}
                <div
                  className="bg-white rounded-xl border border-blue-100 shadow-xs p-3.5 flex items-center gap-3.5 transition-all hover:shadow-sm"
                  style={{ borderLeft: '5px solid #2563eb' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
                      outline: '3px solid rgba(37, 99, 235, 0.15)',
                    }}
                  >
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      2. TỔNG CHI PHÍ KẾ TOÁN
                    </div>
                    <div className="text-lg sm:text-xl font-black font-mono text-slate-900 leading-tight mt-0.5 truncate">
                      {citSummary.totalAccountingExpense.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-emerald-700 font-bold whitespace-nowrap">
                        Được trừ: {citSummary.totalDeductibleExpense.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-rose-600 font-bold whitespace-nowrap">
                        Bị loại: -{citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: THUẾ TNDN DỰ KIẾN */}
                <div
                  className="bg-white rounded-xl border border-amber-200 shadow-xs p-3.5 flex items-center gap-3.5 transition-all hover:shadow-sm"
                  style={{ borderLeft: '5px solid #ea580c' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.28)',
                      outline: '3px solid rgba(234, 88, 12, 0.15)',
                    }}
                  >
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      3. THUẾ TNDN DỰ KIẾN
                    </div>
                    <div className="text-lg sm:text-xl font-black font-mono text-amber-800 leading-tight mt-0.5 truncate">
                      {citSummary.estimatedTaxAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10.5px] text-amber-900 mt-1 flex flex-wrap items-center justify-between gap-1">
                      <span className="whitespace-nowrap">Tạm nộp 80%: <strong>{citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ</strong></span>
                      <Tag color="orange" className="font-extrabold text-[10px] m-0 shrink-0">
                        {citSummary.taxRate ? (citSummary.taxRate * 100).toFixed(0) + '%' : '20%'}
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* CARD 4: LỢI NHUẬN RÒNG SAU THUẾ */}
                <div
                  className="bg-white rounded-xl border border-emerald-200 shadow-xs p-3.5 flex items-center gap-3.5 transition-all hover:shadow-sm"
                  style={{ borderLeft: '5px solid #16a34a' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
                      outline: '3px solid rgba(22, 163, 74, 0.15)',
                    }}
                  >
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      4. LỢI NHUẬN RÒNG SAU THUẾ
                    </div>
                    <div className={`text-lg sm:text-xl font-black font-mono leading-tight mt-0.5 truncate ${citSummary.netProfitAfterTax >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                      {citSummary.netProfitAfterTax.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10.5px] text-emerald-700 mt-1 flex flex-wrap items-center justify-between gap-1">
                      <span className="whitespace-nowrap">= Thu - Chi - Thuế</span>
                      <span className="font-mono font-bold text-emerald-900 shrink-0">
                        {citSummary.totalRevenue > 0
                          ? `${((citSummary.netProfitAfterTax / citSummary.totalRevenue) * 100).toFixed(1)}% ROS`
                          : '0% ROS'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* THÔNG BÁO CHẾ ĐỘ CẢ NĂM (TỰ ĐỘNG GỘP 4 QUÝ CHUẨN KẾ TOÁN) */}
              {taxQuarter === 'ALL' && (
                <Alert
                  message={`Chế Độ Tổng Hợp Quyết Toán Cả Năm ${taxYear} (Chuẩn Kế Toán)`}
                  description={
                    <div className="space-y-1 text-xs text-blue-900">
                      <p className="m-0 font-medium">
                        Bảng số liệu dưới đây đang <strong>tự động gộp dữ liệu từ 4 Quý (Q1, Q2, Q3, Q4)</strong> của năm tài chính {taxYear} để tính nghĩa vụ quyết toán thuế TNDN và Lợi nhuận ròng cả năm.
                      </p>
                      <p className="m-0 text-slate-500 italic">
                        * Chế độ Cả năm là chế độ xem tổng hợp. Để thêm mới, chỉnh sửa hoặc nạp file Excel cho từng giao dịch, vui lòng chọn Quý cụ thể (Quý 1, 2, 3 hoặc 4) ở thanh chọn phía trên.
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="rounded-2xl border-blue-200 bg-blue-50/70"
                />
              )}

              {/* 📋 2 TABS SỔ THU CHI CHUẨN ANT DESIGN VỚI PHÂN TRANG & TÌM KIẾM SERVER-SIDE */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <Tabs
                  activeKey={financialTab}
                  onChange={(k) => setFinancialTab(k as 'revenue' | 'expense')}
                  className="px-4 pt-2"
                  items={[
                    {
                      key: 'revenue',
                      label: (
                        <span className="flex items-center gap-2 font-bold text-sm text-teal-900">
                          1. Bảng Kê Doanh Thu Ghi Nhận
                          <Tag color="cyan" className="rounded-full px-2 text-[11px] font-extrabold m-0">
                            {citSummary.revenueCount} khoản
                          </Tag>
                        </span>
                      ),
                      children: (
                        <div className="space-y-3 pb-4">
                          {/* Thanh công cụ tìm kiếm và thao tác Tab Doanh thu */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50/70 p-3 rounded-xl border border-teal-100">
                            <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-[420px]">
                              <Input.Search
                                placeholder="Tìm theo Số HĐ hoặc Khách hàng / Diễn giải..."
                                allowClear
                                value={revenueSearch}
                                onChange={(e) => setRevenueSearch(e.target.value)}
                                onSearch={() => { setRevenuePage(1); fetchRevenues(); }}
                                size="small"
                                className="w-full text-xs"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="primary"
                                size="small"
                                icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                                onClick={handleOpenAddRevenue}
                                disabled={taxQuarter === 'ALL'}
                                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 border-none font-bold text-xs rounded-lg"
                                title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để thêm mới' : 'Thêm khoản thu'}
                              >
                                Thêm khoản thu
                              </Button>
                              <Upload
                                accept=".xlsx, .xls"
                                showUploadList={false}
                                beforeUpload={handleUploadRevenueExcel}
                                disabled={isExcelUploading || taxQuarter === 'ALL'}
                              >
                                <Button
                                  size="small"
                                  icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1" />}
                                  loading={isExcelUploading}
                                  disabled={taxQuarter === 'ALL'}
                                  className="font-bold text-xs rounded-lg"
                                  title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để nạp file' : 'Nạp file Excel Doanh thu'}
                                >
                                  Import Excel Doanh thu
                                </Button>
                              </Upload>
                              <button
                                type="button"
                                onClick={() => downloadRevenueExcelTemplate(taxQuarter, taxYear)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-transparent border-none p-0 ml-1 transition-colors"
                              >
                                <DownloadOutlined className="text-emerald-600 text-xs" />
                                <span>Tải mẫu Excel Doanh thu</span>
                              </button>
                            </div>
                          </div>

                          {/* Bảng Doanh thu Ant Design Server-side */}
                          <Table
                            dataSource={revenuesData}
                            rowKey="id"
                            loading={isRevenueLoading}
                            columns={revenueColumns}
                            pagination={{
                              current: revenuePage,
                              pageSize: revenueLimit,
                              total: revenuesTotal,
                              showSizeChanger: true,
                              pageSizeOptions: ['10', '20', '50', '100'],
                              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} khoản thu`,
                              onChange: (page, pageSize) => {
                                setRevenuePage(page);
                                setRevenueLimit(pageSize);
                              },
                            }}
                            className="border border-slate-200 rounded-xl overflow-hidden"
                            size="small"
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'expense',
                      label: (
                        <span className="flex items-center gap-2 font-bold text-sm text-slate-900">
                          2. Bảng Kê Chi Phí & Rà Soát Xuất Toán (Mục B4)
                          <Tag color="orange" className="rounded-full px-2 text-[11px] font-extrabold m-0">
                            {citSummary.expenseCount} khoản
                          </Tag>
                          {citSummary.disallowedCount > 0 && (
                            <Tag color="error" className="rounded-full px-2 text-[11px] font-extrabold m-0">
                              {citSummary.disallowedCount} bị loại B4
                            </Tag>
                          )}
                        </span>
                      ),
                      children: (
                        <div className="space-y-3 pb-4">
                          {/* Thanh công cụ tìm kiếm, bộ lọc B4 và thao tác Tab Chi phí */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/90 p-3 rounded-xl border border-slate-200">
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                              <Input.Search
                                placeholder="Tìm theo Khoản mục chi hoặc Ghi chú..."
                                allowClear
                                value={expenseSearch}
                                onChange={(e) => setExpenseSearch(e.target.value)}
                                onSearch={() => { setExpensePage(1); fetchExpenses(); }}
                                size="small"
                                className="w-full sm:w-60 text-xs"
                              />
                              <Radio.Group
                                value={expenseFilterB4}
                                onChange={(e) => {
                                  setExpenseFilterB4(e.target.value);
                                  setExpensePage(1);
                                }}
                                size="small"
                                optionType="button"
                                buttonStyle="solid"
                              >
                                <Radio.Button value="ALL">Tất cả ({citSummary.expenseCount})</Radio.Button>
                                <Radio.Button value="DISALLOWED" className="text-rose-600 font-bold">
                                  ⚠️ Bị loại B4 ({citSummary.disallowedCount})
                                </Radio.Button>
                                <Radio.Button value="DEDUCTIBLE" className="text-emerald-700 font-bold">
                                  ✅ Được trừ ({citSummary.expenseCount - citSummary.disallowedCount})
                                </Radio.Button>
                              </Radio.Group>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="primary"
                                size="small"
                                icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                                onClick={handleOpenAddExpense}
                                disabled={taxQuarter === 'ALL'}
                                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 border-none font-bold text-xs rounded-lg"
                                title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để thêm mới' : 'Thêm khoản chi'}
                              >
                                Thêm khoản chi
                              </Button>
                              <Upload
                                accept=".xlsx, .xls"
                                showUploadList={false}
                                beforeUpload={handleUploadExpenseExcel}
                                disabled={isExcelUploading || taxQuarter === 'ALL'}
                              >
                                <Button
                                  size="small"
                                  icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1" />}
                                  loading={isExcelUploading}
                                  disabled={taxQuarter === 'ALL'}
                                  className="font-bold text-xs rounded-lg"
                                  title={taxQuarter === 'ALL' ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để nạp file' : 'Nạp file Excel Chi phí'}
                                >
                                  Import Excel Chi phí
                                </Button>
                              </Upload>
                              <button
                                type="button"
                                onClick={() => downloadExpenseExcelTemplate(taxQuarter, taxYear)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-transparent border-none p-0 ml-1 transition-colors"
                              >
                                <DownloadOutlined className="text-emerald-600 text-xs" />
                                <span>Tải mẫu Excel Chi phí</span>
                              </button>
                            </div>
                          </div>

                          {/* Bảng Chi phí Ant Design Server-side */}
                          <Table
                            dataSource={expensesData}
                            rowKey="id"
                            loading={isExpenseLoading}
                            columns={expenseColumns}
                            pagination={{
                              current: expensePage,
                              pageSize: expenseLimit,
                              total: expensesTotal,
                              showSizeChanger: true,
                              pageSizeOptions: ['10', '20', '50', '100'],
                              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} khoản chi`,
                              onChange: (page, pageSize) => {
                                setExpensePage(page);
                                setExpenseLimit(pageSize);
                              },
                            }}
                            rowClassName={(record) =>
                              record.isDisallowedB4
                                ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                                : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                            }
                            className="border border-slate-200 rounded-xl overflow-hidden"
                            size="small"
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </div>


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
              <span className="font-bold block">Bạn muốn xử lý dữ liệu hiện có của Quý {taxQuarter} / Năm {taxYear} như thế nào?</span>
              <p className="m-0 text-[11px] text-slate-600">
                • <strong>Xóa dữ liệu cũ & Ghi đè:</strong> Xóa toàn bộ số liệu của riêng Quý {taxQuarter}/{taxYear} và nạp 100% từ file Excel mới (các Quý khác vẫn được giữ nguyên an toàn).
                <br />
                • <strong>Giữ dữ liệu cũ & Nối thêm mới:</strong> Kiểm tra nghiêm ngặt trùng lặp với Quý {taxQuarter}; nếu có bất kỳ dòng nào bị trùng sẽ bị chặn ngay lập tức.
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
            <span>{editingRevenueId !== null ? 'Chỉnh Sửa Khoản Thu Doanh Thu' : 'Thêm Mới Khoản Thu Doanh Thu'}</span>
          </div>
        }
        open={isRevenueModalOpen}
        onCancel={() => setIsRevenueModalOpen(false)}
        onOk={handleSaveRevenue}
        okText={editingRevenueId !== null ? 'Cập nhật' : 'Thêm vào bảng'}
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
            rules={[{ required: true, message: 'Vui lòng chọn ngày ghi nhận' }]}
          >
            <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày ghi nhận (DD/MM/YYYY)" className="w-full rounded-xl" />
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
            <span>{editingExpenseId !== null ? 'Chỉnh Sửa Khoản Chi Phí Kế Toán' : 'Thêm Mới Khoản Chi Phí Kế Toán'}</span>
          </div>
        }
        open={isExpenseModalOpen}
        onCancel={() => setIsExpenseModalOpen(false)}
        onOk={handleSaveExpense}
        okText={editingExpenseId !== null ? 'Cập nhật' : 'Thêm vào bảng'}
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
            rules={[{ required: true, message: 'Vui lòng chọn ngày chi' }]}
          >
            <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày chi (DD/MM/YYYY)" className="w-full rounded-xl" />
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

