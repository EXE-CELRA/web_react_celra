/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useOrgStore } from '../../store/useOrgStore';
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
} from '@ant-design/icons';
import { 
  ShieldCheck,
  Wallet, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  ExternalLink,
  Check,
  AlertTriangle
} from 'lucide-react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { CONTEXT_GROUPS, ENABLED_CONTEXT_GROUP_KEYS } from './ContextPage';
import { downloadCitExcelTemplate, parseCitExcelFile, detectPeriodFromCitData, type ParsedCitData } from '../../utils/excelTaxTemplate';
import { detectTaxIncentiveZone } from '../../utils/taxIncentiveZones';
import { calculateCitTax, type CitCalculationResult } from '../../utils/citTaxCalculator';
import { EtaxPaymentGuideModal } from '../../components/tax/EtaxPaymentGuideModal';
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

export const ContextAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroup = searchParams.get('group') || 'thue_ke_toan';

  const { facts, fetchFacts } = useContextStore();
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

  // 🏢 DỮ LIỆU DOANH NGHIỆP & DỰ TOÁN THUẾ TNDN QUA EXCEL
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentQuarter = useMemo(() => Math.floor(new Date().getMonth() / 3) + 1, []);
  const [taxQuarter, setTaxQuarter] = useState<number | 'ALL'>(currentQuarter);
  const [taxYear, setTaxYear] = useState<number>(currentYear);
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

  const orgAddress = activeOrg?.address || activeOrg?.diaChi || 'Quận Ninh Kiều, TP. Cần Thơ';
  const orgTaxCode = activeOrg?.taxCode || activeOrg?.maSoThue || '0101234567';
  const orgName = activeOrg?.legalName || activeOrg?.name || activeOrg?.tenDoanhNghiep || 'Doanh nghiệp';
  const orgModel = activeOrg?.legalType || activeOrg?.loaiHinhPhapLy || 'TAG_TNHH_1TV';
  const orgCity = activeOrg?.city ? `Cục Thuế ${activeOrg.city}` : 'Cơ quan thuế quản lý trực tiếp';

  const incentiveInfo = useMemo(() => {
    return detectTaxIncentiveZone(orgAddress);
  }, [orgAddress]);

  const handleExcelUpload = async (file: File) => {
    setIsExcelUploading(true);
    try {
      const parsed = await parseCitExcelFile(file);
      // Tự động bóc tách Quý & Năm từ dữ liệu ngày trong file Excel nếu có
      const detected = detectPeriodFromCitData(parsed.revenues, parsed.expenses);
      if (detected.year) {
        setTaxYear(detected.year);
      }
      if (detected.quarter) {
        setTaxQuarter(detected.quarter);
      }

      const res = calculateCitTax(parsed.revenues, parsed.expenses, incentiveInfo, orgModel);
      setCitCalcResult(res);
      setParsedExcelData(parsed);
      const periodTag = detected.quarter && detected.year ? ` (Tự động nhận diện: Quý ${detected.quarter}/${detected.year})` : '';
      message.success(`Đã phân tích thành công ${parsed.revenues.length} khoản thu và ${parsed.expenses.length} khoản chi!${periodTag}`);
    } catch (err: any) {
      console.error(err);
      message.error('Không thể đọc file Excel. Vui lòng tải đúng file mẫu chuẩn 2 Sheet của CELRA!');
    } finally {
      setIsExcelUploading(false);
    }
    return false;
  };

  useEffect(() => {
    fetchWallet();
    fetchFacts();
  }, [fetchFacts, fetchWallet]);

  // Danh sách fact hợp nhất: Ưu tiên facts từ Database, nếu rỗng thì dùng chuẩn thẻ
  const effectiveFacts: ContextFact[] = useMemo(() => {
    const rawList = facts && facts.length > 0 ? facts : (STANDARD_21_CONTEXT_FACTS as ContextFact[]);
    return rawList.filter((f) => ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''));
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

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ========================================================= */}
      {/* BƯỚC 1: CHỌN CÁC THẺ CONTEXT & UPLOAD EXCEL */}
      {/* ========================================================= */}
      {step === 'select' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          {/* THANH TABS NHÓM BỐI CẢNH */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            {/* CHỈ HIỂN THỊ CÁC PHÂN HỆ ĐANG KÍCH HOẠT (THUẾ) */}
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

          {/* 📊 PHÂN HỆ NỘP FILE EXCEL THU - CHI DỰ TOÁN THUẾ TNDN (CHỈ HIỆN KHI CHỌN TAB THUẾ) */}
          {activeTab === 'thue_ke_toan' && (
            <div className="bg-linear-to-br from-amber-500/10 via-amber-50/60 to-orange-50/40 border-2 border-amber-300 rounded-2xl p-5 space-y-4 shadow-xs">
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
                      onChange={(val) => setTaxQuarter(val)}
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
                      onChange={(val) => setTaxYear(Number(val))}
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
                    <InboxOutlined className="text-3xl" />
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
                    <div className="bg-teal-50/90 px-4 py-3 border-b border-teal-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                        <h5 className="text-xs sm:text-sm font-extrabold text-teal-950 uppercase m-0 tracking-wider">
                          1. Bảng Kê Doanh Thu Ghi Nhận ({parsedExcelData.revenues.length} khoản)
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color="cyan" className="font-bold text-xs m-0">
                          {taxQuarter === 'ALL' ? `Cả năm ${taxYear}` : `Quý ${taxQuarter}/${taxYear}`}
                        </Tag>
                        <span className="text-[11px] font-bold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                          Sheet: DOANH_THU
                        </span>
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedExcelData.revenues.map((row, idx) => (
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
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-teal-50/80 border-t-2 border-teal-300 font-bold text-xs">
                            <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-teal-950">
                              Tổng Doanh Thu Ghi Nhận:
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-sm sm:text-base font-black text-teal-800 whitespace-nowrap">
                              {citCalcResult.totalRevenue.toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* BẢNG 2: BẢNG KÊ CHI PHÍ KẾ TOÁN & RÀ SOÁT XUẤT TOÁN (SHEET CHI_PHI) */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase m-0 tracking-wider">
                          2. Bảng Kê Chi Phí Kế Toán & Rà Soát Xuất Toán ({parsedExcelData.expenses.length} khoản)
                        </h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color="orange" className="font-bold text-xs m-0">
                          {taxQuarter === 'ALL' ? `Cả năm ${taxYear}` : `Quý ${taxQuarter}/${taxYear}`}
                        </Tag>
                        <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          Sheet: CHI_PHI
                        </span>
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
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                  {row.amount.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="py-2.5 px-4">
                                  {disallowed ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                        <WarningOutlined /> BỊ LOẠI (MỤC B4)
                                      </span>
                                      <p className="text-[11px] text-rose-700 m-0 font-medium leading-snug">
                                        {disallowed.reason}
                                      </p>
                                      <p className="text-[10px] text-slate-400 italic m-0">
                                        Căn cứ: {disallowed.legalBasis}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                            <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-slate-800">
                              Tổng Chi Phí Kế Toán:
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">
                              {citCalcResult.totalAccountingExpense.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Được trừ: <strong className="font-mono">{citCalcResult.totalDeductibleExpense.toLocaleString('vi-VN')} đ</strong>
                                </span>
                                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
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
                </div>
              )}
            </div>
          )}

          {/* GRID DANH SÁCH THẺ CONTEXT */}
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
              ({selectedFactIds.length} thẻ × {COST_PER_CARD} Credit).
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
  );
};

export default ContextAuditPage;
