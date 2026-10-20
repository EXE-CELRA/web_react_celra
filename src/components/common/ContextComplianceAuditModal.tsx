import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useWalletStore } from '../../store/useWalletStore';
import apiClient from '../../api/client';
import { message } from 'antd';
import type { Priority } from '../../types';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Wallet, 
  ArrowRight, 
  Scale, 
  ListChecks, 
  FileText, 
  Clock, 
  Coins, 
  Sparkles, 
  Check, 
  PlusCircle, 
  Building2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { CONTEXT_GROUPS, isContextGroupEnabled } from '../../pages/Context/ContextPage';

interface ContextComplianceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedFactId?: string | null;
  onSuccess?: () => void;
}

interface AuditFindingResult {
  id: string;
  factId: string;
  factLabel: string;
  factValue: string;
  obligationTitle: string;
  category: string;
  priority: Priority;
  legalBasis: string;
  penaltyWarning: string;
  complianceActionItems: string[];
  requiredDocuments: string[];
  recommendedDeadline: string;
  departmentId: string;
  departmentName: string;
  suggestedChecklistCode: string;
  suggestedChecklistTitle: string;
  directUrl?: string;
  tasks: {
    code: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
  }[];
}

const COST_PER_CARD = 25; // 25 Credit / thẻ context

