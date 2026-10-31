import type { PlanFeatureDefinition, SubscriptionPlanCode } from '../interfaces';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, PlanFeatureDefinition> = {
  STARTER: {
    code: 'STARTER',
    name: 'Gói Starter',
    priceVnd: 699000,
    periodLabel: 'tháng',
    badge: 'Khởi đầu',
    popular: false,
    description: 'Dành cho doanh nghiệp mới thành lập, cần nhận diện và theo dõi nghĩa vụ pháp lý.',
    targetAudience: 'Doanh nghiệp mới thành lập, siêu nhỏ (1–5 người), hộ kinh doanh mới chuyển đổi',
    aiChatboxMonthlyLimit: 100,
    docAnalysisMonthlyLimit: 20,
    storageGbLimit: 2,
    maxOrganizations: 1,
    features: [
      'Hồ sơ bối cảnh doanh nghiệp số hóa chuẩn luật',
      'Trợ lý AI Pháp lý & Thuế tư vấn tuân thủ',
      'Nhận diện nghĩa vụ pháp lý & cảnh báo hạn nộp thuế',
      'Báo cáo rà soát tuân thủ cơ bản định kỳ',
      'Quản lý 01 doanh nghiệp',
    ],
    highlightFeatures: [
      '100 lượt AI Chatbox / tháng',
      '20 lượt phân tích hồ sơ / tháng',
      'Cảnh báo thời hạn & Báo cáo cơ bản',
    ],
  },
  PROFESSIONAL: {
    code: 'PROFESSIONAL',
    name: 'Gói Professional',
    priceVnd: 1599000,
    periodLabel: 'tháng',
    badge: 'Gói đề xuất',
    popular: true,
    description: 'Dành cho doanh nghiệp đang hoạt động, cần chủ động quản lý và kiểm soát tuân thủ.',
    targetAudience: 'Doanh nghiệp SME đang vận hành (5–30 người), chuỗi 2-3 điểm bán F&B/bán lẻ',
    aiChatboxMonthlyLimit: 500,
    docAnalysisMonthlyLimit: 100,
    storageGbLimit: 10,
    maxOrganizations: 1,
    features: [
      '✨ Bao gồm toàn bộ quyền lợi của gói Starter',
      'Rà soát Mục B4 & cảnh báo xuất toán chi phí Thuế TNDN',
      'Sổ kê khai Thu - Chi & quản trị lợi nhuận sau thuế',
      'Tự động lập Checklist & phân công công việc tuân thủ',
      'Thẩm tra chứng từ số hóa đơn điện tử tự động',
    ],
    highlightFeatures: [
      '500 lượt AI Chatbox / tháng',
      '100 lượt phân tích hồ sơ / tháng',
      'Rà soát Mục B4 & Phân tích Thu - Chi thuế',
      'Kanban quản lý công việc & Báo cáo nâng cao',
    ],
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    name: 'Gói Enterprise',
    priceVnd: 4299000,
    periodLabel: 'tháng',
    badge: 'Đặc quyền Chuyên gia',
    popular: false,
    description: 'Giải pháp quản lý tuân thủ toàn diện, kết hợp AI và chuyên gia tư vấn 1:1.',
    targetAudience: 'Doanh nghiệp quy mô vừa (30–100+ người), chuỗi chi nhánh, tập đoàn mẹ - con',
    aiChatboxMonthlyLimit: 1000,
    docAnalysisMonthlyLimit: 200,
    storageGbLimit: 30,
    maxOrganizations: 1,
    expertConsultingSessionsPerMonth: 2,
    sessionDurationMinutes: '45–60 phút / buổi',
    features: [
      '✨ Bao gồm toàn bộ quyền lợi của gói Professional',
      '02 buổi tư vấn chuyên gia pháp lý & thuế 1:1 / tháng',
      'Cập nhật văn bản pháp luật thời gian thực [Dự kiến ra mắt]',
      'Báo cáo thẩm tra xuất toán phục vụ kiểm toán [Đang phát triển]',
      'Hỗ trợ kỹ thuật & đặt lịch hẹn cố vấn ưu tiên',
    ],
    highlightFeatures: [
      '02 buổi tư vấn chuyên gia 1:1 / tháng (45–60p)',
      '1.000 lượt AI Chatbox / tháng (High-speed Queue)',
      '200 lượt phân tích hồ sơ cùng lúc',
      'Đánh giá tác động luật & Hỗ trợ ưu tiên 24/7',
    ],
  },
};

export const DEFAULT_TRIAL_SUBSCRIPTION: {
  plan: SubscriptionPlanCode;
  planName: string;
  priceVnd: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'CANCELLED';
  startedAt: string;
  expiresAt: string;
  nextBillingAt: string;
  autoRenew: boolean;
  usage: {
    aiChatboxUsed: number;
    aiChatboxLimit: number;
    docAnalysisUsed: number;
    docAnalysisLimit: number;
    storageUsedGb: number;
    storageLimitGb: number;
    daysRemaining: number;
  };
} = {
  plan: 'PROFESSIONAL',
  planName: 'Gói Professional',
  priceVnd: 1599000,
  status: 'ACTIVE',
  startedAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 24 * 86400 * 1000).toISOString(),
  nextBillingAt: new Date(Date.now() + 24 * 86400 * 1000).toISOString(),
  autoRenew: true,
  usage: {
    aiChatboxUsed: 42,
    aiChatboxLimit: 500,
    docAnalysisUsed: 15,
    docAnalysisLimit: 100,
    storageUsedGb: 1.8,
    storageLimitGb: 10,
    daysRemaining: 24,
  },
};
