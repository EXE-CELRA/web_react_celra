import type { VietQRModalProps } from '../../interfaces';
import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Button, message, Space, Spin, Image, Alert, Tag, Segmented, QRCode } from 'antd';
import {
  QrcodeOutlined,
  CopyOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  BankOutlined,
  InfoCircleOutlined,
  CreditCardOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useWalletStore } from '../../store/useWalletStore';
import { useOrgStore } from '../../store/useOrgStore';
import { SandboxBankingModal } from './SandboxBankingModal';
import apiClient from '../../api/client';



export const VietQRModal: React.FC<VietQRModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialPackage,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'mobile_sandbox' | 'vietqr_real'>('mobile_sandbox');
  const [qrData, setQrData] = useState<{
    qrCodeUrl: string;
    checkoutUrl?: string;
    orderCode: string;
    amount: number;
    description?: string;
    accountNo?: string;
    accountName?: string;
    bankId?: string;
  } | null>(null);

  const { generateDepositQR, fetchWallet, buyPackage } = useWalletStore();
  const { activeOrg } = useOrgStore();

  const getMobileSandboxUrl = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = isLocal ? '10.10.126.1' : window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const code = qrData?.orderCode || `SBX-${Date.now()}`;
    const pkg = initialPackage?.id || 'PKG_120';
    const amount = qrData?.amount || initialPackage?.priceVnd || 200000;
    const org = activeOrg?.id || '';
    return `${protocol}//${host}${port}/sandbox-pay?code=${encodeURIComponent(code)}&pkg=${encodeURIComponent(pkg)}&amount=${amount}&orgId=${encodeURIComponent(org)}`;
  };

  // Tự động lắng nghe tín hiệu thanh toán từ điện thoại
  useEffect(() => {
    if (!visible || !qrData?.orderCode) return;

    let isPolling = true;
    const interval = setInterval(async () => {
      if (!isPolling) return;
      try {
        const res: any = await apiClient.get(`/wallets/sandbox-status/${encodeURIComponent(qrData.orderCode)}`);
        if (res && res.found) {
          isPolling = false;
          clearInterval(interval);
          if (res.status === 'success') {
            message.success('🎉 Đã nhận diện thanh toán thành công từ điện thoại!');
            await fetchWallet();
            onClose();
            if (onSuccess) onSuccess();
          } else if (res.status === 'failed') {
            message.error(`⚠️ Giao dịch từ điện thoại bị từ chối / hủy bỏ`);
            await fetchWallet();
          }
        }
      } catch (err) {
        // silent fail during polling
      }
    }, 1500);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [visible, qrData?.orderCode]);

  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (initialPackage) {
        handleGenerateForPackage(initialPackage);
      } else {
        setQrData(null);
      }
    } else {
      setQrData(null);
      setErrorMessage(null);
    }
  }, [visible, initialPackage]);

  const handleGenerateForPackage = async (pkg: {
    id: string;
    name: string;
    credits: number;
    priceVnd: number;
  }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await generateDepositQR(
        pkg.priceVnd,
        `NAP ${pkg.id}`,
        pkg.id,
      );
      setQrData({
        ...res,
        amount: pkg.priceVnd,
        description: `Thanh toán gói ${pkg.name}`,
      });
    } catch (err: any) {
      console.error('Lỗi khi tạo mã VietQR:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tạo mã VietQR';
      const displayMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      setErrorMessage(displayMsg);
      message.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustom = async (values: { amount: number; description?: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await generateDepositQR(values.amount, values.description);
      setQrData({
        ...res,
        amount: values.amount,
        description: values.description || `Nạp tiền ví CELRA`,
      });
      message.success('Tạo mã VietQR thanh toán thành công!');
    } catch (err: any) {
      console.error('Lỗi khi tạo mã VietQR:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tạo mã VietQR';
      const displayMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      setErrorMessage(displayMsg);
      message.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePaymentCheck = async () => {
    setLoading(true);
    try {
      if (initialPackage) {
        await buyPackage(initialPackage.id);
        message.success(`🎉 Đã nạp thành công ${initialPackage.name} (+${initialPackage.credits} Credit)!`);
      } else {
        await fetchWallet();
        message.success('Đã làm mới số dư ví Credit!');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Lỗi khi xác nhận giao dịch:', err);
      message.error(err.response?.data?.message || err.message || 'Lỗi khi xác nhận giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}`);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <QrcodeOutlined className="text-lg" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800">
              {initialPackage
                ? `Thanh Toán Gói ${initialPackage.name}`
                : 'Nạp Tiền Vào Ví Qua VietQR'}
            </div>
            {initialPackage && (
              <div className="text-xs text-slate-500 font-normal">
                Nhận ngay <strong className="text-teal-600">+{initialPackage.credits} Credit</strong> vào số dư khả dụng
              </div>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      centered
    >
      {/* CASE 1: Đang nạp theo Gói Credit cụ thể */}
      {initialPackage ? (
        <div className="pt-2 space-y-4">
          {/* Package Overview Card */}
          <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/80 rounded-xl p-3.5 border border-teal-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Tag color="cyan" className="font-semibold m-0">
                  {initialPackage.name}
                </Tag>
                <span className="text-xs font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-md">
                  +{initialPackage.credits} Credit
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Quy đổi: Rà soát được ~<strong>{Math.floor(initialPackage.credits / 25)}</strong> thẻ bối cảnh pháp lý
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Số tiền cần nạp</div>
              <div className="text-lg font-extrabold text-teal-800 font-mono">
                {initialPackage.priceVnd.toLocaleString('vi-VN')} ₫
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && !qrData && (
            <div className="py-12 text-center space-y-3">
              <Spin size="large" />
              <div className="text-sm font-medium text-slate-600">
                Đang khởi tạo mã VietQR cho gói <strong>{initialPackage.name}</strong>...
              </div>
              <div className="text-xs text-slate-400">
                Vui lòng đợi giây lát, hệ thống đang tạo mã QR kèm số tiền và nội dung chuyển khoản tự động
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMessage && !qrData && !loading && (
            <Alert
              type="error"
              showIcon
              message="Không thể tạo mã VietQR"
              description={
                <div className="space-y-2 mt-1">
                  <div>{errorMessage}</div>
                  <Button
                    size="small"
                    type="primary"
                    danger
                    icon={<ReloadOutlined />}
                    onClick={() => handleGenerateForPackage(initialPackage)}
                  >
                    Thử tạo lại mã QR
                  </Button>
                </div>
              }
            />
          )}

          {/* QR Code & Transfer Details */}
          {qrData && (
            <div className="space-y-4">
              {/* Mode Switcher: Mobile Sandbox vs Real VietQR */}
              <div className="flex justify-center">
                <Segmented
                  value={qrMode}
                  onChange={(val) => setQrMode(val as any)}
                  options={[
                    {
                      label: (
                        <div className="flex items-center gap-1.5 px-2 py-1 font-bold text-xs">
                          <MobileOutlined className="text-indigo-600" />
                          <span>📱 Quét Bằng Điện Thoại Thật (Sandbox)</span>
                        </div>
                      ),
                      value: 'mobile_sandbox',
                    },
                    {
                      label: (
                        <div className="flex items-center gap-1.5 px-2 py-1 font-medium text-xs">
                          <BankOutlined />
                          <span>Quét VietQR Thật (MB)</span>
                        </div>
                      ),
                      value: 'vietqr_real',
                    },
                  ]}
                />
              </div>

              {/* QR Image Box */}
              {qrMode === 'mobile_sandbox' ? (
                <div className="bg-gradient-to-b from-indigo-50/70 to-slate-50 rounded-2xl p-4 border border-indigo-200/80 flex flex-col items-center justify-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl border-2 border-indigo-500 shadow-md inline-block">
                    <QRCode
                      value={getMobileSandboxUrl()}
                      size={220}
                      bordered={false}
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5">
                      <MobileOutlined className="text-indigo-600" />
                      Lấy Điện Thoại Thật (Camera / Zalo) quét mã này
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-xs">
                      Điện thoại sẽ mở giao diện Cổng Ngân Hàng ảo để bạn bấm thanh toán thử nghiệm.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-300 animate-pulse">
                    <Spin size="small" />
                    <span>Đang chờ bạn bấm xác nhận trên điện thoại... (Tự động nhận diện)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block">
                    <Image
                      src={qrData.qrCodeUrl}
                      alt="VietQR Code"
                      width={220}
                      preview={{ mask: 'Phóng to mã QR' }}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 text-center mt-2.5 max-w-xs">
                    Mở ứng dụng <strong>Ngân hàng</strong> bất kỳ (MB, VCB, Techcombank, ...) quét mã để chuyển tiền thật
                  </div>
                </div>
              )}

              {/* Bank Transfer Details Table */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <BankOutlined className="text-slate-400" /> Ngân hàng nhận:
                  </span>
                  <span className="font-bold text-slate-800">MBBank (Ngân hàng Quân Đội)</span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {qrData.accountNo || '0987654321'}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      className="text-teal-600 hover:text-teal-700"
                      onClick={() => copyToClipboard(qrData.accountNo || '0987654321', 'Số tài khoản')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {qrData.accountName || 'CONG TY CP CONG NGHE CELRA'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500">Số tiền chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-teal-700 text-sm">
                      {qrData.amount.toLocaleString('vi-VN')} ₫
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      className="text-teal-600 hover:text-teal-700"
                      onClick={() => copyToClipboard(qrData.amount.toString(), 'Số tiền')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {qrData.orderCode}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      className="text-amber-700 hover:text-amber-800"
                      onClick={() => copyToClipboard(qrData.orderCode, 'Nội dung chuyển khoản')}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
                <InfoCircleOutlined className="text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Vui lòng giữ nguyên <strong>nội dung chuyển khoản</strong> để hệ thống SePay tự động nhận diện và nạp ngay <strong>+{initialPackage.credits} Credit</strong> vào ví của bạn.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  block
                  size="large"
                  icon={<CreditCardOutlined />}
                  onClick={() => setSandboxModalOpen(true)}
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    height: 42,
                  }}
                >
                  Mở Cổng Thanh Toán Sandbox (Trừ Tiền Ảo)
                </Button>

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CheckCircleFilled />}
                  loading={loading}
                  onClick={handleCompletePaymentCheck}
                  className="bg-teal-600 hover:bg-teal-700 font-bold shadow-md shadow-teal-600/20"
                >
                  Tôi Đã Chuyển Khoản Ngân Hàng Thật
                </Button>
                <Button block onClick={onClose}>
                  Đóng cửa sổ
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CASE 2: Nạp tiền tùy chỉnh nếu không chọn gói */
        <div className="pt-2">
          {!qrData ? (
            <Form form={form} layout="vertical" onFinish={handleGenerateCustom} initialValues={{ amount: 100000 }}>
              <Form.Item
                name="amount"
                label="Số tiền nạp (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: any) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                  step={50000}
                  min={10000}
                />
              </Form.Item>

              <Form.Item name="description" label="Nội dung chuyển khoản (Gợi ý)">
                <Input placeholder="CELRA DEPOSIT..." />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading} block size="large" className="bg-teal-600 hover:bg-teal-700">
                Tạo Mã VietQR Thanh Toán
              </Button>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block">
                  <Image
                    src={qrData.qrCodeUrl}
                    alt="VietQR"
                    width={220}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div className="text-xs text-slate-500 text-center mt-2.5">
                  Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển khoản tự động.
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500">Số tiền:</span>
                  <span className="font-mono font-bold text-teal-700 text-sm">
                    {qrData.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mã giao dịch / Nội dung:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{qrData.orderCode}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(qrData.orderCode, 'Nội dung')}
                    />
                  </div>
                </div>
              </div>

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleCompletePaymentCheck}
                  loading={loading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Tôi Đã Chuyển Khoản Thành Công
                </Button>
                <Button onClick={() => setQrData(null)} block>
                  Tạo giao dịch khác
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}

      {/* Modal Sandbox Banking */}
      <SandboxBankingModal
        visible={sandboxModalOpen}
        onClose={() => setSandboxModalOpen(false)}
        packageInfo={initialPackage}
        customAmount={qrData?.amount}
        onSuccess={() => {
          setSandboxModalOpen(false);
          onClose();
          if (onSuccess) onSuccess();
        }}
      />
    </Modal>
  );
};