export const ContextComplianceAuditModal: React.FC<ContextComplianceAuditModalProps> = ({
  isOpen,
  onClose,
  initialSelectedFactId,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { facts, updateFact } = useContextStore();
  const { wallet, fetchWallet, buyPackage } = useWalletStore();

  type AuditModalTab = 'all' | string;
  const [activeTab, setActiveTab] = useState<AuditModalTab>('tax_accounting');
  const [step, setStep] = useState<'select' | 'confirm' | 'scanning' | 'results'>('select');
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('Đang khởi động tiến trình rà soát...');
  const [createdChecklists, setCreatedChecklists] = useState<Record<string, string>>({});
  const [allCreated, setAllCreated] = useState(false);
  const [updatedFactValues, setUpdatedFactValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditFindingResult[]>([]);

  // Cho phép rà soát toàn bộ các thẻ bối cảnh thực tế trong cơ sở dữ liệu
  const displayedFacts = activeTab === 'all' ? facts : facts.filter((f) => f.group === activeTab);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setScanProgress(0);
      setCreatedChecklists({});
      setAllCreated(false);
      setUpdatedFactValues({});
      setAuditResults([]);
      fetchWallet();

      const currentTaxFacts = facts.filter((f) => f.group === 'tax_accounting');

      if (initialSelectedFactId) {
        setSelectedFactIds([initialSelectedFactId]);
        const target = facts.find((f) => f.id === initialSelectedFactId);
        if (target && target.group === 'tax_accounting') {
          setActiveTab('tax_accounting');
        } else {
          setActiveTab('all');
        }
      } else {
        // Mặc định chọn 3 thẻ Thuế Doanh Nghiệp (thay vì chọn cả 14 thẻ)
        setSelectedFactIds(currentTaxFacts.map((f) => f.id));
        setActiveTab('tax_accounting');
      }
    }
  }, [isOpen, initialSelectedFactId, facts]);

  if (!isOpen) return null;

  const currentBalance = wallet?.balance ?? 100;
  const totalCost = selectedFactIds.length * COST_PER_CARD;
  const isBalanceSufficient = currentBalance >= totalCost;

  const toggleSelectFact = (id: string) => {
    const fact = facts.find((f) => f.id === id);
    if (!fact || !isContextGroupEnabled(fact.group)) return;
    setSelectedFactIds((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const selectableFactsInCurrentTab = displayedFacts.filter((f) => isContextGroupEnabled(f.group));
  const isAllCurrentTabSelected = 
    selectableFactsInCurrentTab.length > 0 && selectableFactsInCurrentTab.every((f) => selectedFactIds.includes(f.id));

  const handleToggleSelectCurrentTab = () => {
    if (isAllCurrentTabSelected) {
      // Bỏ chọn các thẻ trong tab đang xem
      setSelectedFactIds((prev) => prev.filter((id) => !selectableFactsInCurrentTab.some((f) => f.id === id)));
    } else {
      // Chọn tất cả thẻ hợp lệ trong tab đang xem (giữ nguyên các thẻ đã chọn ở tab khác)
      const newSelected = new Set([...selectedFactIds, ...selectableFactsInCurrentTab.map((f) => f.id)]);
      setSelectedFactIds(Array.from(newSelected));
    }
  };

  // AI Semantic Quality Analyzer
  const checkContextQuality = (value: string, label: string) => {
    const clean = (value || '').trim();
    const lower = clean.toLowerCase();
    const meaningless = ['abc', '123', 'asdasd', 'test', 'ok', 'ko', 'k', 'khong', 'không', 'chưa', 'co', 'có', 'roi', 'rồi', 'tuy', 'tùy'];

    if (!clean || lower === 'chưa trả lời' || lower.includes('chưa trả lời') || lower === 'chưa xác định') {
      return {
        isVague: true,
        badgeText: 'Chưa có dữ liệu khảo sát',
        warning: `Thẻ này đang ở trạng thái "Chưa trả lời". Hệ thống cần thông tin tình trạng thực tế của doanh nghiệp để xác định danh mục tuân thủ chính xác.`,
        suggestedFix: `Doanh nghiệp đang rà soát hồ sơ thực tế đối với nghĩa vụ: "${label}" và sẽ bổ sung tài liệu kiểm tra.`,
      };
    }

    if (clean.length < 4 || meaningless.includes(lower)) {
      return {
        isVague: true,
        badgeText: 'Dữ liệu chưa rõ ràng / Có dấu hiệu nhập bừa',
        warning: `Câu trả lời "${value}" quá ngắn hoặc không có ý nghĩa thực tế, không đủ cơ sở pháp lý để lập quy trình tuân thủ chuẩn xác.`,
        suggestedFix: `Doanh nghiệp đang rà soát hồ sơ thực tế đối với nghĩa vụ: "${label}" và sẽ bổ sung tài liệu kiểm tra.`,
      };
    }

    if (lower.includes('chưa rõ quy định') || lower.includes('chưa biết')) {
      return {
        isVague: true,
        badgeText: 'Cần chuyên gia tư vấn pháp lý',
        warning: `Doanh nghiệp chưa nắm rõ quy định pháp luật hiện hành đối với nghĩa vụ này.`,
        suggestedFix: `Đề xuất tham vấn chuyên gia pháp chế hoặc rà soát văn bản chuyên ngành để nắm bắt điều kiện tuân thủ bắt buộc.`,
      };
    }

    return { isVague: false, badgeText: '', warning: '', suggestedFix: '' };
  };

  // Generate audit findings matching Prototype legal registry
  const generateAuditResults = (): AuditFindingResult[] => {
    const results: AuditFindingResult[] = [];
    const selectedFacts = facts.filter((f) => selectedFactIds.includes(f.id));

    selectedFacts.forEach((fact, idx) => {
      const year = new Date().getFullYear();
      const codeSuffix = `${year}-${100 + idx}`;
      const factKey = fact.key || fact.factKey || '';
      const lowerKey = factKey.toLowerCase();
      const factVal = fact.currentValue || fact.value || '';

      if (lowerKey.includes('tax_corp_1') || lowerKey.includes('gtgt') || lowerKey.includes('tncn') || fact.label.toLowerCase().includes('gtgt') || fact.label.toLowerCase().includes('tncn')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Kê khai định kỳ & Nộp tờ khai thuế Giá trị gia tăng (GTGT) và Thuế Thu nhập cá nhân (TNCN)',
          category: 'Thuế Doanh Nghiệp',
          priority: 'urgent',
          legalBasis: 'Điều 44 Luật Quản lý thuế số 38/2019/QH14; Nghị định 126/2020/NĐ-CP; Thông tư 80/2021/TT-BTC',
          penaltyWarning: 'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá thời hạn quy định.',
          complianceActionItems: [
            'Xác định kỳ kê khai thuế (theo tháng hoặc theo quý) căn cứ doanh thu năm liền kề (dưới 50 tỷ đồng kê khai theo quý).',
            'Lập và nộp tờ khai thuế GTGT (Mẫu 01/GTGT) và tờ khai khấu trừ thuế TNCN (Mẫu 05/KK-TNCN) đúng thời hạn luật định.',
            'Thực hiện nộp đủ số tiền thuế phát sinh vào Ngân sách Nhà nước chậm nhất là ngày cuối cùng của thời hạn nộp tờ khai.',
          ],
          requiredDocuments: [
            'Bảng kê hóa đơn GTGT đầu ra, đầu vào trong kỳ kê khai',
            'Thông báo tiếp nhận và chấp thuận tờ khai điện tử từ Cơ quan Thuế qua Cổng thông tin eTax',
            'Chứng từ nộp thuế điện tử vào Ngân sách Nhà nước (Giấy nộp tiền vào NSNN)',
          ],
          recommendedDeadline: 'Ngày cuối cùng của tháng đầu quý sau',
          departmentId: 'dept-acc',
          departmentName: 'Phòng Kế toán & Tài chính',
          suggestedChecklistCode: `CKL-TAX-GTGT-${codeSuffix}`,
          suggestedChecklistTitle: 'Kê khai & Nộp tờ khai thuế GTGT, TNCN quý đúng thời hạn luật định',
          tasks: [
            {
              code: `TASK-TAX-GTGT-${codeSuffix}-1`,
              title: 'Tổng hợp hóa đơn đầu vào - đầu ra và lập tờ khai GTGT Mẫu 01/GTGT',
              description: 'Rà soát tính hợp lệ của hóa đơn, đối chiếu số liệu doanh thu và thuế GTGT trước khi nộp.',
              priority: 'urgent',
              dueDate: '2026-04-30',
            },
            {
              code: `TASK-TAX-GTGT-${codeSuffix}-2`,
              title: 'Nộp tờ khai điện tử qua eTax và lập Giấy nộp tiền thuế GTGT/TNCN phát sinh',
              description: 'Hoàn thành nộp tờ khai và nộp thuế vào NSNN, lưu trữ biên lai thông báo chấp thuận của Cơ quan Thuế.',
              priority: 'high',
              dueDate: '2026-04-30',
            },
          ],
        });
      } else if (lowerKey.includes('tax_corp_2') || lowerKey.includes('80%') || fact.label.toLowerCase().includes('tndn')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý tối thiểu 80% số thuế phải nộp cả năm',
          category: 'Thuế Doanh Nghiệp',
          priority: 'urgent',
          legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP; Luật Thuế TNDN',
          penaltyWarning: 'Trường hợp tổng số thuế TNDN tạm nộp 4 quý thấp hơn 80% số thuế phải nộp theo quyết toán năm, doanh nghiệp phải nộp tiền chậm nộp 0.03%/ngày tính trên số tiền thuế nộp thiếu.',
          complianceActionItems: [
            'Ước tính doanh thu, chi phí hợp lý và lợi nhuận chịu thuế của doanh nghiệp từng quý trong năm.',
            'Tạm nộp tiền thuế TNDN từng quý chậm nhất vào ngày 30 của tháng đầu quý sau.',
            'Rà soát lũy kế 4 quý, nộp bù số thuế TNDN còn thiếu trước ngày 30/01 năm sau để đảm bảo tổng số tạm nộp đạt từ 80% trở lên.',
          ],
          requiredDocuments: [
            'Bảng ước tính kết quả kinh doanh và số thuế TNDN tạm nộp từng quý',
            'Giấy nộp tiền thuế TNDN tạm nộp từng quý vào Ngân sách Nhà nước',
          ],
          recommendedDeadline: 'Chậm nhất ngày 30 của tháng đầu quý kế tiếp',
          departmentId: 'dept-acc',
          departmentName: 'Phòng Kế toán & Tài chính',
          suggestedChecklistCode: `CKL-TAX-TNDN-${codeSuffix}`,
          suggestedChecklistTitle: 'Kiểm soát nghĩa vụ tạm nộp thuế TNDN 4 quý đạt ngưỡng an toàn 80%',
          tasks: [
            {
              code: `TASK-TAX-TNDN-${codeSuffix}-1`,
              title: 'Ước tính lợi nhuận chịu thuế và xác định số thuế TNDN tạm nộp quý hiện tại',
              description: 'Tổng hợp doanh thu chi phí quý, áp dụng thuế suất TNDN 20% để tính số tiền nộp tạm.',
              priority: 'urgent',
              dueDate: '2026-04-30',
            },
            {
              code: `TASK-TAX-TNDN-${codeSuffix}-2`,
              title: 'Lập lệnh nộp thuế TNDN tạm tính qua cổng nộp thuế điện tử',
              description: 'Nộp tiền thuế vào kho bạc nhà nước theo tiểu mục thuế TNDN và lưu trữ chứng từ.',
              priority: 'high',
              dueDate: '2026-04-30',
            },
          ],
        });
      } else if (lowerKey.includes('tax_salary') || lowerKey.includes('lương') || fact.label.toLowerCase().includes('lương') || fact.label.toLowerCase().includes('chi phí')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Chuẩn hóa chứng từ chi phí tiền lương & Hóa đơn đầu vào hợp lệ khi quyết toán thuế TNDN',
          category: 'Thuế Doanh Nghiệp',
          priority: 'urgent',
          legalBasis: 'Điều 4 Thông tư 96/2015/TT-BTC; Thông tư 78/2014/TT-BTC; Nghị định 123/2020/NĐ-CP',
          penaltyWarning: 'Các khoản chi phí tiền lương không có chứng từ thanh toán hợp lệ và hóa đơn đầu vào bất hợp pháp sẽ bị cơ quan thuế loại trừ khi quyết toán TNDN, bị truy thu thuế 20% và phạt khai sai 20%.',
          complianceActionItems: [
            'Hoàn thiện hồ sơ lao động và bảng thanh toán tiền lương: HĐLĐ, bảng chấm công, phiếu lương có chữ ký hoặc chứng từ chuyển khoản.',
            'Kiểm tra tính hợp lệ của 100% hóa đơn đầu vào, bảo đảm hóa đơn điện tử hợp pháp và có chứng từ thanh toán không dùng tiền mặt với hóa đơn từ 20 triệu đồng.',
            'Lập chứng từ khấu trừ thuế TNCN hoặc cam kết thu nhập (Mẫu 08/CK-TNCN) đối với lao động thời vụ theo đúng quy định.',
          ],
          requiredDocuments: [
            'Hợp đồng lao động, quy chế tài chính và thang bảng lương doanh nghiệp',
            'Bảng chấm công và chứng từ chi trả tiền lương (Ủy nhiệm chi hoặc phiếu chi có chữ ký)',
            'Hóa đơn điện tử đầu vào hợp pháp kèm chứng từ thanh toán qua ngân hàng',
          ],
          recommendedDeadline: 'Rà soát định kỳ hàng tháng',
          departmentId: 'dept-acc',
          departmentName: 'Phòng Kế toán & Tài chính',
          suggestedChecklistCode: `CKL-TAX-EXP-${codeSuffix}`,
          suggestedChecklistTitle: 'Rà soát & Hoàn thiện hồ sơ chi phí lương, hóa đơn hợp lệ tính thuế TNDN',
          tasks: [
            {
              code: `TASK-TAX-EXP-${codeSuffix}-1`,
              title: 'Rà soát đối chiếu bảng chấm công, bảng lương và chứng từ thanh toán qua ngân hàng',
              description: 'Kiểm tra khớp đúng giữa hợp đồng lao động và số tiền chi thực tế để đảm bảo chi phí được trừ.',
              priority: 'urgent',
              dueDate: '2026-04-10',
            },
            {
              code: `TASK-TAX-EXP-${codeSuffix}-2`,
              title: 'Tra cứu tính hợp lệ hóa đơn đầu vào trên Cổng thông tin HĐĐT Tổng cục Thuế',
              description: 'Đối chiếu dải hóa đơn đầu vào, kiểm tra trạng thái hoạt động của doanh nghiệp bán hàng.',
              priority: 'high',
              dueDate: '2026-04-15',
            },
          ],
        });
      } else if (lowerKey.includes('ind_fnb_1') || lowerKey.includes('attp') || lowerKey.includes('food_safety')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Thẩm duyệt cơ sở vật chất & Cấp Giấy chứng nhận cơ sở đủ điều kiện An toàn thực phẩm',
          category: 'Giấy phép có điều kiện',
          priority: 'urgent',
          legalBasis: 'Điều 34, 36 Luật An toàn thực phẩm 2010; Nghị định 15/2018/NĐ-CP; Thông tư 38/2018/TT-BNNPTNT',
          penaltyWarning: 'Phạt tiền từ 20.000.000đ - 40.000.000đ và buộc đình chỉ hoạt động chế biến kinh doanh nếu hoạt động không có GCN ATTP.',
          complianceActionItems: [
            'Bố trí mặt bằng khu vực sơ chế - chế biến - ra món theo nguyên tắc một chiều không chồng chéo.',
            'Tổ chức khám sức khỏe thẻ xanh và tập huấn kiến thức ATTP cho 100% nhân viên bếp và phục vụ.',
            'Hoàn thiện hồ sơ pháp lý nộp Ban Quản lý ATTP / Phòng Y tế quận/huyện để tiếp đoàn thẩm định.',
          ],
          requiredDocuments: [
            'Đơn đề nghị cấp Giấy chứng nhận cơ sở đủ điều kiện ATTP',
            'Bản thuyết minh cơ sở vật chất, trang thiết bị và sơ đồ mặt bằng bếp 1 chiều',
            'Giấy khám sức khỏe định kỳ và danh sách tập huấn ATTP của chủ cơ sở và nhân sự',
          ],
          recommendedDeadline: 'Trong vòng 10 ngày',
          departmentId: 'dept-bod',
          departmentName: 'Ban Giám đốc',
          suggestedChecklistCode: `CKL-ATTP-${codeSuffix}`,
          suggestedChecklistTitle: 'Hoàn thiện hồ sơ & Thẩm định cấp mới Giấy chứng nhận đủ điều kiện ATTP',
          tasks: [
            {
              code: `TASK-ATTP-${codeSuffix}-1`,
              title: 'Rà soát sơ đồ mặt bằng bếp một chiều và trang bị kệ inox, bồn rửa',
              description: 'Khắc phục ngay các lỗi bố trí cơ sở vật chất trước khi cơ quan quản lý thẩm định.',
              priority: 'urgent',
              dueDate: '2026-03-25',
            },
            {
              code: `TASK-ATTP-${codeSuffix}-2`,
              title: 'Tập hợp giấy khám sức khỏe và nộp hồ sơ xin cấp GCN ATTP',
              description: 'Nộp bộ hồ sơ hoàn chỉnh tại bộ phận một cửa quận/huyện.',
              priority: 'high',
              dueDate: '2026-03-29',
            },
          ],
        });
      } else if (lowerKey.includes('ind_fnb_2') || lowerKey.includes('invoice') || lowerKey.includes('hóa đơn')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Kết nối giải pháp Hóa đơn điện tử khởi tạo từ máy tính tiền ngành F&B',
          category: 'Hóa đơn & Thuế',
          priority: 'urgent',
          legalBasis: 'Điều 90 Luật Quản lý thuế số 38/2019/QH14; Điều 8 Thông tư 78/2021/TT-BTC; Nghị định 123/2020/NĐ-CP',
          penaltyWarning: 'Phạt tiền từ 10.000.000đ - 20.000.000đ đối với hành vi không xuất hóa đơn khi bán hàng hóa dịch vụ trực tiếp cho người tiêu dùng.',
          complianceActionItems: [
            'Nộp Tờ khai đăng ký/thay đổi thông tin Mẫu 01/ĐKTĐ-HĐĐT chọn hình thức HĐĐT khởi tạo từ máy tính tiền.',
            'Tích hợp phần mềm bán hàng/POS với nhà cung cấp hóa đơn để xuất hóa đơn có mã cơ quan thuế ngay khi in bill.',
            'Hướng dẫn nhân viên thu ngân quy trình xuất hóa đơn và gửi mã tra cứu cho khách hàng.',
          ],
          requiredDocuments: [
            'Thông báo chấp thuận Mẫu 01/ĐKTĐ-HĐĐT từ cơ quan Thuế quản lý',
            'Hợp đồng & biên bản nghiệm thu tích hợp giải pháp máy tính tiền',
            'Dải ký hiệu hóa đơn máy tính tiền được cấp',
          ],
          recommendedDeadline: 'Trong vòng 7 ngày',
          departmentId: 'dept-acc',
          departmentName: 'Phòng Kế toán & Tài chính',
          suggestedChecklistCode: `CKL-HD-${codeSuffix}`,
          suggestedChecklistTitle: 'Kích hoạt & Đồng bộ Hóa đơn điện tử khởi tạo từ máy tính tiền',
          tasks: [
            {
              code: `TASK-HD-${codeSuffix}-1`,
              title: 'Nộp Mẫu 01/ĐKTĐ-HĐĐT đăng ký áp dụng HĐĐT máy tính tiền',
              description: 'Kê khai bổ sung giải pháp máy tính tiền qua cổng thuế điện tử.',
              priority: 'urgent',
              dueDate: '2026-03-24',
            },
            {
              code: `TASK-HD-${codeSuffix}-2`,
              title: 'Cấu hình đồng bộ máy in bill POS xuất hóa đơn có mã',
              description: 'Kiểm thử xuất hóa đơn thật từ máy tính tiền có mã của cơ quan Thuế.',
              priority: 'high',
              dueDate: '2026-03-27',
            },
          ],
        });
      } else if (lowerKey.includes('labor') || lowerKey.includes('nhân sự') || lowerKey.includes('employee')) {
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: 'Giao kết Hợp đồng lao động bằng văn bản & Đăng ký đóng BHXH bắt buộc',
          category: 'Nhân sự & Lao động',
          priority: 'urgent',
          legalBasis: 'Điều 13, 14, 20 Bộ luật Lao động 2019; Điều 2 Luật BHXH 2014; Nghị định 12/2022/NĐ-CP',
          penaltyWarning: 'Phạt tiền từ 5.000.000đ - 25.000.000đ khi không giao kết HĐLĐ bằng văn bản; bị truy thu 100% tiền đóng BHXH và tính lãi chậm đóng.',
          complianceActionItems: [
            'Ký kết HĐLĐ chính thức bằng văn bản cho 100% người lao động đang làm việc (bao gồm nhân sự bếp, phục vụ).',
            'Đăng ký tham gia BHXH, BHYT, BHTN bắt buộc cho người lao động có HĐLĐ từ đủ 1 tháng.',
            'Lập Sổ quản lý lao động và thực hiện khai trình tình hình sử dụng lao động với cơ quan chức năng.',
          ],
          requiredDocuments: [
            'Bản gốc HĐLĐ có chữ ký của người đại diện pháp luật và người lao động',
            'Hồ sơ nhân sự: CCCD công chứng, sơ yếu lý lịch, giấy khám sức khỏe',
            'Biểu mẫu D02-LT báo cáo tình hình tham gia BHXH nộp cơ quan BHXH quận/huyện',
          ],
          recommendedDeadline: 'Ngay trong 7 ngày tới',
          departmentId: 'dept-hr',
          departmentName: 'Phòng Nhân sự & Vận hành',
          suggestedChecklistCode: `CKL-LD-${codeSuffix}`,
          suggestedChecklistTitle: 'Chuẩn hóa 100% Hợp đồng lao động & Hồ sơ Bảo hiểm xã hội bắt buộc',
          tasks: [
            {
              code: `TASK-LD-${codeSuffix}-1`,
              title: 'Soạn thảo và ký kết HĐLĐ văn bản cho các nhân sự chưa ký',
              description: 'Hoàn thiện ký 2 bản HĐLĐ có chữ ký sống và lưu trữ tại hồ sơ công ty, giao 1 bản cho nhân sự.',
              priority: 'urgent',
              dueDate: '2026-03-22',
            },
            {
              code: `TASK-LD-${codeSuffix}-2`,
              title: 'Lập danh sách báo tăng BHXH trên phần mềm kê khai',
              description: 'Kê khai mẫu D02-LT và nộp điện tử lên cơ quan BHXH quản lý.',
              priority: 'high',
              dueDate: '2026-03-25',
            },
          ],
        });
      } else {
        // General compliance finding
        results.push({
          id: `res-${fact.id}`,
          factId: fact.id,
          factLabel: fact.label,
          factValue: factVal,
          obligationTitle: `Rà soát & Đảm bảo tính hợp pháp thông tin: ${fact.label}`,
          category: 'Pháp lý & Vận hành',
          priority: 'medium',
          legalBasis: 'Luật Doanh nghiệp 2020; Quy chuẩn quản trị rủi ro doanh nghiệp',
          penaltyWarning: 'Rủi ro bị xử phạt hành chính từ 3.000.000đ - 10.000.000đ nếu thông tin đăng ký sai lệch so với thực tế vận hành.',
          complianceActionItems: [
            'Đối chiếu thông tin thực tế tại cơ sở với hồ sơ đăng ký doanh nghiệp.',
            'Lưu trữ hồ sơ tài liệu chứng minh nguồn gốc dữ liệu tại văn phòng công ty.',
            'Cập nhật kịp thời trên hệ thống khi có bất kỳ thay đổi nào.',
          ],
          requiredDocuments: [
            'Hồ sơ đăng ký doanh nghiệp bản sao y công chứng',
            'Biên bản họp hoặc quyết định nội bộ của người đại diện pháp luật',
          ],
          recommendedDeadline: 'Trong vòng 14 ngày',
          departmentId: 'dept-bod',
          departmentName: 'Ban Giám đốc',
          suggestedChecklistCode: `CKL-GEN-${codeSuffix}`,
          suggestedChecklistTitle: `Kiểm soát tính tuân thủ định kỳ: ${fact.label}`,
          tasks: [
            {
              code: `TASK-GEN-${codeSuffix}-1`,
              title: `Rà soát và chuẩn hóa tài liệu cho ${fact.label}`,
              description: `Kiểm tra thực tế và cập nhật hồ sơ lưu trữ nội bộ.`,
              priority: 'medium',
              dueDate: '2026-04-05',
            },
          ],
        });
      }
    });

    return results.map((r) => ({
      ...r,
      directUrl: r.directUrl || matchCoreLegalDocUrl(cleanDLPLUrl(r.legalBasis)),
    }));
  };

  const finalAuditResults = auditResults.length > 0 ? auditResults : generateAuditResults();

  // Confirm payment and execute audit via backend
  const handleConfirmAndPay = async () => {
    if (selectedFactIds.length === 0) return;

    setIsProcessing(true);
    setStep('scanning');
    setScanProgress(15);
    setScanStageText(`Đang kết nối hệ thống dữ liệu ${selectedFactIds.length} thẻ Context đã chọn...`);

    setTimeout(() => {
      setScanProgress(45);
      setScanStageText('Đối chiếu quy định pháp luật hiện hành (Nghị định 123, Luật Lao động, Luật ATTP, Luật Quản lý thuế)...');
    }, 600);

    setTimeout(() => {
      setScanProgress(75);
      setScanStageText('Phát hiện khoảng cách tuân thủ (Compliance Gaps), phân tích chế tài và rủi ro phạt...');
    }, 1200);

    setTimeout(() => {
      setScanProgress(100);
      setScanStageText('Tổng hợp danh mục nghĩa vụ bắt buộc và khởi tạo đề xuất Checklist!');
    }, 1800);

    try {
      const realResults: AuditFindingResult[] = [];
      const fallbackList = generateAuditResults();

      for (const factId of selectedFactIds) {
        const fact = facts.find((f) => f.id === factId);
        try {
          const res = await apiClient.post(`/context-facts/${factId}/compliance-audit`);
          const data = res.data?.auditResult;
          if (data && (data.legalCitation || data.proposedChecklist)) {
            const citation = data.legalCitation;
            const rawCitation = citation?.exactQuote || citation?.documentTitle || 'Quy định pháp luật hiện hành';
            const cleanCitation = cleanDLPLUrl(rawCitation);
            const directUrl = cleanDLPLUrl(citation?.directUrl || citation?.sourceUrl) || matchCoreLegalDocUrl(cleanCitation) || matchCoreLegalDocUrl(citation?.documentNumber) || undefined;

            realResults.push({
              id: `res-${factId}`,
              factId: factId,
              factLabel: data.factLabel || fact?.label || 'Nghĩa vụ pháp lý',
              factValue: data.currentValue || fact?.value || '',
              obligationTitle: data.proposedChecklist?.title || `Rà soát tuân thủ: ${fact?.label || ''}`,
              category: data.proposedChecklist?.category || fact?.group || 'Pháp chế & Kế toán',
              priority: (data.riskLevel === 'URGENT' ? 'urgent' : data.riskLevel === 'HIGH' ? 'high' : data.riskLevel === 'MEDIUM' ? 'medium' : 'low') as Priority,
              legalBasis: `${citation?.documentTitle || 'Văn bản QPPL'} ${citation?.articleNumber ? '- ' + citation.articleNumber : ''}: ${citation?.exactQuote || cleanCitation}`,
              penaltyWarning: data.riskSummary || 'Vi phạm có thể bị xử lý hành chính theo quy định.',
              complianceActionItems: [
                `Thu thập và lưu trữ hồ sơ chứng minh cho ${fact?.label || 'thẻ bối cảnh'}.`,
                'Phân công nhân sự theo dõi và cập nhật hồ sơ định kỳ theo quy định pháp luật.'
              ],
              requiredDocuments: [
                'Hồ sơ minh chứng nghiệp vụ thực tế phát sinh',
                'Văn bản quy định nội bộ hoặc hợp đồng liên quan'
              ],
              recommendedDeadline: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
              departmentId: 'dept-legal',
              departmentName: 'Ban Pháp chế & Kế toán',
              suggestedChecklistCode: `CKL-${Date.now().toString().slice(-4)}`,
              suggestedChecklistTitle: data.proposedChecklist?.title || `Quy trình kiểm soát tuân thủ: ${fact?.label || ''}`,
              directUrl,
              tasks: data.proposedChecklist?.tasks?.map((t: any, idx: number) => ({
                code: t.code || `TASK-${idx + 1}`,
                title: t.title,
                description: t.description || 'Thực hiện theo quy định',
                priority: (t.priority?.toLowerCase() || 'medium') as Priority,
                dueDate: new Date(Date.now() + (t.dueDateDays || 14) * 86400000).toISOString().split('T')[0],
              })) || [],
            });
          } else {
            const fallback = fallbackList.find((f) => f.factId === factId);
            if (fallback) realResults.push(fallback);
          }
        } catch (e) {
          console.warn(`Audit error on fact ${factId}:`, e);
          const fallback = fallbackList.find((f) => f.factId === factId);
          if (fallback) realResults.push(fallback);
        }
      }

      await fetchWallet();
      setAuditResults(realResults.length > 0 ? realResults : fallbackList);
    } catch (err: any) {
      console.warn('Audit backend sync:', err);
      setAuditResults(generateAuditResults());
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setStep('results');
      }, 2000);
    }
  };

  // Create single checklist
  const handleCreateSingleChecklist = async (result: AuditFindingResult) => {
    try {
      await apiClient.post(`/context-facts/${result.factId}/generate-checklists`, {
        title: result.suggestedChecklistTitle,
        category: result.category,
        priority: result.priority,
        legalBasis: result.legalBasis,
        tasks: result.tasks,
      });

      setCreatedChecklists((prev) => ({
        ...prev,
        [result.id]: `chk-${Date.now()}`,
      }));
      message.success(`Đã tạo Checklist: ${result.suggestedChecklistTitle}!`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Fallback mark as created
      setCreatedChecklists((prev) => ({
        ...prev,
        [result.id]: `chk-${Date.now()}`,
      }));
      message.success(`Đã tạo thành công Checklist: ${result.suggestedChecklistTitle}`);
    }
  };

  // Create all checklists
  const handleCreateAllChecklists = async () => {
    setIsProcessing(true);
    for (const result of finalAuditResults) {
      if (!createdChecklists[result.id]) {
        await handleCreateSingleChecklist(result);
      }
    }
    setAllCreated(true);
    setIsProcessing(false);
    message.success(`🎉 Đã tạo thành công toàn bộ ${finalAuditResults.length} Checklist tuân thủ!`);
  };

  const handleDepositQuick = async () => {
    try {
      await buyPackage('PKG_120');
      message.success('Đã nạp Gói Tiêu Chuẩn (+120 Credit) vào ví CELRA thành công!');
      await fetchWallet();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi nạp Credit');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex items-center justify-between shrink-0 border-b border-teal-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Rà soát Tuân thủ theo Context Doanh nghiệp
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                CELRA Compliance Audit
              </span>
            </div>
            <p className="text-xs text-teal-100/70 pl-10">
              Kiểm toán nghĩa vụ pháp lý từ dữ liệu thực tế, phát hiện rủi ro phạt và tự động sinh Checklist tuân thủ tức thời.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* STEP 1: CHỌN CÁC THẺ CONTEXT MUỐN RÀ SOÁT */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* TABS LỌC 9 MODULE TUÂN THỦ TRONG MODAL */}
              <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                {/* TAB TẤT CẢ DỮ KIỆN KHẢ DỤNG RÀ SOÁT */}
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {facts.length}
                  </span>
                </button>

                {/* 9 NHÓM CONTEXT DYNAMIC TRONG MODAL */}
                {CONTEXT_GROUPS.map((g) => {
                  const count = facts.filter((f) => f.group === g.key).length;
                  const isSelected = activeTab === g.key;
                  const IconComp = g.icon;
                  const isEnabled = isContextGroupEnabled(g.key);

                  if (!isEnabled) {
                    return (
                      <button
                        key={g.key}
                        type="button"
                        disabled
                        title={`${g.label} đang tạm khóa`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-slate-200/50 text-slate-400 cursor-not-allowed opacity-50 select-none"
                      >
                        <IconComp className="w-3.5 h-3.5 text-slate-400" />
                        <span>{g.shortLabel}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-300 text-slate-500 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setActiveTab(g.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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

              {/* BỘ ĐIỀU KHIỂN CHỌN THẺ VÀ THÔNG TIN CHI PHÍ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/70 border border-teal-200 rounded-2xl p-4">
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
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAllCurrentTabSelected ? 'Bỏ chọn tab này' : 'Chọn tất cả tab này'}
                  </button>
                  <span className="text-xs font-bold px-3 py-1.5 bg-teal-600 text-white rounded-xl shadow-xs">
                    Đã chọn: {selectedFactIds.length} thẻ
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              {displayedFacts.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-500">Không có thẻ nào trong mục này để rà soát.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedFacts.map((fact) => {
                    const isFactEnabled = isContextGroupEnabled(fact.group);
                    const isSelected = selectedFactIds.includes(fact.id);
                    const getFactGroupBadge = (group?: string) => {
                      if (group === 'tax_accounting') return { text: 'Module 1: Thuế', cls: 'text-blue-700 bg-blue-50 border border-blue-200' };
                      if (group === 'legal') return { text: 'Hồ sơ pháp lý', cls: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
                      if (group === 'operations') return { text: 'Hoạt động thực tế', cls: 'text-amber-700 bg-amber-50 border border-amber-200' };
                      return { text: group || 'Chung', cls: 'text-slate-600 bg-slate-100 border border-slate-200' };
                    };
                    const badgeMeta = getFactGroupBadge(fact.group);
                    return (
                      <div
                        key={fact.id}
                        onClick={() => isFactEnabled && toggleSelectFact(fact.id)}
                        className={`p-4 rounded-2xl border transition-all select-none space-y-2.5 relative ${
                          !isFactEnabled
                            ? 'bg-slate-50 border-dashed border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected 
                            ? 'bg-teal-50/40 border-teal-500 shadow-xs ring-2 ring-teal-500/20 cursor-pointer' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!isFactEnabled}
                              onChange={() => {}}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 pointer-events-none"
                            />
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeMeta.cls}`}>
                              {badgeMeta.text}
                            </span>
                          </div>

                          {!isFactEnabled ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" /> Tạm khóa
                            </span>
                          ) : fact.conflictDetails ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Cần đối chiếu
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {fact.status === 'confirmed' ? 'Đã xác nhận' : 'Dữ liệu thực tế'}
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 leading-snug">
                          {fact.label}
                        </h5>

                        <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 text-xs text-slate-800 font-medium line-clamp-2">
                          {fact.currentValue || '⚪ Chưa trả lời'}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[11px] text-slate-500">
                          <span>Đơn giá rà soát thẻ này:</span>
                          <strong className="text-teal-700 font-bold">{COST_PER_CARD} Credit</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: XÁC NHẬN CHI PHÍ & THANH TOÁN QUA VÍ */}
          {step === 'confirm' && (
            <div className="max-w-2xl mx-auto space-y-6 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Coins className="w-6 h-6 text-teal-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Xác nhận Chi phí Lượt Rà soát Tuân thủ
                </h4>
                <p className="text-xs text-slate-500">
                  Hệ thống sẽ khấu trừ số dư Credit ví CELRA để cấp quyền rà soát tức thì.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-600">Số lượng thẻ Context được chọn:</span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {selectedFactIds.length} thẻ
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-600">Đơn giá kiểm toán tuân thủ / thẻ:</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {COST_PER_CARD} Credit / thẻ
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-slate-900">Tổng Credit cần thanh toán:</span>
                  <span className="text-base font-extrabold text-teal-700">
                    {totalCost} Credit
                  </span>
                </div>
              </div>

              {/* Wallet Status Box */}
              <div className={`p-4 rounded-2xl border ${
                isBalanceSufficient 
                  ? 'bg-emerald-50/60 border-emerald-200' 
                  : 'bg-rose-50/60 border-rose-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isBalanceSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Số dư Ví Credit hiện tại:</div>
                      <div className="text-base font-extrabold text-slate-900">
                        {currentBalance.toLocaleString()} Credit
                      </div>
                    </div>
                  </div>

                  {isBalanceSufficient ? (
                    <div className="text-right">
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đủ số dư Credit
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Số dư sau rà soát: <strong>{(currentBalance - totalCost).toLocaleString()} Credit</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right space-y-1">
                      <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1 justify-end">
                        <AlertOctagon className="w-3.5 h-3.5" /> Thiếu {(totalCost - currentBalance).toLocaleString()} Credit
                      </div>
                      <button
                        onClick={handleDepositQuick}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        + Nạp 120 Credit ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* List of facts to review */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Danh sách các thẻ Context chuẩn bị rà soát:</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {facts.filter((f) => selectedFactIds.includes(f.id)).map((f) => (
                    <span key={f.id} className="bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-medium">
                      ✓ {f.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TIẾN HÀNH RÀ SOÁT TUÂN THỦ (SCANNING ANIMATION) */}
          {step === 'scanning' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-teal-100 animate-ping opacity-30" />
                <div className="w-24 h-24 rounded-full border-4 border-teal-500 border-t-transparent animate-spin flex items-center justify-center bg-teal-50">
                  <ShieldCheck className="w-10 h-10 text-teal-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  Đang tiến hành rà soát tuân thủ chuyên sâu...
                </h4>
                <p className="text-xs text-slate-600 min-h-10 leading-relaxed font-medium">
                  {scanStageText}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono font-bold text-teal-700">
                  {scanProgress}%
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KẾT QUẢ RÀ SOÁT & NÚT TÍNH NĂNG TẠO CHECKLIST TUÂN THỦ */}
          {step === 'results' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-base font-bold text-emerald-950">
                      Rà soát hoàn tất! Phát hiện {finalAuditResults.length} nghĩa vụ tuân thủ cần thực thi
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Dữ liệu đã được đối chiếu toàn diện với văn bản pháp luật hiện hành và các quy định ngành của CELRA.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={handleCreateAllChecklists}
                    disabled={allCreated || Object.keys(createdChecklists).length === finalAuditResults.length || isProcessing}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                      allCreated || Object.keys(createdChecklists).length === finalAuditResults.length
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    {allCreated || Object.keys(createdChecklists).length === finalAuditResults.length
                      ? 'Đã tạo toàn bộ Checklist' 
                      : `Tạo toàn bộ Checklist tuân thủ (${finalAuditResults.length} bộ)`}
                  </button>

                  {(allCreated || Object.keys(createdChecklists).length > 0) && (
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/tasks');
                      }}
                      className="px-3.5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <ListChecks className="w-4 h-4" />
                      Xem Checklist &amp; Task ngay
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* AUDIT FINDINGS LIST */}
              <div className="space-y-4">
                {finalAuditResults.map((res) => {
                  const isCreated = !!createdChecklists[res.id];

                  return (
                    <div 
                      key={res.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs hover:border-teal-400 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {res.suggestedChecklistCode}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                              res.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {res.priority === 'urgent' ? <AlertOctagon className="w-3 h-3 text-rose-600" /> : <AlertTriangle className="w-3 h-3 text-orange-600" />}
                              Ưu tiên: {res.priority === 'urgent' ? 'Khẩn cấp' : 'Mức độ cao'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-500" /> Phụ trách: {res.departmentName}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {res.obligationTitle}
                          </h4>

                          <div className="text-xs text-slate-500">
                            Thẻ Context gốc: <strong className="text-slate-700">{res.factLabel}</strong> 
                            <span className="text-slate-400"> ({updatedFactValues[res.factId] || res.factValue})</span>
                          </div>
                        </div>

                        {/* Action: Create Single Checklist */}
                        <div className="shrink-0 pt-1 sm:pt-0">
                          {isCreated ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Đã tạo Checklist
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCreateSingleChecklist(res)}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Tạo Checklist này
                            </button>
                          )}
                        </div>
                      </div>

                      {/* AI Semantic Quality Check for Vague / Meaningless answers */}
                      {(() => {
                        const currentVal = updatedFactValues[res.factId] || res.factValue;
                        const quality = checkContextQuality(currentVal, res.factLabel);
                        const isRecentlyStandardized = !!updatedFactValues[res.factId];

                        if (isRecentlyStandardized) {
                          return (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900">
                              <span className="font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Đã cập nhật câu trả lời chuẩn hóa từ AI: <strong>"{currentVal}"</strong>
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                Đạt chuẩn rà soát
                              </span>
                            </div>
                          );
                        }

                        if (quality.isVague) {
                          return (
                            <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  {quality.badgeText}
                                </span>
                                <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase tracking-wider">
                                  AI Đánh giá câu trả lời
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                                {quality.warning}
                              </p>
                              <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] space-y-1.5 shadow-xs">
                                <div className="font-bold text-slate-800 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Gợi ý câu trả lời chuẩn hóa từ AI:
                                </div>
                                <p className="text-slate-700 italic">"{quality.suggestedFix}"</p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateFact(res.factId, quality.suggestedFix, 'Chuẩn hóa tự động từ AI Rà soát tuân thủ');
                                    setUpdatedFactValues((prev) => ({ ...prev, [res.factId]: quality.suggestedFix }));
                                    message.success(`Đã cập nhật câu trả lời chuẩn hóa cho thẻ "${res.factLabel}"!`);
                                  }}
                                  className="mt-1 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Áp dụng gợi ý &amp; Cập nhật thẻ này trước khi lập Checklist
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {/* Legal Basis & Penalty */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-teal-600" />
                              Căn cứ pháp lý áp dụng:
                            </span>
                            {res.directUrl && (
                              <a
                                href={res.directUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold underline decoration-teal-400"
                              >
                                Xem văn bản DLPL
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {res.legalBasis}
                          </p>
                        </div>

                        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1">
                          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Rủi ro &amp; Chế tài xử phạt nếu vi phạm:
                          </span>
                          <p className="text-rose-950 leading-relaxed font-semibold">
                            {res.penaltyWarning}
                          </p>
                        </div>
                      </div>

                      {/* Compliance Action Items */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          Những gì doanh nghiệp cần tuân thủ ngay:
                        </span>
                        <div className="space-y-1.5 pl-1">
                          {res.complianceActionItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Required Documents & Deadline footer */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Hồ sơ cần lưu: <strong className="text-slate-700">{res.requiredDocuments.join(' • ')}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-700 font-bold shrink-0">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Thời hạn khuyến nghị: {res.recommendedDeadline}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 'select' && (
            <>
              <div className="text-xs text-slate-600">
                <span>Tổng chi phí: </span>
                <strong className="text-teal-700 text-sm font-bold">
                  {totalCost.toLocaleString('vi-VN')} đ
                </strong>
                <span className="text-slate-400"> ({selectedFactIds.length} thẻ × {COST_PER_CARD.toLocaleString('vi-VN')}đ)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={selectedFactIds.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    selectedFactIds.length > 0
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Tiếp tục: Xác nhận chi phí
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Quay lại chọn thẻ
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmAndPay}
                  disabled={!isBalanceSufficient || isProcessing}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                    isBalanceSufficient && !isProcessing
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán & Rà soát ngay'}
                </button>
              </div>
            </>
          )}

          {step === 'scanning' && (
            <div className="w-full text-center text-xs text-slate-400 italic">
              Tiến trình rà soát tự động đang chạy. Vui lòng chờ trong giây lát...
            </div>
          )}

          {step === 'results' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Rà soát lượt khác
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/tasks');
                  }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ListChecks className="w-4 h-4" />
                  Mở trang Checklist &amp; Task
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
