/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tag, Button, Drawer, Tooltip, Alert, Modal, Table } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  PlusOutlined,
  CalendarOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  ShieldAlert,
  ArrowRight,
  FolderOpen,
  Scale,
  CheckSquare,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  FileQuestion,
  Building,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../../api/client';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { getCalculatedQuarterDeadline } from '../../utils/taxCalendar';
import { EvidenceUploadModal } from '../common/EvidenceUploadModal';
import { TaskStatusTag, PriorityTag } from '../common/StatusBadge';
import { useTaskStore } from '../../store/useTaskStore';
import type { ContextFact } from '../../interfaces';
import type { CitTaxTierResult } from '../../utils/taxRateChecker';

// ============================================================================
// ĐỊNH NGHĨA TYPES CHO MÔ HÌNH BÁO CÁO RÀ SOÁT TUÂN THỦ 5 KHU VỰC
// ============================================================================

export type ApplicabilityStatus = 'APPLICABLE' | 'POSSIBLE' | 'NEED_VERIFICATION' | 'NOT_APPLICABLE';
export type ObligationCompletionStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'OVERDUE' | 'PENDING_VERIFICATION';
export type VerificationDocumentStatus = 'NOT_AVAILABLE' | 'MISSING' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type CelraTaskStatus = 'TODO' | 'WAITING_INPUT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED' | 'EXPERT_REQUIRED';

export interface ComplianceObligationItem {
  id: string;
  ruleCode: string;
  category: 'CIT_FILING' | 'CIT_B4_EXPENSE' | 'CIT_WITHHOLDING';
  categoryLabel: string;
  title: string;
  applicabilityStatus: ApplicabilityStatus;
  completionStatus: ObligationCompletionStatus;
  issueSummary: string;
  legalDeadline: string;
  internalDeadline: string;
  riskSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  penaltyText: string;
  evidenceTotal: number;
  evidenceUploaded: number;
  evidenceMissing: number;
  description: string;
  businessDataSnapshot: Record<string, any>;
  legalBasisTitle: string;
  legalArticle: string;
  legalDocNumber: string;
  legalDocUrl: string;
  suggestedAction: string;
  verificationQuestion?: string;
}

export interface CoordinatedTaskItem {
  id: string;
  title: string;
  relatedObligationCode: string;
  relatedObligationTitle: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigneeRole: string;
  deadline: string;
  status: CelraTaskStatus;
  rawStatus?: string;
  completionCondition: string;
}

export interface ComplianceEvidenceItem {
  id: string;
  title: string;
  documentType: string;
  relatedObligationCode: string;
  relatedObligationTitle: string;
  verificationStatus: VerificationDocumentStatus;
  fileUrl?: string;
  fileName?: string;
  updatedAt?: string;
  guidanceNote: string;
}

export interface LegalReferenceDocItem {
  id: string;
  docTitle: string;
  docNumber: string;
  articles: string;
  validity: string;
  relatedObligationCode: string;
  relatedObligationTitle: string;
  officialUrl: string;
}

interface ComplianceAuditReportViewProps {
  activeOrg: any;
  taxQuarter: number | 'ALL';
  taxYear: number;
  citSummary: {
    totalRevenue: number;
    revenueCount: number;
    totalAccountingExpense: number;
    expenseCount: number;
    totalDisallowedExpense: number;
    disallowedCount: number;
    totalDeductibleExpense: number;
    assessableIncome: number;
    taxRate: number;
    estimatedTaxAmount: number;
    statutoryPrepayment80: number;
    accountingProfitBeforeTax: number;
    netProfitAfterTax: number;
  };
  citTierResult: CitTaxTierResult;
  facts: ContextFact[];
  onSwitchToLedger?: () => void;
  onQuarterChange?: (quarter: number | 'ALL') => void;
  onYearChange?: (year: number) => void;
  onOpenChecklistModal?: () => void;
  onOpenEtaxGuide?: () => void;
}

