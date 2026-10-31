import React, { useEffect, useState } from 'react';
import { Tabs, Tag, Button, Progress, Modal, message, Switch } from 'antd';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Receipt,
  CreditCard,
  MessageSquare,
  FileText,
  HardDrive,
  Calendar,
  AlertCircle,
  Headphones,
  TrendingUp,
} from 'lucide-react';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { useOrgStore } from '../../store/useOrgStore';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptionPlans';
import type { SubscriptionPlanCode, PlanFeatureDefinition, PaymentInvoiceItem } from '../../interfaces';

export const SubscriptionPage: React.FC = () => {
  const { activeOrg } = useOrgStore();
  const {
    subscription,
    invoices,
    isLoading,
    fetchSubscription,
    fetchInvoices,
    subscribePlan,
    toggleAutoRenew,
  } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanFeatureDefinition | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoiceItem | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    fetchSubscription(activeOrg?.id);
    fetchInvoices(activeOrg?.id);
  }, [activeOrg?.id]);

  const currentPlanCode = subscription?.plan || 'PROFESSIONAL';
  const currentPlanDef = SUBSCRIPTION_PLANS[currentPlanCode];

  const handleOpenUpgrade = (plan: PlanFeatureDefinition) => {
    setSelectedPlanForUpgrade(plan);
    setUpgradeModalOpen(true);
  };

  const handleConfirmUpgrade = async (method: 'VietQR' | 'Sandbox') => {
    if (!selectedPlanForUpgrade) return;
    setIsProcessing(true);
    try {
      await subscribePlan(selectedPlanForUpgrade.code, method);
      message.success(
        `Chúc mừng bạn đã kích hoạt thành công ${selectedPlanForUpgrade.name}! Hạn mức sử dụng mới đã sẵn sàng.`
      );
      setUpgradeModalOpen(false);
      setActiveTab('overview');
    } catch {
      message.error('Có sự cố khi kích hoạt gói dịch vụ. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    const nextState = await toggleAutoRenew();
    if (nextState) {
      message.success('Đã bật tính năng tự động gia hạn gói hàng tháng');
    } else {
      message.info('Đã tắt tự động gia hạn. Gói sẽ hết hạn vào cuối chu kỳ hiện tại.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
                CELRA Compliance Subscription
              </span>
              <Tag color={subscription?.status === 'ACTIVE' ? 'success' : 'warning'} className="font-semibold text-xs m-0">
                {subscription?.status === 'ACTIVE' ? 'Đang hoạt động' : 'Hết hạn'}
              </Tag>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{activeOrg?.name || 'Doanh nghiệp của bạn'}</span>
              <span className="text-sm font-bold bg-white/10 text-teal-300 px-3 py-1 rounded-xl border border-white/10">
                {currentPlanDef.name}
              </span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quản lý gói dịch vụ tuân thủ pháp lý &amp; thuế chuyên nghiệp. Toàn bộ tính năng AI, rà soát Mục B4 và lưu trữ bằng chứng được cấp quyền tự động theo gói thuê bao hàng tháng.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Button
              type="primary"
              size="large"
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
              onClick={() => setActiveTab('pricing')}
              className="bg-teal-600 hover:bg-teal-500 font-bold text-xs h-11 px-5 rounded-2xl shadow-teal-900/40 shadow-lg border-none"
            >
              Nâng cấp / Đổi gói
            </Button>
            <Button
              size="large"
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={() => {
                fetchSubscription(activeOrg?.id);
                fetchInvoices(activeOrg?.id);
                message.success('Đã làm mới thông tin gói thuê bao');
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-11 px-4 rounded-2xl text-xs font-semibold"
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="celra-subscription-tabs"
        items={[
          {
            key: 'overview',
            label: (
              <span className="flex items-center gap-2 px-1 font-bold text-xs md:text-sm">
                <ShieldCheck className="w-4 h-4" />
                Gói Hiện Tại &amp; Hạn Mức Sử Dụng
              </span>
            ),
            children: (
              <div className="space-y-6 pt-2">
                {/* 2.1 Overview Plan & Renewal Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cột 1: Thông tin gói chính */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Gói dịch vụ đang kích hoạt
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                          <span>{currentPlanDef.name}</span>
                          {currentPlanDef.popular && (
                            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                              Gói đề xuất
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {currentPlanDef.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-teal-700 font-mono">
                          {currentPlanDef.priceVnd.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="text-xs text-slate-400 font-medium">/ tháng</div>
                      </div>
                    </div>

                    {/* Meta info: Ngày bắt đầu, Ngày hết hạn, Chu kỳ */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Ngày kích hoạt
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                          {subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString('vi-VN') : 'Mặc định'}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" /> Ngày hết hạn
                        </div>
                        <div className="text-xs font-bold text-teal-800 mt-1 font-mono">
                          {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('vi-VN') : 'Còn 30 ngày'}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Thời gian còn lại
                        </div>
                        <div className="text-xs font-extrabold text-amber-700 mt-1">
                          {subscription?.usage?.daysRemaining ?? 30} ngày
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Trạng thái tự động gia hạn & Nút thao tác */}
                  <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Tự động gia hạn</span>
                        <Switch
                          checked={subscription?.autoRenew ?? true}
                          onChange={handleToggleAutoRenew}
                          className="bg-slate-300"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Khi bật, hệ thống sẽ nhắc nhở và tự động xuất hóa đơn gia hạn vào ngày{' '}
                        <strong>
                          {subscription?.nextBillingAt ? new Date(subscription.nextBillingAt).toLocaleDateString('vi-VN') : 'kết thúc chu kỳ'}
                        </strong>{' '}
                        để dịch vụ không bị gián đoạn.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <Button
                        type="primary"
                        block
                        icon={<Sparkles className="w-4 h-4" />}
                        onClick={() => setActiveTab('pricing')}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 rounded-xl"
                      >
                        Nâng Cấp Gói Dịch Vụ
                      </Button>
                      <Button
                        block
                        onClick={() => {
                          handleOpenUpgrade(currentPlanDef);
                        }}
                        className="text-xs font-semibold text-slate-700 h-10 rounded-xl border-slate-300 hover:border-slate-400"
                      >
                        Gia Hạn Thêm 30 Ngày
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2.2 HẠN MỨC SỬ DỤNG TRONG THÁNG (Usage Progress Cards) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      Mức Sử Dụng Quyền Lợi Theo Chu Kỳ Tháng
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Chu kỳ tự động làm mới vào ngày 1 hàng tháng
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Metric 1: AI Chatbox */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Lượt AI Chatbox</div>
                            <div className="text-[11px] text-slate-500">Tư vấn thuế &amp; pháp lý</div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold font-mono text-teal-700">
                          {subscription?.usage?.aiChatboxUsed ?? 42} / {currentPlanDef.aiChatboxMonthlyLimit}
                        </span>
                      </div>

                      <div>
                        {(() => {
                          const used = subscription?.usage?.aiChatboxUsed ?? 42;
                          const limit = currentPlanDef.aiChatboxMonthlyLimit;
                          const percent = Math.min(100, Math.round((used / limit) * 100));
                          return (
                            <Progress
                              percent={percent}
                              strokeColor="#0d9488"
                              trailColor="#f1f5f9"
                              showInfo={false}
                              strokeWidth={8}
                            />
                          );
                        })()}
                        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-medium">
                          <span>Đã sử dụng {Math.min(100, Math.round(((subscription?.usage?.aiChatboxUsed ?? 42) / currentPlanDef.aiChatboxMonthlyLimit) * 100))}%</span>
                          <span>Còn lại {Math.max(0, currentPlanDef.aiChatboxMonthlyLimit - (subscription?.usage?.aiChatboxUsed ?? 42))} câu</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric 2: Phân tích hồ sơ tuân thủ */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Phân Tích Hồ Sơ</div>
                            <div className="text-[11px] text-slate-500">Rà soát hóa đơn, chứng từ</div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold font-mono text-blue-700">
                          {subscription?.usage?.docAnalysisUsed ?? 15} / {currentPlanDef.docAnalysisMonthlyLimit}
                        </span>
                      </div>

                      <div>
                        {(() => {
                          const used = subscription?.usage?.docAnalysisUsed ?? 15;
                          const limit = currentPlanDef.docAnalysisMonthlyLimit;
                          const percent = Math.min(100, Math.round((used / limit) * 100));
                          return (
                            <Progress
                              percent={percent}
                              strokeColor="#2563eb"
                              trailColor="#f1f5f9"
                              showInfo={false}
                              strokeWidth={8}
                            />
                          );
                        })()}
                        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-medium">
                          <span>Đã sử dụng {Math.min(100, Math.round(((subscription?.usage?.docAnalysisUsed ?? 15) / currentPlanDef.docAnalysisMonthlyLimit) * 100))}%</span>
                          <span>Còn lại {Math.max(0, currentPlanDef.docAnalysisMonthlyLimit - (subscription?.usage?.docAnalysisUsed ?? 15))} lượt</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric 3: Dung lượng lưu trữ */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Dung Lượng Lưu Trữ</div>
                            <div className="text-[11px] text-slate-500">Kho hồ sơ &amp; bằng chứng số</div>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold font-mono text-purple-700">
                          {subscription?.usage?.storageUsedGb ?? 1.8} GB / {currentPlanDef.storageGbLimit} GB
                        </span>
                      </div>

                      <div>
                        {(() => {
                          const used = subscription?.usage?.storageUsedGb ?? 1.8;
                          const limit = currentPlanDef.storageGbLimit;
                          const percent = Math.min(100, Math.round((used / limit) * 100));
                          return (
                            <Progress
                              percent={percent}
                              strokeColor="#7c3aed"
                              trailColor="#f1f5f9"
                              showInfo={false}
                              strokeWidth={8}
                            />
                          );
                        })()}
                        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-medium">
                          <span>Đã sử dụng {Math.min(100, Math.round(((subscription?.usage?.storageUsedGb ?? 1.8) / currentPlanDef.storageGbLimit) * 100))}%</span>
                          <span>Còn trống {(currentPlanDef.storageGbLimit - (subscription?.usage?.storageUsedGb ?? 1.8)).toFixed(1)} GB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2.3 Quyền lợi gói hiện tại đang có */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-teal-600" />
                      Quyền Lợi Đang Áp Dụng Của {currentPlanDef.name}
                    </h4>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                      Đầy đủ quyền truy cập
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentPlanDef.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'pricing',
            label: (
              <span className="flex items-center gap-2 px-1 font-bold text-xs md:text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Bảng Giá 3 Gói Dịch Vụ
              </span>
            ),
            children: (
              <div className="space-y-6 pt-2">
                <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Chọn Gói Phù Hợp Cho Doanh Nghiệp Bạn
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    Mô hình Subscription trọn gói, minh bạch và tối ưu chi phí cho doanh nghiệp vừa &amp; nhỏ.
                  </p>

                  {/* Bộ chọn chu kỳ Tháng / Năm (Tiết kiệm 15%) */}
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <span className={`text-xs font-bold ${billingCycle === 'MONTHLY' ? 'text-slate-900' : 'text-slate-400'}`}>
                      Thanh toán theo tháng
                    </span>
                    <Switch
                      checked={billingCycle === 'YEARLY'}
                      onChange={(checked) => setBillingCycle(checked ? 'YEARLY' : 'MONTHLY')}
                      className="bg-slate-300"
                    />
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'YEARLY' ? 'text-teal-700' : 'text-slate-400'}`}>
                      Thanh toán theo năm
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                        Tiết kiệm 15% (Tặng 2 tháng)
                      </span>
                    </span>
                  </div>
                </div>

                {/* 3 Pricing Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanCode[]).map((code) => {
                    const plan = SUBSCRIPTION_PLANS[code];
                    const isCurrent = currentPlanCode === code;
                    const isPopular = plan.popular;
                    const isEnterprise = code === 'ENTERPRISE';

                    return (
                      <div
                        key={code}
                        className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                          isPopular
                            ? 'bg-gradient-to-b from-teal-50/60 via-white to-white border-2 border-teal-500 shadow-xl ring-4 ring-teal-500/10'
                            : isEnterprise
                            ? 'bg-gradient-to-b from-indigo-50/40 via-white to-white border-2 border-indigo-300 shadow-md hover:border-indigo-400'
                            : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                        }`}
                      >
                        {/* Popular Badge */}
                        {isPopular && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[11px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> {plan.badge || 'Đề xuất'}
                          </div>
                        )}

                        {/* Enterprise Badge */}
                        {isEnterprise && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5" /> {plan.badge}
                          </div>
                        )}

                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                                {plan.name}
                              </h3>
                              {isCurrent && (
                                <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                                  Đang sử dụng
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">
                              {plan.description}
                            </p>
                          </div>

                          {/* Giá tiền */}
                          <div className="border-y border-slate-100 py-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl md:text-4xl font-black text-slate-900 font-mono tracking-tight">
                                {billingCycle === 'YEARLY'
                                  ? Math.round((plan.priceVnd * 12 * 0.85) / 12).toLocaleString('vi-VN')
                                  : plan.priceVnd.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-sm font-bold text-slate-500">₫ / tháng</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-1">
                              <span>{billingCycle === 'YEARLY' ? `Thanh toán ${Math.round(plan.priceVnd * 12 * 0.85).toLocaleString('vi-VN')} ₫ / năm` : 'Chu kỳ thanh toán từng tháng'}</span>
                              <span className="text-slate-400 italic">Chưa gồm 10% VAT</span>
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 mt-1">
                              Đối tượng: {plan.targetAudience}
                            </div>
                          </div>
                          {/* Hạn mức trọng tâm (Highlights) */}
                          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Hạn mức quyền lợi chính:
                            </div>
                            <div className="text-xs text-slate-800 font-bold flex items-center gap-2">
                              <Check className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>{plan.aiChatboxMonthlyLimit} lượt AI Chatbox / tháng</span>
                            </div>
                            <div className="text-xs text-slate-800 font-bold flex items-center gap-2">
                              <Check className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>{plan.docAnalysisMonthlyLimit} lượt phân tích hồ sơ / tháng</span>
                            </div>
                            <div className="text-xs text-slate-800 font-bold flex items-center gap-2">
                              <Check className="w-4 h-4 text-teal-600 shrink-0" />
                              <span>{plan.storageGbLimit} GB lưu trữ chứng từ số</span>
                            </div>
                            {plan.expertConsultingSessionsPerMonth && (
                              <div className="text-xs text-indigo-700 font-extrabold flex items-center gap-2 pt-1 border-t border-slate-200">
                                <Headphones className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>{plan.expertConsultingSessionsPerMonth} buổi tư vấn chuyên gia 1:1 ({plan.sessionDurationMinutes})</span>
                              </div>
                            )}
                          </div>

                          {/* Danh sách toàn bộ tính năng */}
                          <div className="space-y-2.5 pt-1">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Chi tiết quyền lợi:
                            </div>
                            <ul className="space-y-2 text-xs text-slate-600">
                              {plan.features.map((feat, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Action CTA Button */}
                        <div className="mt-8 pt-4 border-t border-slate-100">
                          {isCurrent ? (
                            <Button
                              disabled
                              block
                              size="large"
                              className="bg-slate-100 text-slate-400 border-none font-bold text-xs h-12 rounded-2xl cursor-default"
                            >
                              Gói Hiện Tại Đang Hoạt Động
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              block
                              size="large"
                              onClick={() => handleOpenUpgrade(plan)}
                              className={`font-bold text-xs h-12 rounded-2xl flex items-center justify-center gap-2 shadow-sm ${
                                isPopular
                                  ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20'
                                  : isEnterprise
                                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              <span>{code === 'STARTER' ? 'Hạ cấp về Starter' : `Đăng ký ${plan.name}`}</span>
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CHÍNH SÁCH DỊCH VỤ & GIẢI ĐÁP QUYỀN LỢI (TASK 2 FAQ) */}
                <div className="bg-slate-50/80 rounded-3xl p-6 md:p-8 border border-slate-200/90 space-y-4 mt-8">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                    <ShieldCheck className="w-5 h-5 text-teal-700" />
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Chính Sách Gói Dịch Vụ &amp; Minh Bạch Hạn Mức
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                        Chính sách Hóa đơn &amp; Thuế VAT
                      </div>
                      <p className="m-0 leading-relaxed text-slate-500 text-[11.5px]">
                        Giá niêm yết chưa bao gồm 10% thuế VAT. Hệ thống tự động xuất Hóa đơn điện tử hợp pháp gửi về email doanh nghiệp sau khi thanh toán thành công để hạch toán chi phí hợp lý (Mục B4).
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                        Chính sách Dùng thử &amp; Gia hạn
                      </div>
                      <p className="m-0 leading-relaxed text-slate-500 text-[11.5px]">
                        Tài khoản mới được trải nghiệm đầy đủ quyền lợi. Bạn có thể bật/tắt tính năng "Tự động gia hạn" bất kỳ lúc nào tại tab Tổng quan mà không phát sinh thêm chi phí ẩn.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                        Điều gì xảy ra khi dùng hết lượt Trợ lý AI?
                      </div>
                      <p className="m-0 leading-relaxed text-slate-500 text-[11.5px]">
                        Khi dùng hết lượt AI trong tháng, toàn bộ dữ liệu, lịch tuân thủ và sổ thu chi vẫn truy cập bình thường. Trợ lý AI chuyển sang chế độ tra cứu luật cơ bản hoặc bạn có thể nâng cấp gói để mở rộng lượt.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-teal-600 shrink-0" />
                        Điều gì xảy ra khi đầy dung lượng lưu trữ?
                      </div>
                      <p className="m-0 leading-relaxed text-slate-500 text-[11.5px]">
                        Hồ sơ và chứng từ đã tải lên được bảo lưu an toàn vĩnh viễn. Để tải thêm hóa đơn/chứng từ mới, bạn có thể dọn dẹp tệp cũ hoặc nâng cấp gói lưu trữ lớn hơn (10 GB / 30 GB).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'history',
            label: (
              <span className="flex items-center gap-2 px-1 font-bold text-xs md:text-sm">
                <Receipt className="w-4 h-4" />
                Lịch Sử Hóa Đơn &amp; Thanh Toán
              </span>
            ),
            children: (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-teal-600" />
                      Lịch Sử Đăng Ký &amp; Hóa Đơn Dịch Vụ
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Xem và tải biên lai thanh toán thuê bao hợp lệ phục vụ hạch toán chi phí thuế doanh nghiệp
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Mã hóa đơn</th>
                        <th className="py-3 px-4">Gói dịch vụ</th>
                        <th className="py-3 px-4">Số tiền</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Phương thức</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Biên nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {invoices.length > 0 ? (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.code}</td>
                            <td className="py-3 px-4 font-bold text-teal-900">{inv.planName}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {inv.amountVnd.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(inv.paidAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                {inv.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Tag color="success" className="font-semibold text-[11px] m-0">
                                Thành công
                              </Tag>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="small"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setInvoiceModalOpen(true);
                                }}
                                className="text-xs font-semibold rounded-lg text-slate-700 hover:text-teal-700"
                              >
                                Xem biên nhận
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Chưa ghi nhận hóa đơn thanh toán nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* 3. Modal Nâng Cấp / Kích Hoạt Gói (VietQR & Sandbox) */}
      <Modal
        title={null}
        open={upgradeModalOpen}
        onCancel={() => setUpgradeModalOpen(false)}
        footer={null}
        width={560}
        centered
        className="celra-rounded-modal"
      >
        {selectedPlanForUpgrade && (
          <div className="p-4 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Xác Nhận Đăng Ký {selectedPlanForUpgrade.name}
              </h3>
              <p className="text-xs text-slate-500">
                Gói sẽ được kích hoạt ngay lập tức cho doanh nghiệp <strong>{activeOrg?.name}</strong> trong vòng 30 ngày.
              </p>
            </div>

            {/* Chi tiết chi phí */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Gói lựa chọn:</span>
                <span className="font-bold text-slate-900">{selectedPlanForUpgrade.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Thời hạn sử dụng:</span>
                <span className="font-bold text-slate-900">30 ngày kể từ ngày kích hoạt</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Hạn mức AI Chatbox:</span>
                <span className="font-bold text-teal-700">{selectedPlanForUpgrade.aiChatboxMonthlyLimit} lượt/tháng</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm font-extrabold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-teal-700 font-mono">
                  {selectedPlanForUpgrade.priceVnd.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700">Chọn phương thức thanh toán:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  block
                  loading={isProcessing}
                  onClick={() => handleConfirmUpgrade('VietQR')}
                  className="h-12 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 border-none shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Thanh Toán VietQR Thật
                </Button>

                <Button
                  block
                  loading={isProcessing}
                  onClick={() => handleConfirmUpgrade('Sandbox')}
                  className="h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-indigo-600" />
                  Mô Phỏng Sandbox
                </Button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              Sau khi thanh toán thành công, hóa đơn VAT điện tử sẽ được tự động xuất và lưu vào mục Lịch sử Hóa đơn.
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Modal Chi Tiết Hóa Đơn Điện Tử */}
      <Modal
        title={null}
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        width={480}
        centered
      >
        {selectedInvoice && (
          <div className="p-4 space-y-5">
            <div className="text-center space-y-1">
              <Receipt className="w-8 h-8 text-teal-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">BIÊN NHẬN THANH TOÁN DỊCH VỤ</h3>
              <div className="text-xs text-slate-400 font-mono">{selectedInvoice.code}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">{activeOrg?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã số thuế:</span>
                <span className="font-bold font-mono text-slate-900">{activeOrg?.taxCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-teal-800">{selectedInvoice.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-semibold text-slate-700">{selectedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian thanh toán:</span>
                <span className="font-medium text-slate-700">{new Date(selectedInvoice.paidAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-sm font-extrabold text-slate-900">Số tiền:</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {selectedInvoice.amountVnd.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-200">
              💡 {selectedInvoice.taxNote || 'Biên nhận điện tử hợp lệ phục vụ khấu trừ thuế TNDN theo quy định.'}
            </div>

            <Button
              block
              onClick={() => setInvoiceModalOpen(false)}
              className="h-10 rounded-xl font-bold text-xs bg-slate-900 text-white"
            >
              Đóng
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionPage;
