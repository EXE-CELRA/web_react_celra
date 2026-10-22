/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import apiClient from '../../api/client';
import { message } from 'antd';
import type { Priority, StatutoryCycleType, ContextFact } from '../../types';
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

interface ContextComplianceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedFactId?: string | null;
  onSuccess?: () => void;
}

export interface AuditFindingItem {
  id: string;
  auditId: string;
  factId?: string | null;
  ruleCode: string;
  obligationTitle: string;
  category: string;
  applicableStatus: 'applicable' | 'not_applicable' | 'missing_info' | 'verification_required';
  actionRequired: string;
  evidenceRequired: string;
  legalBasis: string;
  legalDocNumber?: string | null;
  legalArticle?: string | null;
  legalDocUrl?: string | null;
  legalValidity: 'in_force' | 'expired' | 'unverified';
  verifiedAt?: string | null;
  resultSource: 'rule_based' | 'ai_assisted' | 'unverified_fallback';
  cycleType: StatutoryCycleType;
  calculationMethod?: string | null;
  missingDataNotice?: string | null;
  suggestedPriority: Priority;
  penaltyRisk?: string;
}

const COST_PER_CARD = 25; // 25 Credit / thẻ bối cảnh

// Bảng rủi ro chế tài xử phạt thực tế theo các Nghị định hiện hành
// eslint-disable-next-line react-refresh/only-export-components
export const STATUTORY_PENALTY_RISKS: Record<string, string> = {
  'RULE-TAX-GTGT':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá thời hạn quy định.',
  'RULE-TAX-TNDN-80':
    'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% quyết toán theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
  'RULE-TAX-MB':
    'Phạt tiền từ 2.000.000đ - 5.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai lệ phí môn bài quá hạn quy định.',
  'RULE-LABOR-REPORT-6M':
    'Phạt tiền từ 5.000.000đ - 10.000.000đ theo Khoản 2 Điều 8 Nghị định 12/2022/NĐ-CP đối với hành vi không báo cáo tình hình thay đổi lao động.',
  'RULE-CORP-CAPITAL-90D':
    'Phạt tiền từ 30.000.000đ - 50.000.000đ theo Khoản 3 Điều 46 Nghị định 122/2021/NĐ-CP đối với hành vi không góp đủ vốn điều lệ đúng thời hạn cam kết.',
  'RULE-CORP-CAPITAL-REDUCE-30D':
    'Phạt tiền từ 20.000.000đ - 30.000.000đ theo Khoản 2 Điều 46 Nghị định 122/2021/NĐ-CP đối với hành vi không đăng ký điều chỉnh giảm vốn điều lệ khi hết hạn góp vốn.',
  'RULE-CORP-BIZ-INFO-10D':
    'Phạt tiền từ 5.000.000đ - 10.000.000đ theo Điều 44 Nghị định 122/2021/NĐ-CP đối với hành vi thông báo thay đổi thông tin ĐKKD quá thời hạn từ 11 đến 30 ngày.',
  'RULE-TAX-FCT-10D':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế nhà thầu quá hạn quy định.',
  'RULE-TAX-CYCLE-CHANGE-20D':
    'Phạt cảnh cáo hoặc phạt tiền từ 1.000.000đ - 5.000.000đ theo Điều 10 Nghị định 125/2020/NĐ-CP khi vi phạm thời hạn thông báo chuyển đổi kỳ tính thuế.',
  'RULE-CORP-SUSPENSION-3D':
    'Phạt tiền từ 10.000.000đ - 15.000.000đ theo Điều 52 Nghị định 122/2021/NĐ-CP đối với hành vi không thông báo hoặc thông báo tạm ngừng kinh doanh không đúng thời hạn.',
  'RULE-TAX-DISSOLUTION-45D':
    'Phạt tiền từ 8.000.000đ - 15.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai quyết toán thuế khi giải thể chậm quá 90 ngày.',
  'RULE-LABOR-BHXH-MONTHLY':
    'Phạt tiền từ 12% đến 15% tổng số tiền phải đóng BHXH bắt buộc theo Khoản 5 Điều 39 Nghị định 12/2022/NĐ-CP và tính lãi chậm nộp bằng 2 lần mức lãi suất đầu tư quỹ BHXH.',
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
  // 2. Pháp Lý (3 thẻ)
  {
    id: 'fact-legal-1',
    key: 'q_legal_1',
    label: 'Các thành viên/cổ đông sáng lập đã góp đủ 100% số vốn điều lệ đã đăng ký cam kết trong vòng 90 ngày kể từ ngày cấp GCN ĐKDN chưa?',
    group: 'phap_ly_von',
    currentValue: 'Đã góp đủ 100% vốn điều lệ vào tài khoản vốn đầu tư của công ty',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-legal-2',
    key: 'q_legal_2',
    label: 'Doanh nghiệp có thực hiện đăng ký thay đổi nội dung ĐKKD trong thời hạn 10 ngày làm việc khi có thay đổi thông tin (địa chỉ, đại diện pháp luật, ngành nghề, vốn)?',
    group: 'phap_ly_von',
    currentValue: 'Đã nộp hồ sơ đăng ký thay đổi tại Phòng ĐKKD trong thời hạn 10 ngày',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-legal-3',
    key: 'q_legal_3',
    label: 'Doanh nghiệp có thông báo tạm ngừng hoặc tiếp tục kinh doanh trước thời hạn ít nhất 03 ngày làm việc không?',
    group: 'phap_ly_von',
    currentValue: 'Đã gửi thông báo bằng văn bản đến cơ quan đăng ký kinh doanh đúng hạn',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  // 3. Vận Hành (2 thẻ)
  {
    id: 'fact-ops-1',
    key: 'q_ops_1',
    label: 'Doanh nghiệp có mở tài khoản ngân hàng và thông báo tài khoản thanh toán với cơ quan thuế trong thời hạn 10 ngày làm việc không?',
    group: 'nganh_nghe_van_hanh',
    currentValue: 'Đã thông báo mẫu 08-MST tài khoản ngân hàng giao dịch của công ty',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-ops-2',
    key: 'q_ops_2',
    label: 'Doanh nghiệp có duy trì biển hiệu công ty tại trụ sở chính và các địa điểm kinh doanh theo quy định Luật Doanh nghiệp không?',
    group: 'nganh_nghe_van_hanh',
    currentValue: 'Đã gắn biển hiệu đầy đủ thông tin tên công ty, MST, địa chỉ trụ sở',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  // 4. Hóa Đơn (5 thẻ)
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
  // 5. Lao Động (5 thẻ)
  {
    id: 'fact-hr-1',
    key: 'q_hr_1',
    label: 'Doanh nghiệp có ký hợp đồng lao động và đăng ký tham gia BHXH, BHYT, BHTN bắt buộc cho người lao động trong vòng 30 ngày làm việc không?',
    group: 'lao_dong_bhxh',
    currentValue: 'Đã ký kết HĐLĐ và báo tăng BHXH kịp thời cho người lao động',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-hr-2',
    key: 'q_hr_2',
    label: 'Doanh nghiệp có thực hiện báo cáo tình hình sử dụng lao động định kỳ 6 tháng (trước 05/06) và hàng năm (trước 05/12) không?',
    group: 'lao_dong_bhxh',
    currentValue: 'Đã nộp báo cáo tình hình sử dụng lao động trên Cổng Dịch vụ công Quốc gia',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-hr-3',
    key: 'q_hr_3',
    label: 'Doanh nghiệp có trên 10 người lao động và đã đăng ký Nội quy lao động với cơ quan quản lý nhà nước về lao động cấp tỉnh trong vòng 10 ngày không?',
    group: 'lao_dong_bhxh',
    currentValue: 'Đã ban hành và nộp hồ sơ đăng ký Nội quy lao động hợp pháp',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-hr-4',
    key: 'q_hr_4',
    label: 'Doanh nghiệp có tổ chức khám sức khỏe định kỳ hàng năm cho toàn bộ người lao động không?',
    group: 'lao_dong_bhxh',
    currentValue: 'Đã ký hợp đồng với cơ sở y tế đủ điều kiện và tổ chức khám sức khỏe định kỳ',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-hr-5',
    key: 'q_hr_5',
    label: 'Doanh nghiệp có thực hiện trích nộp kinh phí công đoàn 2% quỹ tiền lương đóng BHXH hàng tháng theo quy định không?',
    group: 'lao_dong_bhxh',
    currentValue: 'Đã trích nộp đầy đủ 2% kinh phí công đoàn cùng thời điểm đóng BHXH',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
];

export const ContextComplianceAuditModal: React.FC<ContextComplianceAuditModalProps> = ({
  isOpen,
  onClose,
  initialSelectedFactId,
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
    // Tạm thời chỉ mở phân hệ Thuế và Hồ sơ pháp lý
    return rawList.filter((f) => ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''));
  }, [facts]);

  // Khởi tạo chọn thẻ ban đầu
  useEffect(() => {
    if (isOpen && effectiveFacts.length > 0) {
      const taxFacts = effectiveFacts.filter((f) => f.group === 'thue_ke_toan');
      if (initialSelectedFactId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedFactIds([initialSelectedFactId]);
        const target = effectiveFacts.find((f) => f.id === initialSelectedFactId);
        if (target && target.group === 'thue_ke_toan') {
          setActiveTab('thue_ke_toan');
        } else {
          setActiveTab('all');
        }
      } else {
        setSelectedFactIds(taxFacts.map((f) => f.id));
        setActiveTab('tax_accounting');
      }
    }
  }, [isOpen, initialSelectedFactId, effectiveFacts]);

  if (!isOpen) return null;

  // Nhóm hiển thị thẻ theo Tab
  const displayedFacts = activeTab === 'all' 
    ? effectiveFacts 
    : effectiveFacts.filter((f) => f.group === activeTab);

  // Tính toán chi phí: 25 Credit / thẻ
  const totalCost = selectedFactIds.length * COST_PER_CARD;
  const currentBalance = wallet?.balance ?? (wallet as any)?.soDu ?? 40;
  const isBalanceSufficient = currentBalance >= totalCost;
  const missingCredit = Math.max(0, totalCost - currentBalance);

  const toggleSelectFact = (id: string) => {
    setSelectedFactIds((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const isAllCurrentTabSelected =
    displayedFacts.length > 0 && displayedFacts.every((f) => selectedFactIds.includes(f.id));

  const handleToggleSelectCurrentTab = () => {
    if (isAllCurrentTabSelected) {
      setSelectedFactIds((prev) => prev.filter((id) => !displayedFacts.some((f) => f.id === id)));
    } else {
      const newSelected = new Set([...selectedFactIds, ...displayedFacts.map((f) => f.id)]);
      setSelectedFactIds(Array.from(newSelected));
    }
  };

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
      case 'thue_ke_toan': return 'MODULE 1: THUẾ';
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
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {effectiveFacts.length}
                  </span>
                </button>

                {CONTEXT_GROUPS.map((g) => {
                  const isEnabled = ENABLED_CONTEXT_GROUP_KEYS.includes(g.key);
                  const count = effectiveFacts.filter((f) => f.group === g.key).length;
                  const isSelected = activeTab === g.key;
                  const IconComp = g.icon;

                  if (!isEnabled) {
                    const factCount = facts.filter((f) => f.group === g.key).length;
                    return (
                      <button
                        key={g.key}
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-slate-100 text-slate-400 opacity-75 cursor-not-allowed select-none"
                      >
                        <IconComp className="w-3.5 h-3.5 text-slate-400" />
                        <span>{g.shortLabel}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            factCount > 0 ? 'bg-slate-200 text-slate-700' : 'bg-slate-200/70 text-slate-400'
                          }`}
                        >
                          {factCount}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-500">
                          Khóa
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setActiveTab(g.key)}
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

              {/* HỘP HƯỚNG DẪN & CHỌN THẺ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/70 border border-teal-200 rounded-xl p-3.5">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Chọn các thẻ bối cảnh muốn rà soát tuân thủ
                  </h4>
                  <p className="text-xs text-teal-800">
                    Mỗi thẻ được chọn sẽ được phân tích đối chiếu với hệ thống luật định và quy chuẩn thuế tương ứng. Bạn có thể chọn tất cả hoặc tick chọn riêng từng thẻ.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={handleToggleSelectCurrentTab}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-900 border border-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAllCurrentTabSelected ? 'Bỏ chọn tab này' : 'Chọn tất cả tab này'}
                  </button>
                  <span className="text-xs font-bold px-3 py-1.5 bg-teal-600 text-white rounded-lg shadow-xs">
                    Đã chọn: {selectedFactIds.length} thẻ
                  </span>
                </div>
              </div>

              {/* GRID DANH SÁCH THẺ CONTEXT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedFacts.map((fact) => {
                  const isSelected = selectedFactIds.includes(fact.id);
                  const isConfirmed = fact.status === 'confirmed';

                  return (
                    <div
                      key={fact.id}
                      onClick={() => toggleSelectFact(fact.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 relative ${
                        isSelected
                          ? 'bg-teal-50/40 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Top Thẻ: Checkbox, Module tag, Status tag */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 pointer-events-none"
                          />
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {getModuleTag(fact.group)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isConfirmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isConfirmed ? 'Đã xác nhận' : 'Chờ đối soát'}
                        </span>
                      </div>

                      {/* Tiêu đề câu hỏi / Fact label */}
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {fact.nhan || fact.label}
                      </p>

                      {/* Khung câu trả lời / Giá trị ghi nhận */}
                      <div className="text-xs text-slate-600 bg-slate-50/90 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {fact.giaTriHienTai || fact.currentValue || fact.value || 'Chưa ghi nhận dữ liệu'}
                      </div>

                      {/* Đơn giá rà soát thẻ này */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500">Đơn giá rà soát thẻ này:</span>
                        <span className="font-bold text-teal-800">{COST_PER_CARD} Credit</span>
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
                Quay lại chọn thẻ
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
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContextComplianceAuditModal;