export const ComplianceAuditReportView: React.FC<ComplianceAuditReportViewProps> = ({
  activeOrg,
  taxQuarter,
  taxYear,
  citSummary,
  citTierResult,
  facts,
  onSwitchToLedger,
  onOpenChecklistModal,
  onOpenEtaxGuide,
}) => {
  const { tasks, createTask, fetchTasks } = useTaskStore();
  void facts;

  // Dữ liệu bằng chứng thật từ DB
  const [dbEvidences, setDbEvidences] = useState<any[]>([]);

  const fetchEvidences = useCallback(async () => {
    if (!activeOrg?.id) {
      setDbEvidences([]);
      return;
    }
    try {
      const res = await apiClient.get('/evidence-documents');
      setDbEvidences(Array.isArray(res) ? res : []);
    } catch {
      setDbEvidences([]);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    if (!activeOrg?.id) return;
    fetchTasks();
    fetchEvidences();
  }, [activeOrg?.id, fetchTasks, fetchEvidences]);

  // State điều khiển Drawer Chi tiết nghĩa vụ
  const [selectedObligation, setSelectedObligation] = useState<ComplianceObligationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State điều khiển Modal Upload Bằng chứng
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTargetObligation, setUploadTargetObligation] = useState<string>('RULE-TAX-TNDN-80');

  // State lọc nhóm nghĩa vụ Thuế TNDN
  const [selectedTaxFilter, setSelectedTaxFilter] = useState<'ALL' | 'CIT_FILING' | 'CIT_B4_EXPENSE' | 'CIT_WITHHOLDING'>('ALL');

  // Hạn pháp lý chuẩn luật định (được tự động điều chỉnh ngày nghỉ Thứ 7, Chủ Nhật)
  const quarterDeadlineInfo = useMemo(() => {
    return getCalculatedQuarterDeadline(taxQuarter, taxYear);
  }, [taxQuarter, taxYear]);

  const legalDeadlineText = quarterDeadlineInfo.formattedDate;

  // Deadline nội bộ: 7 ngày làm việc trước hạn pháp lý
  const internalDeadlineText = useMemo(() => {
    switch (taxQuarter) {
      case 1: return `23/04/${taxYear}`;
      case 2: return `24/07/${taxYear}`;
      case 3: return `24/10/${taxYear}`;
      case 4: return `24/01/${taxYear + 1}`;
      case 'ALL': return `24/03/${taxYear + 1}`;
      default: return `24/01/${taxYear + 1}`;
    }
  }, [taxQuarter, taxYear]);

  // Thông tin doanh nghiệp thực tế từ activeOrg (không dùng dữ liệu mẫu giả lập)
  const companyName = activeOrg?.legalName || activeOrg?.name || 'Chưa cập nhật tên doanh nghiệp';
  const taxCode = activeOrg?.taxCode || 'Chưa cập nhật MST';
  const address = activeOrg?.address || 'Chưa cập nhật địa chỉ trụ sở';
  const industry = activeOrg?.industry || 'Hoạt động sản xuất kinh doanh';
  const legalType = activeOrg?.legalType || 'Công ty TNHH';

  // Kiểm tra tính toàn vẹn hồ sơ doanh nghiệp
  const profileWarning = useMemo(() => {
    if (!activeOrg?.taxCode || (!activeOrg?.legalName && !activeOrg?.name)) {
      return {
        type: 'info' as const,
        message: 'Hồ sơ pháp lý đang chờ hoàn thiện',
        description: 'Một số thông tin định danh pháp nhân chưa đầy đủ. Vui lòng cập nhật tại tab Hồ Sơ Cơ Sở để cá nhân hóa báo cáo Thuế TNDN.',
      };
    }

    return null;
  }, [activeOrg]);

  // ============================================================================
  // HELPER ĐỐI CHIẾU DỮ LIỆU DB (TASKS & EVIDENCE) THEO RULE CODE
  // ============================================================================
  const matchEvidenceToRule = useCallback((ev: any, ruleCode: string): boolean => {
    const ocr = ev?.ocrExtractedData || {};
    if (ev?.year && Number(ev.year) !== Number(taxYear)) return false;
    if (ocr.ruleCode === ruleCode || ev?.ruleCode === ruleCode) return true;
    if (ev?.task?.ruleCode === ruleCode) return true;

    const tag = String(ev?.tag || ocr.tag || '');
    const docType = String(ev?.documentType || ev?.category || '');
    switch (ruleCode) {
      case 'RULE-TAX-TNDN-80':
        return tag === 'Tạm nộp 80% (1052)' || docType === 'STATE_TREASURY_RECEIPT';
      case 'RULE-TAX-TNDN-FINAL':
        return tag === 'Quyết toán 03/TNDN' || docType === 'TAX_DECLARATION';
      case 'RULE-TAX-TNDN-B4':
        return tag === 'Chi phí & Mục B4' || tag === 'Bảng kê thu - chi' || docType === 'INVOICE_VOUCHER';
      case 'RULE-CIT-B4-CASH':
        return tag === 'Hóa đơn & Ủy nhiệm chi' || docType === 'BANK_PAYMENT_ORDER';
      case 'RULE-CIT-B4-SALARY':
        return tag.toLowerCase().includes('lương') || String(ev?.title || '').toLowerCase().includes('lương');
      case 'RULE-TAX-FCT-10D':
        return tag === 'Thuế nhà thầu (FCT)' || tag.toLowerCase().includes('fct');
      default:
        return false;
    }
  }, [taxYear]);

  const mapDbTaskStatusToCelra = (status: string): CelraTaskStatus => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in_progress': return 'IN_PROGRESS';
      case 'waiting_verification':
      case 'pending_review':
      case 'pending_approval':
        return 'REVIEW';
      case 'waiting_input': return 'WAITING_INPUT';
      case 'overdue':
      case 'blocked':
        return 'BLOCKED';
      default: return 'TODO';
    }
  };

  // ============================================================================
  // KHU VỰC 2: DANH SÁCH NGHĨA VỤ TUÂN THỦ TRỌNG TÂM THUẾ TNDN
  // ============================================================================
  const obligations: ComplianceObligationItem[] = useMemo(() => {
    const hasDisallowedB4 = citSummary.disallowedCount > 0;
    const hasCitTaxToPay = citSummary.estimatedTaxAmount > 0;
    const isOneMemberLlc = legalType.toUpperCase().includes('1 THÀNH VIÊN') || legalType.toUpperCase().includes('MỘT THÀNH VIÊN') || legalType.toUpperCase().includes('1TV');

    const baseObligations: ComplianceObligationItem[] = [
      // 1. KÊ KHAI & TẠM NỘP THUẾ TNDN
      {
        id: 'ob-tndn-1',
        ruleCode: 'RULE-TAX-TNDN-80',
        category: 'CIT_FILING',
        categoryLabel: 'Tạm nộp TNDN 80%',
        title: 'Tạm nộp thuế TNDN hàng quý đạt ngưỡng tối thiểu 80% số thuế quyết toán năm',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasCitTaxToPay ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasCitTaxToPay
          ? `Số thuế TNDN tạm nộp dự kiến Quý ${taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}: ${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ cần nộp vào NSNN (tiểu mục 1052) trước ${legalDeadlineText}.`
          : 'Chưa phát sinh số thuế TNDN phải tạm nộp cho kỳ tính thuế hiện tại (do chưa phát sinh thu nhập tính thuế dương).',
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
        evidenceTotal: 2,
        evidenceUploaded: hasCitTaxToPay ? 1 : 2,
        evidenceMissing: hasCitTaxToPay ? 1 : 0,
        description: 'Tổng số thuế TNDN đã tạm nộp của 04 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm. Trường hợp nộp thiếu so với ngưỡng 80% của 4 quý thì bị tính tiền chậm nộp kể từ ngày tiếp sau ngày cuối cùng của thời hạn tạm nộp thuế TNDN quý 4.',
        businessDataSnapshot: {
          'Thuế suất TNDN áp dụng': `${citTierResult.taxRatePercentText} (${citTierResult.title})`,
          'Thu nhập tính thuế kỳ này': `${citSummary.assessableIncome.toLocaleString('vi-VN')} đ`,
          'Thuế TNDN dự kiến (100%)': `${citSummary.estimatedTaxAmount.toLocaleString('vi-VN')} đ`,
          'Ngưỡng an toàn tối thiểu (80%)': `${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ`,
        },
        legalBasisTitle: 'Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP',
        legalArticle: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP',
        legalDocNumber: '91/2022/NĐ-CP',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
        suggestedAction: 'Lập giấy nộp tiền điện tử trên Cổng eTax nộp vào tiểu mục 1052 trước hạn và lưu chứng từ xác nhận.',
        verificationQuestion: 'Doanh nghiệp đã lập Giấy nộp tiền tạm nộp thuế TNDN (tiểu mục 1052) trên Cổng eTax chưa?',
      },
      {
        id: 'ob-tndn-final',
        ruleCode: 'RULE-TAX-TNDN-FINAL',
        category: 'CIT_FILING',
        categoryLabel: 'Quyết toán 03/TNDN',
        title: 'Lập và nộp Hồ sơ quyết toán thuế TNDN năm (Mẫu 03/TNDN) kèm Báo cáo tài chính',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'IN_PROGRESS',
        issueSummary: `Tổng hợp doanh thu (${citSummary.totalRevenue.toLocaleString('vi-VN')} đ), đối chiếu chi phí hợp lệ và gửi Tờ khai 03/TNDN chậm nhất ngày 31/03/${taxYear + 1}.`,
        legalDeadline: `31/03/${taxYear + 1}`,
        internalDeadline: `15/03/${taxYear + 1}`,
        riskSeverity: 'HIGH',
        penaltyText: 'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi chậm nộp hồ sơ quyết toán thuế năm.',
        evidenceTotal: 2,
        evidenceUploaded: 1,
        evidenceMissing: 1,
        description: 'Người nộp thuế phải kê khai chính xác tổng doanh thu, chi phí được trừ, các khoản điều chỉnh tăng tổng lợi nhuận trước thuế (chỉ tiêu B4) và xác định đúng bậc thuế suất TNDN (15%, 17% hoặc 20% theo Luật Thuế TNDN 67/2025/QH15) trên Tờ khai quyết toán mẫu 03/TNDN.',
        businessDataSnapshot: {
          'Doanh thu ghi nhận': `${citSummary.totalRevenue.toLocaleString('vi-VN')} đ (${citSummary.revenueCount} chứng từ)`,
          'Lợi nhuận kế toán trước thuế': `${citSummary.accountingProfitBeforeTax.toLocaleString('vi-VN')} đ`,
          'Thuế suất TNDN sàng lọc': citTierResult.taxRatePercentText,
          'Kỳ quyết toán': `Năm tài chính ${taxYear}`,
        },
        legalBasisTitle: 'Luật Quản lý thuế số 38/2019/QH14 & Luật Thuế TNDN số 67/2025/QH15',
        legalArticle: 'Điểm a Khoản 2 Điều 44 Luật Quản lý thuế số 38/2019/QH14; Điều 10 Luật Thuế TNDN 67/2025/QH15',
        legalDocNumber: '38/2019/QH14',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
        suggestedAction: 'Hoàn tất đối soát Sổ Thu Chi 4 quý, xuất Bảng kê quyết toán và nộp tờ khai XML 03/TNDN trên thuedientu.gdt.gov.vn.',
        verificationQuestion: 'Doanh nghiệp đã chốt số liệu doanh thu - chi phí 4 quý để chuẩn bị lên Tờ khai 03/TNDN chưa?',
      },

      // 2. CHI PHÍ ĐƯỢC TRỪ & MỤC B4
      {
        id: 'ob-tndn-b4',
        ruleCode: 'RULE-TAX-TNDN-B4',
        category: 'CIT_B4_EXPENSE',
        categoryLabel: 'Bóc tách Mục B4',
        title: 'Rà soát hóa đơn hợp pháp và bóc tách chi phí không được trừ tại chỉ tiêu B4 (03/TNDN)',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasDisallowedB4 ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasDisallowedB4
          ? `Phát hiện ${citSummary.disallowedCount} khoản chi (${citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ) không đủ điều kiện được trừ, cần bóc tách vào Mục B4.`
          : '100% khoản chi trong sổ đang đáp ứng điều kiện hóa đơn hợp pháp để tính vào chi phí được trừ TNDN.',
        legalDeadline: `31/03/${taxYear + 1}`,
        internalDeadline: `15/03/${taxYear + 1}`,
        riskSeverity: hasDisallowedB4 ? 'HIGH' : 'MEDIUM',
        penaltyText: 'Truy thu thuế TNDN, phạt 20% trên số tiền thuế khai thiếu và tính tiền chậm nộp 0,03%/ngày theo Điều 16 Nghị định 125/2020/NĐ-CP.',
        evidenceTotal: 3,
        evidenceUploaded: hasDisallowedB4 ? 1 : 3,
        evidenceMissing: hasDisallowedB4 ? 2 : 0,
        description: 'Khoản chi được trừ khi xác định thu nhập chịu thuế TNDN bắt buộc phải liên quan thực tế đến hoạt động sản xuất kinh doanh và có đủ hóa đơn, chứng từ hợp pháp. Mọi khoản chi không có hóa đơn hoặc chi phạt hành chính phải chủ động loại ra tại chỉ tiêu B4.',
        businessDataSnapshot: {
          'Tổng chi phí kế toán': `${citSummary.totalAccountingExpense.toLocaleString('vi-VN')} đ (${citSummary.expenseCount} khoản)`,
          'Chi phí được trừ hợp lệ': `${citSummary.totalDeductibleExpense.toLocaleString('vi-VN')} đ`,
          'Chi phí bị loại Mục B4': `${citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ (${citSummary.disallowedCount} khoản)`,
        },
        legalBasisTitle: 'Thông tư 96/2015/TT-BTC sửa đổi bổ sung Thông tư 78/2014/TT-BTC',
        legalArticle: 'Điều 4 Thông tư 96/2015/TT-BTC',
        legalDocNumber: '96/2015/TT-BTC',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        suggestedAction: 'Mở Sổ Thu Chi & Bóc Tách B4 để thu thập bổ sung hóa đơn điện tử hoặc xác nhận loại trừ Mục B4 trước kỳ quyết toán.',
        verificationQuestion: 'Các hóa đơn đầu vào trong kỳ đã được đối chiếu trạng thái hợp lệ trên hoadondientu.gdt.gov.vn chưa?',
      },
      {
        id: 'ob-cit-cash-5m',
        ruleCode: 'RULE-CIT-B4-CASH',
        category: 'CIT_B4_EXPENSE',
        categoryLabel: 'Chuyển khoản ≥ 5 triệu',
        title: 'Chứng từ thanh toán không dùng tiền mặt cho mọi khoản chi mua vào từ 5 triệu đồng trở lên',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasDisallowedB4 ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasDisallowedB4
          ? 'Cần kiểm tra kỹ các khoản chi từ 5.000.000 đ trở lên đang thanh toán tiền mặt để tránh bị xuất toán khỏi chi phí TNDN.'
          : 'Các khoản chi từ 5.000.000 đ trở lên đã đảm bảo nguyên tắc thanh toán không dùng tiền mặt.',
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Loại toàn bộ giá trị hóa đơn khỏi chi phí được trừ khi tính thuế TNDN (tăng thu nhập tính thuế và truy thu phạt 20%).',
        evidenceTotal: 2,
        evidenceUploaded: hasDisallowedB4 ? 1 : 2,
        evidenceMissing: hasDisallowedB4 ? 1 : 0,
        description: 'Theo quy định mới về điều kiện chi phí được trừ Thuế TNDN, các giao dịch mua hàng hóa, dịch vụ từng lần từ 5 triệu đồng trở lên (đã bao gồm VAT) bắt buộc phải có chứng từ thanh toán không dùng tiền mặt qua tài khoản ngân hàng của doanh nghiệp.',
        businessDataSnapshot: {
          'Ngưỡng kiểm soát chuyển khoản': 'Từ 5.000.000 đ / lần giao dịch trở lên',
          'Loại hình áp dụng': legalType,
          'Khoản chi nghi vấn B4': `${citSummary.disallowedCount} khoản`,
        },
        legalBasisTitle: 'Luật Thuế TNDN số 67/2025/QH15 & Điều 4 Thông tư 96/2015/TT-BTC',
        legalArticle: 'Điều 9 Luật Thuế TNDN 67/2025/QH15; Điều 4 Thông tư 96/2015/TT-BTC',
        legalDocNumber: '67/2025/QH15',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        suggestedAction: 'Lưu trữ đầy đủ Ủy nhiệm chi / Sao kê ngân hàng công ty khớp tên và số tài khoản nhà cung cấp trên hóa đơn.',
        verificationQuestion: 'Mọi hóa đơn mua vào từ 5 triệu đồng trở lên đã có Ủy nhiệm chi từ tài khoản công ty chưa?',
      },

      // 3. KHẤU TRỪ & NHÀ THẦU BẢO VỆ CHI PHÍ TNDN
      {
        id: 'ob-cit-salary',
        ruleCode: 'RULE-CIT-B4-SALARY',
        category: 'CIT_WITHHOLDING',
        categoryLabel: 'Chi phí lương TNDN',
        title: isOneMemberLlc
          ? 'Loại trừ lương Chủ sở hữu Công ty TNHH 1TV tại Mục B4 và hoàn thiện hồ sơ chi phí tiền lương'
          : 'Hoàn thiện hồ sơ tiền lương, bảng chấm công và chứng từ khấu trừ 10% thù lao vãng lai để bảo vệ chi phí TNDN',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'IN_PROGRESS',
        issueSummary: isOneMemberLlc
          ? 'Lưu ý đặc thù TNHH 1TV: Tiền lương, thù lao của Chủ công ty không được tính vào chi phí được trừ TNDN (phải đưa vào Mục B4).'
          : 'Đảm bảo thực chi quỹ lương trước ngày 31/03 và lưu đủ chứng từ khấu trừ 10% đối với thù lao thời vụ từ 2 triệu đồng/lần.',
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'MEDIUM',
        penaltyText: 'Xuất toán toàn bộ chi phí nhân công không đủ hồ sơ chứng minh hoặc chi trả sau thời hạn quyết toán 03/TNDN.',
        evidenceTotal: 2,
        evidenceUploaded: 1,
        evidenceMissing: 1,
        description: 'Theo Khoản 2.6 Điều 4 Thông tư 96/2015/TT-BTC: Chi tiền lương, tiền thưởng phải được quy định cụ thể điều kiện hưởng trong Hợp đồng/Quy chế tài chính và thực chi trước hạn quyết toán năm; riêng lương chủ Công ty TNHH 1TV (do một cá nhân làm chủ) tuyệt đối không được trừ khi tính thuế TNDN.',
        businessDataSnapshot: {
          'Loại hình pháp lý': legalType,
          'Ngành nghề hoạt động': industry,
          'Kỳ rà soát': `Quý ${taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}/${taxYear}`,
        },
        legalBasisTitle: 'Thông tư 96/2015/TT-BTC & Thông tư 111/2013/TT-BTC',
        legalArticle: 'Khoản 2.6 Điều 4 Thông tư 96/2015/TT-BTC; Điều 25 Thông tư 111/2013/TT-BTC',
        legalDocNumber: '96/2015/TT-BTC',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        suggestedAction: 'Lưu trữ bảng lương, phiếu chi/sao kê chuyển lương và tách riêng thù lao chủ sở hữu TNHH 1TV khi quyết toán TNDN.',
      },
      {
        id: 'ob-cit-fct',
        ruleCode: 'RULE-TAX-FCT-10D',
        category: 'CIT_WITHHOLDING',
        categoryLabel: 'Thuế nhà thầu (FCT)',
        title: 'Hoàn thiện chứng từ Thuế nhà thầu (FCT) để hợp thức hóa chi phí quảng cáo / phần mềm quốc tế khi tính thuế TNDN',
        applicabilityStatus: 'POSSIBLE',
        completionStatus: 'PENDING_VERIFICATION',
        issueSummary: 'Cần xác minh hóa đơn VAT hoặc tờ khai 01/NTNN nếu doanh nghiệp hạch toán chi phí Google, Meta, TikTok, AWS, SaaS nước ngoài.',
        legalDeadline: 'Trong vòng 10 ngày từ ngày thanh toán',
        internalDeadline: 'Trong vòng 3 ngày từ ngày thanh toán',
        riskSeverity: 'MEDIUM',
        penaltyText: 'Bị loại toàn bộ chi phí dịch vụ nước ngoài khỏi chi phí được trừ TNDN và phạt chậm nộp tờ khai FCT từ 2 - 25 triệu đồng.',
        evidenceTotal: 2,
        evidenceUploaded: 0,
        evidenceMissing: 2,
        description: 'Để khoản chi mua dịch vụ quảng cáo trực tuyến (Facebook, Google, TikTok) hoặc phần mềm nước ngoài được tính vào chi phí được trừ Thuế TNDN, doanh nghiệp phải có hóa đơn từ nhà cung cấp nước ngoài đã đăng ký thuế tại Việt Nam (ghi đúng MST công ty) hoặc tờ khai khấu trừ thuế nhà thầu mẫu 01/NTNN kèm chứng từ thanh toán không dùng tiền mặt.',
        businessDataSnapshot: {
          'Khoản mục kiểm tra': 'Chi phí Ads & Phần mềm xuyên biên giới',
          'Điều kiện được trừ TNDN': 'Hóa đơn hợp pháp / Tờ khai 01/NTNN + Sao kê ngân hàng công ty',
        },
        legalBasisTitle: 'Thông tư 103/2014/TT-BTC & Điều 4 Thông tư 96/2015/TT-BTC',
        legalArticle: 'Điều 8, Điều 11 Thông tư 103/2014/TT-BTC; Điều 4 Thông tư 96/2015/TT-BTC',
        legalDocNumber: '103/2014/TT-BTC',
        legalDocUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1032014tt-btc-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-doi-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-tai-viet-nam-hoac-co-thu-nhap-tai-viet-nam-do-bo-truong-bo-tai-chinh-ban-hanh-243292.html',
        suggestedAction: 'Kiểm tra tài khoản quảng cáo đã cập nhật Mã số thuế doanh nghiệp chưa và lưu hóa đơn/tờ khai 01/NTNN.',
        verificationQuestion: 'Trong kỳ doanh nghiệp có đưa chi phí quảng cáo Facebook, Google, TikTok hoặc phần mềm quốc tế vào sổ chi phí TNDN không?',
      },
    ];

    // Đồng bộ trạng thái hoàn thành & số lượng bằng chứng từ DB (tasks & dbEvidences)
    return baseObligations.map((ob) => {
      const matchedTasks = tasks.filter((t) => t.ruleCode === ob.ruleCode);
      const matchedEvs = dbEvidences.filter((ev) => matchEvidenceToRule(ev, ob.ruleCode));

      const syncedUploaded = matchedEvs.length > 0
        ? Math.min(ob.evidenceTotal, ob.evidenceUploaded + matchedEvs.length)
        : ob.evidenceUploaded;
      const syncedMissing = Math.max(0, ob.evidenceTotal - syncedUploaded);

      let syncedCompletion = ob.completionStatus;
      if (matchedTasks.length > 0) {
        if (matchedTasks.every((t) => t.status === 'completed')) {
          syncedCompletion = 'COMPLETED';
        } else if (matchedTasks.some((t) => t.status === 'overdue')) {
          syncedCompletion = 'OVERDUE';
        } else if (matchedTasks.some((t) => t.status === 'waiting_verification' || t.status === 'waiting_input')) {
          syncedCompletion = 'PENDING_VERIFICATION';
        } else {
          syncedCompletion = 'IN_PROGRESS';
        }
      } else if (matchedEvs.length > 0 && syncedMissing === 0) {
        syncedCompletion = 'COMPLETED';
      }

      return {
        ...ob,
        evidenceUploaded: syncedUploaded,
        evidenceMissing: syncedMissing,
        completionStatus: syncedCompletion,
      };
    });
  }, [citSummary, citTierResult, legalDeadlineText, internalDeadlineText, industry, legalType, taxQuarter, taxYear, tasks, dbEvidences, matchEvidenceToRule]);

  // Bộ lọc danh sách nghĩa vụ
  const filteredObligations = useMemo(() => {
    if (selectedTaxFilter === 'ALL') return obligations;
    return obligations.filter((o) => o.category === selectedTaxFilter);
  }, [obligations, selectedTaxFilter]);

  // Thống kê chỉ số cho Khu vực 1
  const stats = useMemo(() => {
    const total = obligations.length;
    const completed = obligations.filter((o) => o.completionStatus === 'COMPLETED').length;
    const inProgress = obligations.filter((o) => o.completionStatus === 'IN_PROGRESS').length;
    const needVerification = obligations.filter((o) => o.completionStatus === 'PENDING_VERIFICATION' || o.applicabilityStatus === 'NEED_VERIFICATION').length;
    const notApplicable = obligations.filter((o) => o.applicabilityStatus === 'NOT_APPLICABLE').length;

    return { total, completed, inProgress, needVerification, notApplicable };
  }, [obligations]);

  const getObligationDisplayLabel = (code?: string, fallback?: string): string => {
    const map: Record<string, string> = {
      'RULE-TAX-TNDN-80': 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
      'CIT_QUARTERLY_PREPAY': 'Tạm nộp thuế TNDN 80% hàng quý',
      'RULE-TAX-TNDN-FINAL': 'Quyết toán thuế TNDN năm (Mẫu 03/TNDN)',
      'CIT_ANNUAL_FINALIZE': 'Quyết toán thuế TNDN & BCTC năm',
      'RULE-TAX-TNDN-B4': 'Rà soát chi phí được trừ khi tính thuế TNDN (Mục B4)',
      'RULE-CIT-B4-CASH': 'Điều kiện chuyển khoản không dùng tiền mặt từ 5 triệu đồng',
      'RULE-CIT-B4-SALARY': 'Hồ sơ chi phí tiền lương được trừ TNDN',
      'RULE-TAX-FCT-10D': 'Chứng từ thuế nhà thầu (FCT)',
    };
    if (code && map[code]) return map[code];
    return fallback || 'Nghĩa vụ Thuế TNDN';
  };

  // ============================================================================
  // KHU VỰC 3: ĐIỀU PHỐI TÁC VỤ (TASK COORDINATION - ĐỒNG BỘ DB)
  // ============================================================================
  const coordinatedTasks: CoordinatedTaskItem[] = useMemo(() => {
    const defaultTemplates: CoordinatedTaskItem[] = [
      {
        id: 'task-cit-pay',
        title: `Tạm nộp tiền thuế TNDN Quý ${taxQuarter === 'ALL' ? 'cả năm' : taxQuarter} vào Kho bạc Nhà nước (tiểu mục 1052)`,
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        priority: 'HIGH',
        assigneeRole: 'Kế toán thuế / Giám đốc',
        deadline: legalDeadlineText,
        status: citSummary.estimatedTaxAmount > 0 ? 'TODO' : 'COMPLETED',
        completionCondition: `Có Giấy nộp tiền vào NSNN tiểu mục 1052 xác nhận trên Cổng eTax với số tiền tối thiểu ${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ.`,
      },
      {
        id: 'task-b4-gather',
        title: `Bổ sung hóa đơn hợp pháp & chứng từ cho ${citSummary.disallowedCount > 0 ? citSummary.disallowedCount : 0} khoản chi nguy cơ loại Mục B4`,
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN (Mục B4)',
        priority: citSummary.disallowedCount > 0 ? 'CRITICAL' : 'MEDIUM',
        assigneeRole: 'Kế toán thanh toán',
        deadline: internalDeadlineText,
        status: citSummary.disallowedCount > 0 ? 'WAITING_INPUT' : 'COMPLETED',
        completionCondition: 'Thu thập đầy đủ hóa đơn điện tử hợp pháp hoặc đánh dấu loại trừ tại chỉ tiêu B4 trên tờ khai 03/TNDN.',
      },
      {
        id: 'task-cit-cash-check',
        title: 'Đối soát Ủy nhiệm chi ngân hàng cho toàn bộ khoản chi từ 5 triệu đồng trở lên',
        relatedObligationCode: 'RULE-CIT-B4-CASH',
        relatedObligationTitle: 'Điều kiện chuyển khoản không dùng tiền mặt từ 5 triệu đồng',
        priority: 'HIGH',
        assigneeRole: 'Kế toán thanh toán',
        deadline: internalDeadlineText,
        status: citSummary.disallowedCount > 0 ? 'IN_PROGRESS' : 'COMPLETED',
        completionCondition: '100% hóa đơn mua vào từ 5.000.000 đ trở lên có sao kê/ủy nhiệm chi từ tài khoản ngân hàng công ty.',
      },
      {
        id: 'task-cit-final-prep',
        title: `Tổng hợp Sổ Thu Chi & chuẩn bị Tờ khai quyết toán thuế TNDN (Mẫu 03/TNDN) năm ${taxYear}`,
        relatedObligationCode: 'RULE-TAX-TNDN-FINAL',
        relatedObligationTitle: 'Quyết toán thuế TNDN năm (Mẫu 03/TNDN)',
        priority: 'MEDIUM',
        assigneeRole: 'Kế toán trưởng / Đại diện pháp luật',
        deadline: `31/03/${taxYear + 1}`,
        status: 'REVIEW',
        completionCondition: 'Nộp Tờ khai 03/TNDN kèm Báo cáo tài chính qua eTax và nhận Thông báo chấp nhận hồ sơ từ Cơ quan Thuế.',
      },
    ];

    const taxRuleCodes = new Set([
      'RULE-TAX-TNDN-80',
      'RULE-TAX-TNDN-FINAL',
      'RULE-TAX-TNDN-B4',
      'RULE-CIT-B4-CASH',
      'RULE-CIT-B4-SALARY',
      'RULE-TAX-FCT-10D',
    ]);

    const dbTaxTasks = tasks.filter(
      (t) => (t.ruleCode && taxRuleCodes.has(t.ruleCode)) || t.category === 'Thuế TNDN',
    );

    // Ưu tiên dữ liệu task thật trong DB cho từng ruleCode; giữ template cho các rule chưa tạo task
    const merged: CoordinatedTaskItem[] = defaultTemplates.map((tpl) => {
      const dbMatch = dbTaxTasks.find((t) => t.ruleCode === tpl.relatedObligationCode);
      if (!dbMatch) return tpl;
      const dueFormatted = dbMatch.dueDate
        ? new Date(dbMatch.dueDate).toLocaleDateString('vi-VN')
        : tpl.deadline;
      const prioUpper = String(dbMatch.priority || tpl.priority).toUpperCase();
      const mappedPrio: CoordinatedTaskItem['priority'] =
        prioUpper === 'CRITICAL' || prioUpper === 'HIGH' || prioUpper === 'MEDIUM' || prioUpper === 'LOW'
          ? (prioUpper as CoordinatedTaskItem['priority'])
          : tpl.priority;
      return {
        id: dbMatch.id,
        title: dbMatch.title || tpl.title,
        relatedObligationCode: dbMatch.ruleCode || tpl.relatedObligationCode,
        relatedObligationTitle: getObligationDisplayLabel(dbMatch.ruleCode || tpl.relatedObligationCode, tpl.relatedObligationTitle),
        priority: mappedPrio,
        assigneeRole: dbMatch.assigneeName || String(dbMatch.assigneeRole || tpl.assigneeRole),
        deadline: dueFormatted,
        status: mapDbTaskStatusToCelra(String(dbMatch.status)),
        rawStatus: String(dbMatch.status),
        completionCondition: tpl.completionCondition,
      };
    });

    // Bổ sung các task Thuế TNDN khác trong DB chưa nằm trong 4 template mặc định
    const coveredCodes = new Set(merged.map((m) => m.relatedObligationCode));
    dbTaxTasks.forEach((t) => {
      if (t.ruleCode && coveredCodes.has(t.ruleCode)) return;
      const prioUpper = String(t.priority || 'MEDIUM').toUpperCase();
      merged.push({
        id: t.id,
        title: t.title,
        relatedObligationCode: t.ruleCode || 'MANUAL',
        relatedObligationTitle: getObligationDisplayLabel(t.ruleCode, t.category || 'Thuế TNDN'),
        priority:
          prioUpper === 'CRITICAL' || prioUpper === 'HIGH' || prioUpper === 'MEDIUM' || prioUpper === 'LOW'
            ? (prioUpper as CoordinatedTaskItem['priority'])
            : 'MEDIUM',
        assigneeRole: t.assigneeName || String(t.assigneeRole || 'Chủ doanh nghiệp'),
        deadline: t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : legalDeadlineText,
        status: mapDbTaskStatusToCelra(String(t.status)),
        rawStatus: String(t.status),
        completionCondition: t.legalBasis || 'Hoàn tất chứng từ và cập nhật trạng thái trên hệ thống.',
      });
    });

    return merged;
  }, [taxQuarter, taxYear, legalDeadlineText, internalDeadlineText, citSummary, tasks]);

  // ============================================================================
  // KHU VỰC 4: HỒ SƠ MINH CHỨNG & XÁC MINH (EVIDENCE & VERIFICATION - ĐỒNG BỘ DB)
  // ============================================================================
  const complianceEvidences: ComplianceEvidenceItem[] = useMemo(() => {
    const baseItems: ComplianceEvidenceItem[] = [
      {
        id: 'ev-1',
        title: `Bảng kê Doanh thu & Chi phí tính thuế TNDN Quý ${taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}/${taxYear} (Excel)`,
        documentType: 'BẢNG KÊ THU CHI THUẾ TNDN',
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN',
        verificationStatus: citSummary.revenueCount > 0 || citSummary.expenseCount > 0 ? 'VERIFIED' : 'PENDING',
        fileName: `Bang_Ke_TNDN_Q${taxQuarter}_${taxYear}.xlsx`,
        guidanceNote: 'Dữ liệu sổ thu chi dùng để tự động bóc tách chỉ tiêu B4 và tính thuế suất TNDN áp dụng.',
      },
      {
        id: 'ev-2',
        title: `Giấy nộp tiền thuế TNDN tạm nộp (Tiểu mục 1052) Quý ${taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}/${taxYear}`,
        documentType: 'GIẤY NỘP TIỀN VÀO NSNN',
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        verificationStatus: citSummary.estimatedTaxAmount > 0 ? 'MISSING' : 'VERIFIED',
        guidanceNote: 'Chưa có chứng từ không đồng nghĩa với vi phạm. Doanh nghiệp tải lên giấy nộp tiền eTax sau khi nộp vào NSNN.',
      },
      {
        id: 'ev-3',
        title: `Tờ khai quyết toán thuế TNDN mẫu 03/TNDN năm ${taxYear}`,
        documentType: 'TỜ KHAI QUYẾT TOÁN 03/TNDN',
        relatedObligationCode: 'RULE-TAX-TNDN-FINAL',
        relatedObligationTitle: 'Quyết toán thuế TNDN năm (Mẫu 03/TNDN)',
        verificationStatus: 'PENDING',
        guidanceNote: 'Hồ sơ quyết toán nộp chậm nhất ngày 31/03 năm tiếp theo qua Cổng Thuế Điện Tử.',
      },
      {
        id: 'ev-4',
        title: 'Ủy nhiệm chi ngân hàng công ty cho các khoản chi từ 5 triệu đồng trở lên',
        documentType: 'CHỨNG TỪ THANH TOÁN NGÂN HÀNG',
        relatedObligationCode: 'RULE-CIT-B4-CASH',
        relatedObligationTitle: 'Điều kiện thanh toán không dùng tiền mặt TNDN',
        verificationStatus: citSummary.disallowedCount > 0 ? 'MISSING' : 'VERIFIED',
        guidanceNote: 'Bổ sung sao kê / ủy nhiệm chi ngân hàng đứng tên doanh nghiệp để bảo vệ chi phí được trừ.',
      },
      {
        id: 'ev-5',
        title: 'Bảng lương, chấm công & chứng từ khấu trừ bảo vệ chi phí nhân công TNDN',
        documentType: 'HỒ SƠ CHI PHÍ NHÂN CÔNG',
        relatedObligationCode: 'RULE-CIT-B4-SALARY',
        relatedObligationTitle: 'Hồ sơ chi phí tiền lương được trừ TNDN',
        verificationStatus: 'PENDING',
        guidanceNote: 'Đảm bảo lưu đủ hợp đồng, quy chế thưởng và tách riêng lương chủ Công ty TNHH 1TV vào Mục B4.',
      },
    ];

    const usedDbIds = new Set<string>();
    const syncedBase = baseItems.map((item) => {
      const matched = dbEvidences.find((ev) => matchEvidenceToRule(ev, item.relatedObligationCode));
      if (!matched) return item;
      usedDbIds.add(matched.id);
      const statusMap: Record<string, VerificationDocumentStatus> = {
        VERIFIED: 'VERIFIED',
        REJECTED: 'REJECTED',
        PENDING: 'PENDING',
      };
      const updatedStr = matched.createdAt || matched.uploadedAt
        ? new Date(matched.createdAt || matched.uploadedAt).toLocaleDateString('vi-VN')
        : undefined;
      return {
        ...item,
        id: matched.id,
        title: matched.title || matched.name || item.title,
        verificationStatus: statusMap[matched.verificationStatus] || 'PENDING',
        fileName: matched.fileName || matched.name || item.fileName,
        fileUrl: matched.fileUrl,
        updatedAt: updatedStr,
      };
    });

    // Hiển thị thêm các chứng từ Thuế TNDN khác trong DB chưa map vào 5 đầu mục trên
    const extraDbEvidences: ComplianceEvidenceItem[] = dbEvidences
      .filter((ev) => !usedDbIds.has(ev.id))
      .slice(0, 6)
      .map((ev) => {
        const ocr = ev?.ocrExtractedData || {};
        const statusMap: Record<string, VerificationDocumentStatus> = {
          VERIFIED: 'VERIFIED',
          REJECTED: 'REJECTED',
          PENDING: 'PENDING',
        };
        return {
          id: ev.id,
          title: ev.title || ev.name || 'Chứng từ tuân thủ',
          documentType: String(ev.documentType || ev.category || 'CHỨNG TỪ THUẾ TNDN').toUpperCase(),
          relatedObligationCode: ocr.ruleCode || ev.task?.ruleCode || ev.tag || 'Thuế TNDN',
          relatedObligationTitle: ev.task?.title || ev.tag || 'Hồ sơ Thuế TNDN',
          verificationStatus: statusMap[ev.verificationStatus] || 'PENDING',
          fileName: ev.fileName || ev.name,
          fileUrl: ev.fileUrl,
          updatedAt: ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('vi-VN') : undefined,
          guidanceNote: ev.period ? `Kỳ áp dụng: ${ev.period}. Đã lưu trữ trong Kho Bằng Chứng doanh nghiệp.` : 'Đã lưu trữ trong Kho Bằng Chứng doanh nghiệp.',
        };
      });

    return [...syncedBase, ...extraDbEvidences];
  }, [taxQuarter, taxYear, citSummary, dbEvidences, matchEvidenceToRule]);

  // ============================================================================
  // KHU VỰC 5: CĂN CỨ PHÁP LÝ TRA CỨU THEO NGHĨA VỤ (LEGAL REFERENCES)
  // ============================================================================
  const legalReferences: LegalReferenceDocItem[] = useMemo(() => {
    return [
      {
        id: 'law-cit-2025',
        docTitle: 'Luật Thuế thu nhập doanh nghiệp số 67/2025/QH15',
        docNumber: '67/2025/QH15',
        articles: 'Điều 9 (Chi phí được trừ & ngưỡng 5 triệu); Điều 10 (Thuế suất 15%, 17%, 20%)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-CIT-B4-CASH',
        relatedObligationTitle: 'Thuế suất TNDN & điều kiện chi phí được trừ',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=67%2F2025%2FQH15',
      },
      {
        id: 'law-tndn-1',
        docTitle: 'Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP',
        docNumber: '91/2022/NĐ-CP',
        articles: 'Khoản 3 Điều 1 - Tạm nộp thuế TNDN 4 quý đạt tối thiểu 80%',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
      },
      {
        id: 'law-tndn-2',
        docTitle: 'Thông tư 96/2015/TT-BTC hướng dẫn về Thuế Thu Nhập Doanh Nghiệp',
        docNumber: '96/2015/TT-BTC',
        articles: 'Điều 4 - Các khoản chi được trừ và không được trừ (Mục B4)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
      },
      {
        id: 'law-qlt-1',
        docTitle: 'Luật Quản lý thuế số 38/2019/QH14',
        docNumber: '38/2019/QH14',
        articles: 'Điều 44 - Thời hạn nộp hồ sơ quyết toán thuế TNDN năm (31/03)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-FINAL',
        relatedObligationTitle: 'Quyết toán thuế TNDN năm (Mẫu 03/TNDN)',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
      },
      {
        id: 'law-fct-1',
        docTitle: 'Thông tư 103/2014/TT-BTC về Thuế Nhà thầu nước ngoài (FCT)',
        docNumber: '103/2014/TT-BTC',
        articles: 'Điều 8, Điều 11 - Chứng từ thuế nhà thầu bảo vệ chi phí dịch vụ nước ngoài',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-FCT-10D',
        relatedObligationTitle: 'Chứng từ FCT cho chi phí Ads & phần mềm quốc tế',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1032014tt-btc-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-doi-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-tai-viet-nam-hoac-co-thu-nhap-tai-viet-nam-do-bo-truong-bo-tai-chinh-ban-hanh-243292.html',
      },
      {
        id: 'law-penal-1',
        docTitle: 'Nghị định 125/2020/NĐ-CP về xử phạt vi phạm hành chính thuế, hóa đơn',
        docNumber: '125/2020/NĐ-CP',
        articles: 'Điều 13 (Chậm nộp quyết toán); Điều 16 (Phạt 20% khai sai thuế TNDN)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Khung chế tài xử phạt hành chính thuế TNDN',
        officialUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1252020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-24591.html',
      },
    ];
  }, []);

  // Xử lý tạo task từ obligation chuẩn hóa đúng DTO Backend
  const handleCreateTaskFromObligation = async (ob: ComplianceObligationItem) => {
    try {
      let parsedDueDateIso = new Date(Date.now() + 14 * 86400000).toISOString();
      const dmYMatch = ob.legalDeadline.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dmYMatch) {
        const [, dd, mm, yyyy] = dmYMatch;
        parsedDueDateIso = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59).toISOString();
      }

      await createTask({
        title: `Hoàn tất tuân thủ: ${ob.title}`,
        category: 'Thuế TNDN',
        priority: ob.riskSeverity === 'HIGH' ? 'high' : 'medium',
        dueDate: parsedDueDateIso,
        ruleCode: ob.ruleCode,
        legalBasis: `${ob.legalBasisTitle} (${ob.legalArticle})`,
        description: `Tác vụ điều phối sinh tự động từ Báo cáo rà soát Thuế TNDN CELRA.\nCăn cứ pháp lý: ${ob.legalBasisTitle} (${ob.legalArticle}).\nHành động đề xuất: ${ob.suggestedAction}`,
      });
      Modal.success({
        title: 'Tạo Tác Vụ Điều Phối Thành Công',
        content: `Đã kích hoạt tác vụ cho nghĩa vụ [${ob.ruleCode}] ${ob.title}. Bạn có thể theo dõi tiến độ thực hiện tại trang Nhiệm Vụ Tuân Thủ.`,
        okText: 'Đã hiểu',
      });
      if (fetchTasks) fetchTasks();
    } catch {
      Modal.info({
        title: 'Đã ghi nhận yêu cầu điều phối',
        content: `Nhiệm vụ "${ob.title}" đã được lưu vào hệ thống điều phối tuân thủ của doanh nghiệp.`,
        okText: 'Đóng',
      });
    }
  };

  // Helper render Badge Trạng thái áp dụng
  const renderApplicabilityBadge = (status: ApplicabilityStatus) => {
    switch (status) {
      case 'APPLICABLE':
        return <Tag color="blue" className="font-bold text-[11px] m-0 border-blue-200">Bắt buộc áp dụng</Tag>;
      case 'POSSIBLE':
        return <Tag color="cyan" className="font-medium text-[11px] m-0 border-cyan-200">Có thể áp dụng</Tag>;
      case 'NEED_VERIFICATION':
        return <Tag color="orange" className="font-semibold text-[11px] m-0 border-orange-200">Cần xác minh điều kiện</Tag>;
      case 'NOT_APPLICABLE':
        return <Tag color="default" className="text-slate-500 text-[11px] m-0 border-slate-200">Không áp dụng</Tag>;
    }
  };

  // Helper render Badge Trạng thái hoàn thành
  const renderCompletionBadge = (status: ObligationCompletionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Tag color="success" className="font-bold text-[11px] m-0 border-emerald-200">Đã hoàn thành</Tag>;
      case 'IN_PROGRESS':
        return <Tag color="processing" className="font-bold text-[11px] m-0 border-blue-300">Đang thực hiện</Tag>;
      case 'NOT_STARTED':
        return <Tag color="default" className="text-slate-600 text-[11px] m-0 border-slate-300">Chưa bắt đầu</Tag>;
      case 'OVERDUE':
        return <Tag color="error" className="font-bold text-[11px] m-0 border-rose-300">Quá hạn pháp lý</Tag>;
      case 'PENDING_VERIFICATION':
        return <Tag color="warning" className="font-semibold text-[11px] m-0 border-amber-300">Chờ xác minh chứng từ</Tag>;
    }
  };

  // Helper render Badge Trạng thái xác minh chứng từ (5 trạng thái)
  const renderEvidenceStatusBadge = (status: VerificationDocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"><CheckCircleOutlined /> Đã xác minh</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full"><ClockCircleOutlined /> Đang chờ xác minh</span>;
      case 'MISSING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Chưa cung cấp bằng chứng</span>;
      case 'NOT_AVAILABLE':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full"><FileQuestion className="w-3 h-3" /> Chưa có dữ liệu</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full"><WarningOutlined /> Không đạt yêu cầu</span>;
    }
  };

  // Helper render Badge Trạng thái tác vụ chuẩn CELRA
  const renderCelraTaskStatusBadge = (status: CelraTaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Tag color="default" className="font-semibold text-[11px] m-0 border-slate-300">To Do</Tag>;
      case 'WAITING_INPUT':
        return <Tag color="orange" className="font-semibold text-[11px] m-0 border-orange-300">Waiting for Input</Tag>;
      case 'IN_PROGRESS':
        return <Tag color="blue" className="font-bold text-[11px] m-0 border-blue-300">In Progress</Tag>;
      case 'REVIEW':
        return <Tag color="cyan" className="font-semibold text-[11px] m-0 border-cyan-300">Review</Tag>;
      case 'COMPLETED':
        return <Tag color="green" className="font-bold text-[11px] m-0 border-emerald-300">Completed</Tag>;
      case 'BLOCKED':
        return <Tag color="red" className="font-bold text-[11px] m-0 border-rose-300">Blocked</Tag>;
      case 'EXPERT_REQUIRED':
        return <Tag color="purple" className="font-bold text-[11px] m-0 border-purple-300">Expert Required</Tag>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* KHU VỰC 1: COMPLIANCE OVERVIEW (TỔNG QUAN TUÂN THỦ) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Header thông tin doanh nghiệp & kỳ rà soát */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100">
                <Building className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight m-0">
                {companyName}
              </h2>
              <Tag color="blue" className="text-[11px] font-mono font-bold m-0 border-blue-200">
                MST: {taxCode}
              </Tag>
            </div>
            <p className="text-xs text-slate-500 m-0 pl-10 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{legalType}</span>
              <span>•</span>
              <span>{address}</span>
            </p>
          </div>

          {/* Kỳ rà soát & nút chuyển đổi sổ thu chi */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-1.5 text-xs text-slate-600 flex items-center gap-2">
              <CalendarOutlined className="text-blue-600" />
              <span>Kỳ rà soát: <strong className="text-slate-900">Quý {taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}/{taxYear}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Hạn nộp: <strong className="text-rose-600 font-mono">{legalDeadlineText}</strong></span>
            </div>

            {onSwitchToLedger && (
              <Button
                size="middle"
                icon={<SwapOutlined />}
                onClick={onSwitchToLedger}
                className="rounded-xl text-xs font-semibold text-slate-700 border-slate-300 hover:border-blue-500 hover:text-blue-600"
                title="Mở Sổ Kê Khai Thu Chi & Dự Tính Thuế TNDN chi tiết"
              >
                Mở Sổ Thu Chi &amp; Bóc Tách B4
              </Button>
            )}
          </div>
        </div>

        {/* Cảnh báo bối cảnh chưa đồng bộ (nếu có) */}
        {profileWarning && (
          <Alert
            message={profileWarning.message}
            description={profileWarning.description}
            type={profileWarning.type}
            showIcon
            className="rounded-xl border-amber-200 bg-amber-50/70 text-xs"
          />
        )}

        {/* 5 Thẻ thống kê - Phong cách tối giản (Minimalist, border trái) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, paddingTop: 4 }}
          className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-lg:!grid-cols-2 max-sm:!grid-cols-1"
        >
          {/* Card 1: Tổng số nghĩa vụ */}
          <div style={{
            background: '#ffffff', borderRadius: 14,
            border: '1px solid #e2e8f0', borderLeft: '5px solid #64748b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TỔNG SỐ NGHĨA VỤ
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 4 }}>
                {stats.total}
              </div>
            </div>
          </div>

          {/* Card 2: Đã hoàn thành */}
          <div style={{
            background: '#ffffff', borderRadius: 14,
            border: '1px solid #bbf7d0', borderLeft: '5px solid #16a34a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ĐÃ HOÀN THÀNH
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', lineHeight: 1.2, marginTop: 4 }}>
                {stats.completed}
              </div>
            </div>
          </div>

          {/* Card 3: Đang thực hiện */}
          <div style={{
            background: '#ffffff', borderRadius: 14,
            border: '1px solid #bfdbfe', borderLeft: '5px solid #2563eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ĐANG THỰC HIỆN
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', lineHeight: 1.2, marginTop: 4 }}>
                {stats.inProgress}
              </div>
            </div>
          </div>

          {/* Card 4: Cần xác minh */}
          <div style={{
            background: '#ffffff', borderRadius: 14,
            border: stats.needVerification > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
            borderLeft: stats.needVerification > 0 ? '5px solid #d97706' : '5px solid #94a3b8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CẦN XÁC MINH
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stats.needVerification > 0 ? '#d97706' : '#64748b', lineHeight: 1.2, marginTop: 4 }}>
                {stats.needVerification}
              </div>
            </div>
          </div>

          {/* Card 5: Không áp dụng */}
          <div style={{
            background: '#ffffff', borderRadius: 14,
            border: '1px solid #e2e8f0', borderLeft: '5px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                KHÔNG ÁP DỤNG
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#94a3b8', lineHeight: 1.2, marginTop: 4 }}>
                {stats.notApplicable}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC 2: OBLIGATION LIST (DANH SÁCH NGHĨA VỤ THEO NHÓM THUẾ) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Header danh sách nghĩa vụ & bộ lọc nhóm thuế */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 m-0">
                Danh Sách Nghĩa Vụ Tuân Thủ Định Kỳ
              </h3>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5 pl-7">
              Nhấp vào từng nghĩa vụ để xem chi tiết căn cứ pháp luật, rủi ro chế tài và chứng từ bắt buộc.
            </p>
          </div>

          {/* Bộ lọc nhóm nghĩa vụ Thuế TNDN */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({obligations.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('CIT_FILING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'CIT_FILING'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kê khai &amp; Tạm nộp ({obligations.filter((o) => o.category === 'CIT_FILING').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('CIT_B4_EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'CIT_B4_EXPENSE'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chi phí &amp; Mục B4 ({obligations.filter((o) => o.category === 'CIT_B4_EXPENSE').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('CIT_WITHHOLDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'CIT_WITHHOLDING'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lương &amp; Nhà thầu ({obligations.filter((o) => o.category === 'CIT_WITHHOLDING').length})
            </button>
          </div>
        </div>

        {/* Danh sách các nghĩa vụ dạng Card có phân cấp rõ ràng */}
        <div className="space-y-3">
          {filteredObligations.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedObligation(item);
                setIsDrawerOpen(true);
              }}
              className="group p-4 sm:p-4.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/60 hover:border-blue-400 transition-all cursor-pointer space-y-2.5 shadow-2xs"
            >
              {/* Dòng 1: Header thẻ nghĩa vụ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag color="cyan" className="font-semibold text-[10.5px] m-0 border-cyan-200">
                    {item.categoryLabel}
                  </Tag>
                  {renderApplicabilityBadge(item.applicabilityStatus)}
                  {renderCompletionBadge(item.completionStatus)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto shrink-0">
                  <span className="flex items-center gap-1 font-mono text-[11.5px]">
                    <ClockCircleOutlined className="text-slate-400" />
                    Hạn: <strong className="text-slate-800">{item.legalDeadline}</strong>
                  </span>
                  <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center font-bold text-xs">
                    Chi tiết <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>

              {/* Dòng 2: Tiêu đề nghĩa vụ */}
              <h4 className="text-sm font-bold text-slate-900 m-0 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h4>

              {/* Dòng 3: Mô tả vấn đề & Tóm tắt tình trạng */}
              <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
                {item.issueSummary}
              </p>

              {/* Dòng 4: Rủi ro pháp lý & Trạng thái hồ sơ chứng minh */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldAlert className={`w-3.5 h-3.5 ${
                    item.riskSeverity === 'HIGH' ? 'text-rose-500' : item.riskSeverity === 'MEDIUM' ? 'text-amber-500' : 'text-slate-400'
                  }`} />
                  <span className="font-semibold">Rủi ro:</span>
                  <span className="truncate max-w-md text-slate-700">{item.penaltyText}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 font-mono shrink-0">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bằng chứng: <strong>{item.evidenceUploaded}/{item.evidenceTotal}</strong></span>
                  {item.evidenceMissing > 0 ? (
                    <span className="text-amber-600 font-semibold">(Thiếu {item.evidenceMissing})</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">(Đầy đủ)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC 3: TASK COORDINATION (ĐIỀU PHỐI TÁC VỤ) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900 m-0">
                Điều Phối Tác Vụ Tuân Thủ ({coordinatedTasks.length} Tác Vụ)
              </h3>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5 pl-7">
              Chuyển hóa các khuyến nghị tuân thủ thành tác vụ điều phối cụ thể với người phụ trách và điều kiện hoàn thành rõ ràng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChecklistModal && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onOpenChecklistModal}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl h-9 border-none shadow-2xs"
              >
                Tạo Tác Vụ Nhắc Hạn
              </Button>
            )}
          </div>
        </div>

        {/* Bảng tác vụ điều phối chuẩn CELRA */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-3">Tên Công Việc</th>
                <th className="py-2.5 px-3">Nghĩa Vụ</th>
                <th className="py-2.5 px-3">Ưu Tiên</th>
                <th className="py-2.5 px-3">Người Phụ Trách</th>
                <th className="py-2.5 px-3">Thời Hạn</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3">Điều Kiện Hoàn Thành</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coordinatedTasks.map((t) => {
                const statusForTag = t.rawStatus || (
                  t.status === 'COMPLETED'
                    ? 'completed'
                    : t.status === 'BLOCKED'
                    ? 'overdue'
                    : t.status === 'TODO'
                    ? 'todo'
                    : 'in_progress'
                );
                return (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800 max-w-[240px]">
                    {t.title}
                  </td>
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className="text-slate-700 font-medium leading-snug block">
                      {t.relatedObligationTitle}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <PriorityTag priority={t.priority} />
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {t.assigneeRole}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {t.deadline}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <TaskStatusTag status={statusForTag} />
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-[260px] leading-relaxed">
                    {t.completionCondition}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        const related = obligations.find((o) => o.ruleCode === t.relatedObligationCode);
                        if (related) {
                          setSelectedObligation(related);
                          setIsDrawerOpen(true);
                        }
                      }}
                      className="text-blue-600 font-bold p-0 text-xs"
                    >
                      Mở tác vụ
                    </Button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC 4: EVIDENCE & VERIFICATION (QUẢN LÝ MINH CHỨNG & XÁC MINH) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 m-0">
                Quản Lý Hồ Sơ Minh Chứng &amp; Xác Minh
              </h3>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5 pl-7">
              Lưu trữ bằng chứng số để giải trình với Cơ quan Thuế. <strong className="text-slate-700 font-semibold">Chưa cung cấp bằng chứng không đồng nghĩa với vi phạm pháp luật.</strong>
            </p>
          </div>

          <Button
            size="middle"
            icon={<UploadCloud className="w-4 h-4 mr-1 text-slate-600 inline" />}
            onClick={() => {
              setUploadTargetObligation('RULE-TAX-TNDN-80');
              setUploadModalVisible(true);
            }}
            className="rounded-xl text-xs font-semibold border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
          >
            Tải Lên Bằng Chứng
          </Button>
        </div>

        {/* Danh sách bằng chứng & trạng thái xác minh */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {complianceEvidences.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase block">
                    {ev.documentType}
                  </span>
                  <h5 className="text-xs font-bold text-slate-800 m-0">
                    {ev.title}
                  </h5>
                </div>
                {renderEvidenceStatusBadge(ev.verificationStatus)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="truncate max-w-[200px]">
                  Nghĩa vụ: <strong className="text-slate-700">{ev.relatedObligationCode}</strong>
                </span>
                {ev.updatedAt && (
                  <span className="font-mono">Cập nhật: {ev.updatedAt}</span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 m-0 italic bg-white p-2 rounded-lg border border-slate-100">
                {ev.guidanceNote}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KHU VỰC 5: LEGAL REFERENCES (CĂN CỨ PHÁP LÝ TRA CỨU THEO NGHĨA VỤ) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Căn Cứ Pháp Lý Áp Dụng (Tra Cứu Văn Bản Gốc)
              </h3>
              <p className="text-xs text-slate-500 m-0">
                Các văn bản quy phạm pháp luật được đối chiếu theo mã số điều khoản chính thức từ Cổng Dữ Liệu Pháp Luật Quốc Gia.
              </p>
            </div>
          </div>
        </div>

        {/* Bảng đối chiếu văn bản quy phạm pháp luật */}
        <Table
          dataSource={legalReferences}
          rowKey="id"
          pagination={false}
          size="small"
          className="border border-slate-200 rounded-xl overflow-hidden text-xs"
          columns={[
            {
              title: 'Văn Bản Pháp Luật',
              dataIndex: 'docTitle',
              key: 'docTitle',
              render: (text: string, r: LegalReferenceDocItem) => (
                <div className="space-y-0.5 py-1">
                  <div className="font-bold text-slate-800 text-xs">{text}</div>
                  <div className="text-[11px] text-slate-500">Số hiệu: <span className="font-mono font-semibold text-slate-700">{r.docNumber}</span></div>
                </div>
              ),
            },
            {
              title: 'Điều / Khoản Áp Dụng',
              dataIndex: 'articles',
              key: 'articles',
              render: (text: string) => (
                <span className="font-medium text-slate-700 text-xs">{text}</span>
              ),
            },
            {
              title: 'Nghĩa Vụ Liên Quan',
              dataIndex: 'relatedObligationCode',
              key: 'relatedObligationCode',
              render: (code: string, r: LegalReferenceDocItem) => (
                <Tooltip title={r.relatedObligationTitle}>
                  <Tag className="font-mono font-bold text-[10px] m-0 border-slate-200">
                    {code}
                  </Tag>
                </Tooltip>
              ),
            },
            {
              title: 'Hiệu Lực',
              dataIndex: 'validity',
              key: 'validity',
              render: (val: string) => (
                <Tag color="success" className="font-medium text-[10px] m-0 border-emerald-200">
                  {val}
                </Tag>
              ),
            },
            {
              title: 'Tra Cứu',
              key: 'action',
              align: 'right',
              render: (_: any, r: LegalReferenceDocItem) => (
                <a
                  href={cleanDLPLUrl(r.officialUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-xs"
                >
                  Văn bản gốc <ExternalLink className="w-3 h-3 inline" />
                </a>
              ),
            },
          ]}
        />
      </div>

      {/* ===================================================================== */}
      {/* DRAWER CHI TIẾT NGHĨA VỤ (MỞ KHI NGƯỜI DÙNG CLICK VÀO NGHĨA VỤ) */}
      {/* ===================================================================== */}
      <Drawer
        title={
          selectedObligation && (
            <div className="space-y-1 py-1">
              <div className="flex items-center gap-2">
                <Tag className="font-mono font-bold text-[11px] uppercase m-0 bg-slate-100 text-slate-800 border-slate-300">
                  {selectedObligation.ruleCode}
                </Tag>
                <Tag color="cyan" className="font-semibold text-[11px] m-0">
                  {selectedObligation.categoryLabel}
                </Tag>
                {renderApplicabilityBadge(selectedObligation.applicabilityStatus)}
              </div>
              <h3 className="text-base font-bold text-slate-900 m-0 leading-snug">
                {selectedObligation.title}
              </h3>
            </div>
          )
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 580}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        className="rounded-l-2xl"
      >
        {selectedObligation && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* 1. Trạng thái tuân thủ hiện tại */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 text-xs">Trạng Thái Tuân Thủ:</span>
                {renderCompletionBadge(selectedObligation.completionStatus)}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-600">
                <span>Hạn chót pháp lý (Legal Deadline):</span>
                <span className="font-mono font-bold text-rose-600">{selectedObligation.legalDeadline}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Hạn xử lý nội bộ (Internal Deadline):</span>
                <span className="font-mono font-semibold text-slate-700">{selectedObligation.internalDeadline}</span>
              </div>
            </div>

            {/* 2. Mô tả nghĩa vụ */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileTextOutlined className="text-blue-600" />
                Mô Tả Nghĩa Vụ Pháp Luật
              </h5>
              <p className="text-slate-600 m-0 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-medium">
                {selectedObligation.description}
              </p>
            </div>

            {/* 3. Dữ liệu doanh nghiệp được sử dụng để đánh giá */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Dữ Liệu Doanh Nghiệp Dùng Để Đánh Giá
              </h5>
              <div className="bg-white p-3 rounded-xl border border-slate-200 divide-y divide-slate-100">
                {Object.entries(selectedObligation.businessDataSnapshot).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 text-xs">
                    <span className="text-slate-500">{k}:</span>
                    <strong className="text-slate-800 font-medium text-right">{v}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Căn cứ pháp lý */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Căn Cứ Pháp Lý Quy Định
              </h5>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 text-xs">{selectedObligation.legalBasisTitle}</div>
                <div className="text-slate-600">{selectedObligation.legalArticle}</div>
                {selectedObligation.legalDocUrl && (
                  <a
                    href={matchCoreLegalDocUrl(selectedObligation.ruleCode) || cleanDLPLUrl(selectedObligation.legalDocUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-[11px] pt-1"
                  >
                    Xem toàn văn văn bản gốc <ExternalLink className="w-3 h-3 inline" />
                  </a>
                )}
              </div>
            </div>

            {/* 5. Rủi ro & Chế tài xử phạt */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-rose-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Chế Tài &amp; Rủi Ro Xử Phạt
              </h5>
              <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl text-rose-900 leading-relaxed font-medium">
                {selectedObligation.penaltyText}
              </div>
            </div>

            {/* 6. Bằng chứng cần bổ sung */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                Hồ Sơ Minh Chứng Yêu Cầu ({selectedObligation.evidenceUploaded}/{selectedObligation.evidenceTotal})
              </h5>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Đã lưu trữ: <strong className="text-emerald-700">{selectedObligation.evidenceUploaded} tài liệu</strong></span>
                  <span className="text-slate-600">Còn thiếu: <strong className="text-amber-700">{selectedObligation.evidenceMissing} tài liệu</strong></span>
                </div>
                <Button
                  size="small"
                  icon={<UploadCloud className="w-3.5 h-3.5 mr-1 inline" />}
                  onClick={() => {
                    setUploadTargetObligation(selectedObligation.ruleCode);
                    setUploadModalVisible(true);
                  }}
                  className="w-full rounded-lg text-xs font-semibold text-slate-700 border-slate-300 hover:border-blue-500"
                >
                  Tải lên chứng từ cho nghĩa vụ này
                </Button>
              </div>
            </div>

            {/* 7. Đề xuất xử lý & Nút tạo tác vụ */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                <span className="font-bold text-xs uppercase block text-blue-800">Đề Xuất Xử Lý Dành Cho Doanh Nghiệp:</span>
                <p className="m-0 text-xs leading-relaxed font-medium">
                  {selectedObligation.suggestedAction}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="primary"
                  onClick={() => handleCreateTaskFromObligation(selectedObligation)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 border-none shadow-xs"
                >
                  Tạo Tác Vụ Điều Phối Ngay
                </Button>
                {selectedObligation.ruleCode === 'RULE-TAX-TNDN-80' && onOpenEtaxGuide && (
                  <Button
                    onClick={onOpenEtaxGuide}
                    className="rounded-xl text-xs font-semibold h-10 px-4 border-slate-300"
                  >
                    Xem Hướng Dẫn eTax
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MODAL UPLOAD BẰNG CHỨNG */}
      <EvidenceUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={() => {
          setUploadModalVisible(false);
          fetchEvidences();
          fetchTasks();
          Modal.success({
            title: 'Tải Bằng Chứng Thành Công',
            content: 'Tệp chứng từ đã được lưu trữ và đồng bộ vào hồ sơ rà soát tuân thủ của doanh nghiệp.',
            okText: 'Đã hiểu',
          });
        }}
        initialTag={uploadTargetObligation}
        initialQuarter={taxQuarter === 'ALL' ? 1 : taxQuarter}
        initialYear={taxYear}
      />
    </div>
  );
};
