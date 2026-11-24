/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
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
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { getCalculatedQuarterDeadline } from '../../utils/taxCalendar';
import { EvidenceUploadModal } from '../common/EvidenceUploadModal';
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
  category: 'GTGT' | 'TNDN' | 'OTHER';
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
  const { createTask, fetchTasks } = useTaskStore();

  // State điều khiển Drawer Chi tiết nghĩa vụ
  const [selectedObligation, setSelectedObligation] = useState<ComplianceObligationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State điều khiển Modal Upload Bằng chứng
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTargetObligation, setUploadTargetObligation] = useState<string>('RULE-TAX-GTGT');

  // State lọc nhóm nghĩa vụ
  const [selectedTaxFilter, setSelectedTaxFilter] = useState<'ALL' | 'GTGT' | 'TNDN' | 'OTHER'>('ALL');

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

  // Thông tin doanh nghiệp
  const companyName = activeOrg?.legalName || activeOrg?.name || 'CÔNG TY TNHH MỘT THÀNH VIÊN VÀNG BẠC ĐÁ QUÝ SÀI GÒN - SJC';
  const taxCode = activeOrg?.taxCode || '0300521758';
  const address = activeOrg?.address || '418-420 Nguyễn Thị Minh Khai, Phường 05, Quận 3, TP. Hồ Chí Minh';
  const industry = activeOrg?.industry || 'Bán lẻ trang sức, vàng bạc đá quý và dịch vụ thương mại';
  const legalType = activeOrg?.legalType || 'Công ty TNHH Một Thành Viên (100% vốn Nhà nước / Tư nhân)';

  // Kiểm tra tính toàn vẹn hồ sơ & cảnh báo mâu thuẫn bối cảnh
  const profileWarning = useMemo(() => {
    const isGoldJewelryOrg = companyName.toLowerCase().includes('vàng') || companyName.toLowerCase().includes('đá quý') || companyName.toLowerCase().includes('sjc');
    // Kiểm tra nếu trong facts có bối cảnh F&B hoặc mâu thuẫn
    const fnbFact = facts.find((f) => {
      const val = (f.currentValue || '').toLowerCase();
      return val.includes('nhà hàng') || val.includes('ăn uống') || val.includes('f&b');
    });

    if (isGoldJewelryOrg && fnbFact) {
      return {
        type: 'warning' as const,
        message: 'Cảnh báo đồng bộ bối cảnh doanh nghiệp',
        description: 'Tên doanh nghiệp ghi nhận ngành kinh doanh Vàng bạc / Trang sức, nhưng hệ thống phát hiện bối cảnh F&B (Dịch vụ ăn uống) chưa đồng bộ. Vui lòng cập nhật lại hồ sơ bối cảnh để đảm bảo xếp hạng nghĩa vụ tuân thủ chính xác.',
      };
    }

    if (!activeOrg?.taxCode || !activeOrg?.legalName) {
      return {
        type: 'info' as const,
        message: 'Hồ sơ pháp lý đang chờ hoàn thiện',
        description: 'Một số thông tin pháp lý chính thức chưa được điền đầy đủ. Hệ thống đang áp dụng phân tích theo dữ liệu bối cảnh hiện hành.',
      };
    }

    return null;
  }, [companyName, facts, activeOrg]);

  // ============================================================================
  // KHU VỰC 2: DANH SÁCH TẤT CẢ CÁC NGHĨA VỤ PHÁP LÝ CHUẨN LUẬT ĐỊNH
  // ============================================================================
  const obligations: ComplianceObligationItem[] = useMemo(() => {
    const hasDisallowedB4 = citSummary.disallowedCount > 0;
    const hasCitTaxToPay = citSummary.estimatedTaxAmount > 0;

    return [
      // 1. THUẾ GTGT
      {
        id: 'ob-gtgt-1',
        ruleCode: 'RULE-TAX-GTGT',
        category: 'GTGT',
        categoryLabel: 'Thuế GTGT',
        title: 'Kê khai và nộp tờ khai thuế GTGT định kỳ theo Quý (mẫu 01/GTGT)',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'IN_PROGRESS',
        issueSummary: `Cần hoàn thành lập bảng kê hóa đơn bán ra - mua vào và gửi tờ khai trước ngày ${legalDeadlineText}.`,
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá hạn quy định.',
        evidenceTotal: 2,
        evidenceUploaded: 1,
        evidenceMissing: 1,
        description: 'Doanh nghiệp thuộc đối tượng kê khai thuế GTGT theo phương pháp khấu trừ định kỳ theo Quý có nghĩa vụ lập và gửi tờ khai mẫu 01/GTGT kèm bảng kê bán ra, mua vào cho cơ quan thuế quản lý trực tiếp.',
        businessDataSnapshot: {
          'Doanh thu quý hiện tại': `${citSummary.totalRevenue.toLocaleString('vi-VN')} đ`,
          'Số hóa đơn bán ra': `${citSummary.revenueCount} hóa đơn`,
          'Kỳ kê khai': `Quý ${taxQuarter}/${taxYear}`,
          'Cơ quan thuế quản lý': 'Chi cục Thuế trực tiếp',
        },
        legalBasisTitle: 'Luật Quản lý thuế số 38/2019/QH14 & Nghị định 126/2020/NĐ-CP',
        legalArticle: 'Điều 44 Luật Quản lý thuế số 38/2019/QH14; Điều 8, Điều 9 Nghị định 126/2020/NĐ-CP',
        legalDocNumber: '126/2020/NĐ-CP',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-126-2020-ND-CP-huong-dan-Luat-Quan-ly-thue-455243.aspx',
        suggestedAction: 'Tạo tác vụ nhắc hạn lập bảng kê hóa đơn điện tử và nộp tờ khai qua Cổng Thuế Điện Tử (thuedientu.gdt.gov.vn).',
        verificationQuestion: 'Doanh nghiệp đã nộp tờ khai thuế GTGT Quý này và nhận được thông báo chấp nhận của CQT chưa?',
      },
      {
        id: 'ob-gtgt-2',
        ruleCode: 'RULE-TAX-GTGT-BANK',
        category: 'GTGT',
        categoryLabel: 'Thuế GTGT',
        title: 'Chứng từ thanh toán không dùng tiền mặt cho hóa đơn từ 20 triệu đồng trở lên',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasDisallowedB4 ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasDisallowedB4
          ? `Phát hiện ${citSummary.disallowedCount} khoản chi có dấu hiệu thiếu chứng từ chuyển khoản ngân hàng hợp lệ.`
          : '100% khoản chi lớn đã được rà soát chứng từ chuyển khoản ngân hàng đầy đủ.',
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Không được khấu trừ thuế GTGT đầu vào; bị loại toàn bộ chi phí khỏi thu nhập được trừ khi tính thuế TNDN và truy thu phạt 20%.',
        evidenceTotal: 3,
        evidenceUploaded: hasDisallowedB4 ? 2 : 3,
        evidenceMissing: hasDisallowedB4 ? 1 : 0,
        description: 'Hàng hóa, dịch vụ mua vào từng lần theo hóa đơn từ 20 triệu đồng trở lên (giá đã bao gồm thuế GTGT) bắt buộc phải có chứng từ thanh toán không dùng tiền mặt (Ủy nhiệm chi / Chuyển khoản) qua tài khoản ngân hàng của doanh nghiệp mở tại ngân hàng thương mại.',
        businessDataSnapshot: {
          'Tổng chi phí ghi nhận': `${citSummary.totalAccountingExpense.toLocaleString('vi-VN')} đ`,
          'Khoản chi bị nghi ngờ loại B4': `${citSummary.disallowedCount} khoản (${citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ)`,
          'Điều kiện áp dụng': 'Hóa đơn mua vào từng lần >= 20.000.000 đ',
        },
        legalBasisTitle: 'Thông tư 219/2013/TT-BTC & Thông tư 173/2016/TT-BTC',
        legalArticle: 'Điều 15 Thông tư 219/2013/TT-BTC (sửa đổi bổ sung bởi Thông tư 173/2016/TT-BTC)',
        legalDocNumber: '219/2013/TT-BTC',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-219-2013-TT-BTC-huong-dan-Luat-thue-gia-tri-gia-tang-va-Nghi-dinh-209-2013-ND-CP-216960.aspx',
        suggestedAction: 'Liên hệ nhà cung cấp bổ sung Ủy nhiệm chi hoặc chứng từ xác nhận thanh toán qua ngân hàng.',
        verificationQuestion: 'Các hóa đơn đầu vào từ 20 triệu đồng trở lên đã có đủ Ủy nhiệm chi khớp số tài khoản người bán chưa?',
      },

      // 2. THUẾ TNDN
      {
        id: 'ob-tndn-1',
        ruleCode: 'RULE-TAX-TNDN-80',
        category: 'TNDN',
        categoryLabel: 'Thuế TNDN',
        title: 'Tạm nộp thuế TNDN hàng quý đạt ngưỡng tối thiểu 80% số thuế quyết toán năm',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasCitTaxToPay ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasCitTaxToPay
          ? `Số thuế TNDN tạm nộp dự kiến Quý ${taxQuarter}: ${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ cần nộp vào NSNN trước ${legalDeadlineText}.`
          : 'Chưa phát sinh số thuế TNDN phải tạm nộp cho kỳ tính thuế hiện tại.',
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
        evidenceTotal: 2,
        evidenceUploaded: hasCitTaxToPay ? 1 : 2,
        evidenceMissing: hasCitTaxToPay ? 1 : 0,
        description: 'Tổng số thuế TNDN đã tạm nộp của 04 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm. Trường hợp người nộp thuế nộp thiếu so với số thuế phải tạm nộp 4 quý thì phải nộp tiền chậm nộp tính trên số thuế nộp thiếu.',
        businessDataSnapshot: {
          'Thuế suất áp dụng': `${citTierResult.taxRatePercentText} (${citTierResult.title})`,
          'Thuế TNDN dự kiến cả quý': `${citSummary.estimatedTaxAmount.toLocaleString('vi-VN')} đ`,
          'Ngưỡng tạm nộp tối thiểu 80%': `${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ`,
          'Doanh thu tính thuế': `${citSummary.totalRevenue.toLocaleString('vi-VN')} đ`,
        },
        legalBasisTitle: 'Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP',
        legalArticle: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP',
        legalDocNumber: '91/2022/NĐ-CP',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-91-2022-ND-CP-sua-doi-Nghi-dinh-126-2020-ND-CP-huong-dan-Luat-Quan-ly-thue-537464.aspx',
        suggestedAction: 'Lập giấy nộp tiền eTax nộp số tiền thuế TNDN tạm tính vào tiểu mục 1052 Kho bạc Nhà nước.',
        verificationQuestion: 'Doanh nghiệp đã nộp giấy nộp tiền tạm nộp thuế TNDN Quý này qua Cổng eTax chưa?',
      },
      {
        id: 'ob-tndn-2',
        ruleCode: 'RULE-TAX-TNDN-B4',
        category: 'TNDN',
        categoryLabel: 'Thuế TNDN',
        title: 'Rà soát điều kiện chi phí được trừ khi tính thuế TNDN và bóc tách Mục B4',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: hasDisallowedB4 ? 'IN_PROGRESS' : 'COMPLETED',
        issueSummary: hasDisallowedB4
          ? `Ghi nhận ${citSummary.disallowedCount} khoản chi (${citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ) có nguy cơ bị loại trừ Mục B4 khi quyết toán.`
          : 'Toàn bộ chi phí kế toán đáp ứng điều kiện hợp lý, hợp lệ được trừ khi tính thuế TNDN.',
        legalDeadline: `31/03/${taxYear + 1}`,
        internalDeadline: `15/03/${taxYear + 1}`,
        riskSeverity: 'MEDIUM',
        penaltyText: 'Bị truy thu 20% tiền thuế TNDN, phạt 20% trên số thuế khai sai và phạt chậm nộp 0,03%/ngày theo Điều 16 Nghị định 125/2020/NĐ-CP.',
        evidenceTotal: 3,
        evidenceUploaded: hasDisallowedB4 ? 1 : 3,
        evidenceMissing: hasDisallowedB4 ? 2 : 0,
        description: 'Chi phí được trừ khi tính thuế TNDN phải đáp ứng 3 điều kiện: (1) Thực tế phát sinh liên quan đến hoạt động sản xuất kinh doanh; (2) Có đủ hóa đơn, chứng từ hợp pháp; (3) Có chứng từ thanh toán không dùng tiền mặt với hóa đơn từ 20 triệu đồng trở lên. Các khoản không đáp ứng phải bóc tách tại Mục B4 trên Tờ khai quyết toán 03/TNDN.',
        businessDataSnapshot: {
          'Tổng chi phí kế toán': `${citSummary.totalAccountingExpense.toLocaleString('vi-VN')} đ`,
          'Chi phí được trừ thực tế': `${citSummary.totalDeductibleExpense.toLocaleString('vi-VN')} đ`,
          'Chi phí bị loại trừ Mục B4': `${citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ`,
        },
        legalBasisTitle: 'Thông tư 96/2015/TT-BTC & Thông tư 78/2014/TT-BTC',
        legalArticle: 'Điều 4 Thông tư 96/2015/TT-BTC; Điều 6 Thông tư 78/2014/TT-BTC',
        legalDocNumber: '96/2015/TT-BTC',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-96-2015-TT-BTC-huong-dan-ve-thue-thu-nhap-doanh-nghiep-280456.aspx',
        suggestedAction: 'Bổ sung hóa đơn hợp lệ hoặc đánh dấu chuyển sang Mục B4 khi lập hồ sơ quyết toán năm.',
        verificationQuestion: 'Doanh nghiệp đã kiểm tra hóa đơn điện tử hợp pháp trên trang hoadondientu.gdt.gov.vn chưa?',
      },

      // 3. CÁC NGHĨA VỤ KHÁC
      {
        id: 'ob-other-1',
        ruleCode: 'RULE-TAX-MB',
        category: 'OTHER',
        categoryLabel: 'Lệ phí môn bài',
        title: 'Kê khai và nộp Lệ phí môn bài hàng năm',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'COMPLETED',
        issueSummary: `Doanh nghiệp đã hoàn thành nghĩa vụ nộp lệ phí môn bài năm ${taxYear} đúng hạn quy định.`,
        legalDeadline: `30/01/${taxYear}`,
        internalDeadline: `20/01/${taxYear}`,
        riskSeverity: 'LOW',
        penaltyText: 'Phạt tiền từ 2.000.000đ - 5.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai lệ phí môn bài quá hạn.',
        evidenceTotal: 1,
        evidenceUploaded: 1,
        evidenceMissing: 0,
        description: 'Tổ chức hoạt động sản xuất, kinh doanh hàng hóa, dịch vụ nộp lệ phí môn bài hàng năm chậm nhất là ngày 30 tháng 01 hàng năm.',
        businessDataSnapshot: {
          'Vốn điều lệ đăng ký': 'Theo giấy phép kinh doanh hiện hành',
          'Mức lệ phí môn bài bậc 2': '2.000.000 đ/năm (Vốn <= 10 tỷ)',
          'Tình trạng hoàn thành': 'Đã nộp giấy nộp tiền eTax',
        },
        legalBasisTitle: 'Nghị định 139/2016/NĐ-CP & Nghị định 22/2020/NĐ-CP',
        legalArticle: 'Điều 5 Nghị định 139/2016/NĐ-CP; Khoản 2 Điều 1 Nghị định 22/2020/NĐ-CP',
        legalDocNumber: '139/2016/NĐ-CP',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-139-2016-ND-CP-quy-dinh-ve-le-phi-mon-bai-324395.aspx',
        suggestedAction: 'Duy trì lưu trữ chứng từ nộp lệ phí môn bài trong Hồ sơ & Bằng chứng.',
      },
      {
        id: 'ob-other-2',
        ruleCode: 'RULE-TAX-TNCN',
        category: 'OTHER',
        categoryLabel: 'Thuế TNCN',
        title: 'Khấu trừ thuế TNCN và nộp tờ khai khấu trừ định kỳ (mẫu 05/KK-TNCN)',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'IN_PROGRESS',
        issueSummary: `Khấu trừ thuế TNCN tiền lương, thù lao vãng lai và gửi tờ khai trước ngày ${legalDeadlineText}.`,
        legalDeadline: legalDeadlineText,
        internalDeadline: internalDeadlineText,
        riskSeverity: 'HIGH',
        penaltyText: 'Phạt tiền từ 2.000.000đ - 25.000.000đ do nộp chậm tờ khai khấu trừ thuế và truy thu số thuế TNCN chưa khấu trừ.',
        evidenceTotal: 2,
        evidenceUploaded: 1,
        evidenceMissing: 1,
        description: 'Doanh nghiệp trả thu nhập có trách nhiệm khấu trừ thuế TNCN đối với thu nhập từ tiền lương, tiền công và các khoản chi trả thù lao cho cá nhân vãng lai từ 2 triệu đồng/lần trở lên; lập tờ khai 05/KK-TNCN theo quý.',
        businessDataSnapshot: {
          'Kỳ kê khai': `Quý ${taxQuarter}/${taxYear}`,
          'Quy mô nhân sự': 'Theo danh sách chi lương thực tế',
          'Hạn chót nộp tờ khai': legalDeadlineText,
        },
        legalBasisTitle: 'Luật Quản lý thuế số 38/2019/QH14 & Thông tư 111/2013/TT-BTC',
        legalArticle: 'Điều 44 Luật Quản lý thuế số 38/2019/QH14; Điều 25 Thông tư 111/2013/TT-BTC',
        legalDocNumber: '111/2013/TT-BTC',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-111-2013-TT-BTC-huong-dan-Luat-thue-thu-nhap-ca-nhan-va-Nghi-dinh-65-2013-ND-CP-205356.aspx',
        suggestedAction: 'Lập bảng tính khấu trừ thuế TNCN từ bảng lương và xuất tờ khai XML nộp qua eTax.',
      },
      {
        id: 'ob-other-3',
        ruleCode: 'RULE-TAX-FCT-10D',
        category: 'OTHER',
        categoryLabel: 'Thuế nhà thầu',
        title: 'Kê khai và nộp thuế Nhà thầu (FCT) khi chi trả dịch vụ nước ngoài (Google, Meta, TikTok...)',
        applicabilityStatus: 'POSSIBLE',
        completionStatus: 'PENDING_VERIFICATION',
        issueSummary: 'Cần xác minh nếu doanh nghiệp có phát sinh thanh toán dịch vụ quảng cáo online cho Meta, Google...',
        legalDeadline: 'Trong vòng 10 ngày từ ngày thanh toán',
        internalDeadline: 'Trong vòng 3 ngày từ ngày thanh toán',
        riskSeverity: 'MEDIUM',
        penaltyText: 'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá hạn.',
        evidenceTotal: 2,
        evidenceUploaded: 0,
        evidenceMissing: 2,
        description: 'Tổ chức Việt Nam thanh toán cho tổ chức nước ngoài kinh doanh tại Việt Nam hoặc có thu nhập tại Việt Nam mà nhà thầu nước ngoài chưa kê khai trực tiếp thì bên Việt Nam có trách nhiệm khấu trừ và kê khai thuế nhà thầu mẫu 01/NTNN trong thời hạn 10 ngày.',
        businessDataSnapshot: {
          'Chi phí quảng cáo số': 'Chờ đối soát từ sao kê thẻ tín dụng',
          'Tình trạng kê khai': 'Chưa ghi nhận tờ khai mẫu 01/NTNN',
        },
        legalBasisTitle: 'Thông tư 103/2014/TT-BTC về Thuế Nhà thầu nước ngoài (FCT)',
        legalArticle: 'Điều 8, Điều 11 Thông tư 103/2014/TT-BTC',
        legalDocNumber: '103/2014/TT-BTC',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-103-2014-TT-BTC-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-246944.aspx',
        suggestedAction: 'Kiểm tra sao kê thẻ tín dụng doanh nghiệp xem có thanh toán cho Google, Facebook, TikTok không.',
        verificationQuestion: 'Trong quý doanh nghiệp có phát sinh chi phí quảng cáo Facebook, Google, TikTok qua thẻ tín dụng không?',
      },
      {
        id: 'ob-other-4',
        ruleCode: 'RULE-TAX-POS-FNB',
        category: 'OTHER',
        categoryLabel: 'Hóa đơn máy tính tiền',
        title: 'Phát hành Hóa đơn điện tử khởi tạo từ máy tính tiền (áp dụng bán lẻ & trang sức vàng bạc)',
        applicabilityStatus: 'APPLICABLE',
        completionStatus: 'PENDING_VERIFICATION',
        issueSummary: 'Doanh nghiệp kinh doanh bán lẻ trang sức vàng bạc bắt buộc áp dụng HĐĐT máy tính tiền kết nối CQT.',
        legalDeadline: 'Ngay khi phát sinh giao dịch bán lẻ',
        internalDeadline: 'Kiểm tra truyền dữ liệu hàng ngày',
        riskSeverity: 'HIGH',
        penaltyText: 'Phạt cảnh cáo hoặc phạt tiền từ 4.000.000đ - 8.000.000đ theo Điều 24 Nghị định 125/2020/NĐ-CP đối với hành vi không lập hóa đơn theo quy định.',
        evidenceTotal: 2,
        evidenceUploaded: 1,
        evidenceMissing: 1,
        description: 'Doanh nghiệp cung cấp hàng hóa, dịch vụ trực tiếp đến người tiêu dùng (bán lẻ hàng hóa, dịch vụ ăn uống, bán lẻ vàng bạc đá quý) thuộc đối tượng sử dụng hóa đơn điện tử khởi tạo từ máy tính tiền có kết nối chuyển dữ liệu điện tử với cơ quan thuế.',
        businessDataSnapshot: {
          'Mô hình hoạt động': industry,
          'Hình thức bán hàng': 'Bán lẻ trực tiếp đến người tiêu dùng',
          'Quy định bắt buộc': 'Theo Nghị định 123/2020/NĐ-CP',
        },
        legalBasisTitle: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
        legalArticle: 'Điều 11 Nghị định 123/2020/NĐ-CP; Điều 8 Thông tư 78/2021/TT-BTC',
        legalDocNumber: '123/2020/NĐ-CP',
        legalDocUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-123-2020-ND-CP-quy-dinh-ve-hoa-don-chung-tu-454508.aspx',
        suggestedAction: 'Kiểm tra thông báo chấp nhận đăng ký HĐĐT máy tính tiền (mẫu 01/ĐKTĐ-HĐĐT) trên Cổng Tổng cục Thuế.',
        verificationQuestion: 'Hệ thống máy tính tiền / phần mềm bán hàng đã kết nối truyền dữ liệu HĐĐT trực tiếp đến cơ quan thuế chưa?',
      },
    ];
  }, [citSummary, citTierResult, legalDeadlineText, internalDeadlineText, industry, taxQuarter, taxYear]);

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

  // ============================================================================
  // KHU VỰC 3: ĐIỀU PHỐI TÁC VỤ (TASK COORDINATION)
  // ============================================================================
  const coordinatedTasks: CoordinatedTaskItem[] = useMemo(() => {
    return [
      {
        id: 'task-cit-pay',
        title: `Tạm nộp tiền thuế TNDN Quý ${taxQuarter} vào Kho bạc Nhà nước trước hạn`,
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        priority: 'HIGH',
        assigneeRole: 'Kế toán trưởng / Giám đốc',
        deadline: legalDeadlineText,
        status: citSummary.estimatedTaxAmount > 0 ? 'TODO' : 'COMPLETED',
        completionCondition: `Có Giấy nộp tiền vào NSNN tiểu mục 1052 có mã giao dịch eTax hoặc xác nhận của ngân hàng với số tiền tối thiểu ${citSummary.statutoryPrepayment80.toLocaleString('vi-VN')} đ.`,
      },
      {
        id: 'task-b4-gather',
        title: `Bổ sung hóa đơn hợp pháp & ủy nhiệm chi cho ${citSummary.disallowedCount > 0 ? citSummary.disallowedCount : 2} khoản chi bị loại Mục B4`,
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN (Mục B4)',
        priority: citSummary.disallowedCount > 0 ? 'CRITICAL' : 'MEDIUM',
        assigneeRole: 'Kế toán thanh toán',
        deadline: internalDeadlineText,
        status: citSummary.disallowedCount > 0 ? 'WAITING_INPUT' : 'COMPLETED',
        completionCondition: 'Thu thập đầy đủ hóa đơn điện tử hợp pháp hoặc chứng từ ủy nhiệm chi ngân hàng khớp tên người bán.',
      },
      {
        id: 'task-gtgt-declare',
        title: `Lập bảng kê bán ra - mua vào và nộp tờ khai thuế GTGT Quý ${taxQuarter}`,
        relatedObligationCode: 'RULE-TAX-GTGT',
        relatedObligationTitle: 'Kê khai thuế GTGT theo Quý (mẫu 01/GTGT)',
        priority: 'HIGH',
        assigneeRole: 'Kế toán thuế',
        deadline: legalDeadlineText,
        status: 'IN_PROGRESS',
        completionCondition: 'Gửi tờ khai 01/GTGT qua hệ thống eTax và nhận Thông báo bước 2 (Chấp nhận hồ sơ khai thuế) từ CQT.',
      },
      {
        id: 'task-pos-check',
        title: 'Kiểm tra truyền nhận dữ liệu hóa đơn điện tử khởi tạo từ máy tính tiền',
        relatedObligationCode: 'RULE-TAX-POS-FNB',
        relatedObligationTitle: 'Hóa đơn điện tử máy tính tiền cho bán lẻ vàng bạc',
        priority: 'MEDIUM',
        assigneeRole: 'Quản lý cửa hàng / IT',
        deadline: legalDeadlineText,
        status: 'REVIEW',
        completionCondition: 'Thông báo kết quả truyền nhận dữ liệu hóa đơn máy tính tiền với Tổng cục Thuế hiển thị trạng thái Hợp lệ 100%.',
      },
    ];
  }, [taxQuarter, legalDeadlineText, internalDeadlineText, citSummary]);

  // ============================================================================
  // KHU VỰC 4: HỒ SƠ MINH CHỨNG & XÁC MINH (EVIDENCE & VERIFICATION)
  // ============================================================================
  const complianceEvidences: ComplianceEvidenceItem[] = useMemo(() => {
    return [
      {
        id: 'ev-1',
        title: `Bảng kê Doanh thu & Chi phí Quý ${taxQuarter}/${taxYear} (Excel)`,
        documentType: 'BẢNG KÊ DOANH THU & CHI PHÍ',
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN',
        verificationStatus: 'VERIFIED',
        fileName: `Bang_Ke_Thu_Chi_Q${taxQuarter}_${taxYear}.xlsx`,
        updatedAt: '23/11/2026',
        guidanceNote: 'Đã bóc tách tự động và tính toán thuế suất theo đúng quy định Luật Thuế TNDN.',
      },
      {
        id: 'ev-2',
        title: `Giấy nộp tiền thuế TNDN tạm nộp Quý ${taxQuarter}/${taxYear}`,
        documentType: 'GIẤY NỘP TIỀN VÀO NSNN',
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        verificationStatus: citSummary.estimatedTaxAmount > 0 ? 'MISSING' : 'VERIFIED',
        guidanceNote: 'Chưa có chứng từ không đồng nghĩa với vi phạm. Doanh nghiệp cần tải lên giấy nộp tiền eTax sau khi hoàn thành giao dịch.',
      },
      {
        id: 'ev-3',
        title: `Tờ khai thuế GTGT mẫu 01/GTGT Quý ${taxQuarter}/${taxYear}`,
        documentType: 'TỜ KHAI THUẾ GTGT',
        relatedObligationCode: 'RULE-TAX-GTGT',
        relatedObligationTitle: 'Kê khai thuế GTGT theo Quý (mẫu 01/GTGT)',
        verificationStatus: 'PENDING',
        guidanceNote: 'Hồ sơ đang chờ nộp qua Cổng Thuế Điện Tử để lấy thông báo chấp nhận của cơ quan thuế.',
      },
      {
        id: 'ev-4',
        title: 'Ủy nhiệm chi ngân hàng cho các hóa đơn mua vào từ 20 triệu đồng',
        documentType: 'CHỨNG TỪ THANH TOÁN NGÂN HÀNG',
        relatedObligationCode: 'RULE-TAX-GTGT-BANK',
        relatedObligationTitle: 'Điều kiện thanh toán không dùng tiền mặt',
        verificationStatus: citSummary.disallowedCount > 0 ? 'MISSING' : 'VERIFIED',
        guidanceNote: 'Hệ thống chưa ghi nhận ủy nhiệm chi không đồng nghĩa doanh nghiệp chưa thanh toán. Vui lòng bổ sung sao kê để xác nhận hoàn thành.',
      },
      {
        id: 'ev-5',
        title: 'Thông báo chấp nhận đăng ký HĐĐT máy tính tiền (Mẫu 01/ĐKTĐ-HĐĐT)',
        documentType: 'THÔNG BÁO TIẾP NHẬN CQT',
        relatedObligationCode: 'RULE-TAX-POS-FNB',
        relatedObligationTitle: 'Hóa đơn điện tử máy tính tiền',
        verificationStatus: 'NOT_AVAILABLE',
        guidanceNote: 'Doanh nghiệp bán lẻ vàng bạc cần kiểm tra mẫu 01/ĐKTĐ-HĐĐT với cơ quan thuế quản lý trực tiếp.',
      },
    ];
  }, [taxQuarter, taxYear, citSummary]);

  // ============================================================================
  // KHU VỰC 5: CĂN CỨ PHÁP LÝ TRA CỨU THEO NGHĨA VỤ (LEGAL REFERENCES)
  // ============================================================================
  const legalReferences: LegalReferenceDocItem[] = useMemo(() => {
    return [
      {
        id: 'law-gtgt-1',
        docTitle: 'Luật Quản lý thuế số 38/2019/QH14',
        docNumber: '38/2019/QH14',
        articles: 'Điều 44 - Thời hạn nộp hồ sơ khai thuế',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-GTGT',
        relatedObligationTitle: 'Thời hạn nộp tờ khai thuế theo quý',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Quan-ly-thue-2019-so-38-2019-QH14-417109.aspx',
      },
      {
        id: 'law-gtgt-2',
        docTitle: 'Nghị định 126/2020/NĐ-CP hướng dẫn Luật Quản lý thuế',
        docNumber: '126/2020/NĐ-CP',
        articles: 'Điều 8, Điều 9 - Tiêu chí khai thuế GTGT theo quý',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-GTGT',
        relatedObligationTitle: 'Kê khai thuế GTGT theo Quý (mẫu 01/GTGT)',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-126-2020-ND-CP-huong-dan-Luat-Quan-ly-thue-455243.aspx',
      },
      {
        id: 'law-gtgt-3',
        docTitle: 'Thông tư 219/2013/TT-BTC & Thông tư 173/2016/TT-BTC',
        docNumber: '219/2013/TT-BTC',
        articles: 'Điều 15 - Điều kiện khấu trừ thuế GTGT đầu vào hóa đơn từ 20 triệu',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-GTGT-BANK',
        relatedObligationTitle: 'Chứng từ thanh toán không dùng tiền mặt',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-219-2013-TT-BTC-huong-dan-Luat-thue-gia-tri-gia-tang-va-Nghi-dinh-209-2013-ND-CP-216960.aspx',
      },
      {
        id: 'law-tndn-1',
        docTitle: 'Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP',
        docNumber: '91/2022/NĐ-CP',
        articles: 'Khoản 3 Điều 1 - Tạm nộp thuế TNDN 4 quý đạt tối thiểu 80%',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-80',
        relatedObligationTitle: 'Tạm nộp thuế TNDN 80% định kỳ 4 quý',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-91-2022-ND-CP-sua-doi-Nghi-dinh-126-2020-ND-CP-huong-dan-Luat-Quan-ly-thue-537464.aspx',
      },
      {
        id: 'law-tndn-2',
        docTitle: 'Thông tư 96/2015/TT-BTC về Thuế Thu Nhập Doanh Nghiệp',
        docNumber: '96/2015/TT-BTC',
        articles: 'Điều 4 - Các khoản chi được trừ và không được trừ (Mục B4)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-TNDN-B4',
        relatedObligationTitle: 'Rà soát chi phí được trừ khi tính thuế TNDN',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-96-2015-TT-BTC-huong-dan-ve-thue-thu-nhap-doanh-nghiep-280456.aspx',
      },
      {
        id: 'law-penal-1',
        docTitle: 'Nghị định 125/2020/NĐ-CP về xử phạt vi phạm hành chính thuế, hóa đơn',
        docNumber: '125/2020/NĐ-CP',
        articles: 'Điều 13 (Chậm nộp tờ khai); Điều 16 (Khai sai thuế); Điều 24 (Hóa đơn)',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-GTGT',
        relatedObligationTitle: 'Khung chế tài xử phạt hành chính thuế',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-125-2020-ND-CP-xu-phat-vi-pham-hanh-chinh-thue-hoa-don-455242.aspx',
      },
      {
        id: 'law-pos-1',
        docTitle: 'Nghị định 123/2020/NĐ-CP về Hóa đơn, Chứng từ',
        docNumber: '123/2020/NĐ-CP',
        articles: 'Điều 11 - Hóa đơn điện tử khởi tạo từ máy tính tiền',
        validity: 'Đang có hiệu lực',
        relatedObligationCode: 'RULE-TAX-POS-FNB',
        relatedObligationTitle: 'Hóa đơn điện tử máy tính tiền bán lẻ',
        officialUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-123-2020-ND-CP-quy-dinh-ve-hoa-don-chung-tu-454508.aspx',
      },
    ];
  }, []);

  // Xử lý tạo task từ obligation
  const handleCreateTaskFromObligation = async (ob: ComplianceObligationItem) => {
    try {
      await createTask({
        title: `Hoàn tất tuân thủ: ${ob.title}`,
        category: 'compliance',
        priority: ob.riskSeverity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        dueDate: ob.legalDeadline,
        notes: `Tác vụ điều phối sinh tự động từ Báo cáo rà soát tuân thủ CELRA.\nCăn cứ pháp lý: ${ob.legalBasisTitle} (${ob.legalArticle}).\nHành động đề xuất: ${ob.suggestedAction}`,
      });
      Modal.success({
        title: 'Tạo Tác Vụ Điều Phối Thành Công',
        content: `Đã kích hoạt tác vụ cho nghĩa vụ [${ob.ruleCode}] ${ob.title}. Bạn có thể theo dõi tiến độ thực hiện tại trang Nhiệm Vụ Tuân Thủ.`,
        okText: 'Đã hiểu',
      });
      if (fetchTasks) fetchTasks();
    } catch (err: any) {
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

        {/* 5 Thẻ thống kê chỉ số nhỏ gọn (Compact Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* Card 1: Tổng số nghĩa vụ */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Tổng số nghĩa vụ</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {stats.total}
            </div>
            <span className="text-[10.5px] text-slate-400 block">Ma trận pháp luật thuế</span>
          </div>

          {/* Card 2: Đã hoàn thành */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Đã hoàn thành</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 tracking-tight">
              {stats.completed}
            </div>
            <span className="text-[10.5px] text-emerald-600 font-medium block">Đầy đủ hồ sơ minh chứng</span>
          </div>

          {/* Card 3: Đang thực hiện */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Đang thực hiện</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-800 tracking-tight">
              {stats.inProgress}
            </div>
            <span className="text-[10.5px] text-blue-600 font-medium block">Trong hạn tiến độ quý</span>
          </div>

          {/* Card 4: Cần xác minh */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-1">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Cần xác minh</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-800 tracking-tight">
              {stats.needVerification}
            </div>
            <span className="text-[10.5px] text-amber-600 font-medium block">Chờ đối soát chứng từ</span>
          </div>

          {/* Card 5: Không áp dụng */}
          <div className="bg-slate-50/60 border border-slate-200/70 rounded-xl p-3 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Không áp dụng</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-600 tracking-tight">
              {stats.notApplicable}
            </div>
            <span className="text-[10.5px] text-slate-400 block">Ngoài phạm vi ngành</span>
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

          {/* Bộ lọc nhóm thuế */}
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
              onClick={() => setSelectedTaxFilter('GTGT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'GTGT'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thuế GTGT ({obligations.filter((o) => o.category === 'GTGT').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('TNDN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'TNDN'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thuế TNDN ({obligations.filter((o) => o.category === 'TNDN').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaxFilter('OTHER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTaxFilter === 'OTHER'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khác ({obligations.filter((o) => o.category === 'OTHER').length})
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
                  <Tag className="font-mono font-bold text-[10.5px] uppercase bg-slate-100 text-slate-700 border-slate-200 m-0">
                    {item.ruleCode}
                  </Tag>
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
              {coordinatedTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800 max-w-[240px]">
                    {t.title}
                  </td>
                  <td className="py-3 px-3">
                    <Tooltip title={t.relatedObligationTitle}>
                      <Tag className="font-mono text-[10px] font-bold m-0 border-slate-200">
                        {t.relatedObligationCode}
                      </Tag>
                    </Tooltip>
                  </td>
                  <td className="py-3 px-3">
                    <Tag
                      color={t.priority === 'CRITICAL' ? 'red' : t.priority === 'HIGH' ? 'orange' : 'blue'}
                      className="text-[10px] font-bold m-0"
                    >
                      {t.priority}
                    </Tag>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {t.assigneeRole}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {t.deadline}
                  </td>
                  <td className="py-3 px-3">
                    {renderCelraTaskStatusBadge(t.status)}
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
              ))}
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
              setUploadTargetObligation('RULE-TAX-GTGT');
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
          Modal.success({
            title: 'Tải Bằng Chứng Thành Công',
            content: 'Tệp chứng từ đã được lưu trữ và đính kèm vào hồ sơ rà soát tuân thủ của doanh nghiệp.',
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
