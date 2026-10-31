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
      'Hồ sơ doanh nghiệp số chuẩn hóa',
      'AI Legal Chatbox tư vấn tuân thủ',
      'Tra cứu văn bản pháp luật chính thức',
      'Đánh giá tuân thủ cơ bản',
      'Nhận diện nghĩa vụ pháp lý tự động',
      'Phát hiện hồ sơ & bằng chứng còn thiếu',
      'Cảnh báo thời hạn nộp thuế & tờ khai',
      'Báo cáo tuân thủ cơ bản định kỳ',
      '100 lượt AI Chatbox / tháng',
      '20 lượt phân tích hồ sơ / tháng',
      '2 GB dung lượng lưu trữ an toàn',
      '01 Doanh nghiệp quản lý',
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
    badge: 'Đề xuất phổ biến nhất',
    popular: true,
    description: 'Dành cho doanh nghiệp đang hoạt động, cần chủ động quản lý và kiểm soát tuân thủ.',
    targetAudience: 'Doanh nghiệp SME đang vận hành (5–30 người), chuỗi 2-3 điểm bán F&B/bán lẻ',
    aiChatboxMonthlyLimit: 500,
    docAnalysisMonthlyLimit: 100,
    storageGbLimit: 10,
    maxOrganizations: 1,
    features: [
      'Bao gồm toàn bộ quyền lợi của gói Starter',
      'Đánh giá tuân thủ nâng cao toàn diện',
      'AI Recommendation gợi ý giải pháp pháp lý',
      'Tự động đề xuất Compliance Task & Checklist',
      'Kanban board quản lý & phân công công việc',
      'Quản lý hồ sơ và thẩm tra bằng chứng số',
      'Phân tích thu chi phục vụ kê khai thuế TNDN',
      'Theo dõi nghĩa vụ thuế GTGT, TNDN, TNCN',
      'Cảnh báo rủi ro xuất toán Mục B4 tự động',
      'Báo cáo tuân thủ nâng cao chuẩn luật',
      '500 lượt AI Chatbox / tháng',
      '100 lượt phân tích hồ sơ / tháng',
      '10 GB dung lượng lưu trữ chứng từ',
      '01 Doanh nghiệp quản lý',
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
    badge: 'Đặc quyền Chuyên gia 1:1',
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
      'Bao gồm toàn bộ quyền lợi của gói Professional',
      'Đánh giá tuân thủ chuyên sâu & kiểm toán thuế',
      'Phân tích nhiều tài liệu cùng lúc với AI đa luồng',
      'Theo dõi thay đổi pháp luật theo thời gian thực',
      'Đánh giá tác động của quy định mới đối với ngành',
      'Báo cáo tuân thủ chuyên sâu xuất file kiểm toán',
      'Đánh giá nghĩa vụ khi mở rộng quy mô doanh nghiệp',
      '02 buổi tư vấn chuyên gia 1:1 / tháng (45–60 phút/buổi)',
      'Ưu tiên hỗ trợ kỹ thuật và đặt lịch hẹn chuyên gia 24/7',
      '1.000 lượt AI Chatbox / tháng (Tốc độ cao)',
      '200 lượt phân tích hồ sơ / tháng',
      '30 GB dung lượng lưu trữ trọn đời',
      '01 Doanh nghiệp quản lý',
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
