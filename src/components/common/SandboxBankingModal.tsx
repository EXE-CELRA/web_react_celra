import type { SandboxBankingModalProps } from '../../interfaces';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Radio, Input, message, Tag, Space, Divider, Result } from 'antd';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';



export const SandboxBankingModal: React.FC<SandboxBankingModalProps> = ({
  visible,
  onClose,
  onSuccess,
  packageInfo,
  customAmount,
}) => {
  const { processSandboxPayment, fetchWallet, fetchLedgers } = useWalletStore();

  const priceVnd = packageInfo?.priceVnd || customAmount || 100000;
  const credits = packageInfo?.credits || (priceVnd === 100000 ? 50 : priceVnd === 200000 ? 120 : priceVnd === 500000 ? 450 : Math.round(priceVnd / 2000));
  const packageName = packageInfo?.name || `Nạp ${credits} Credit`;

  // Số dư tài khoản ngân hàng ảo được lưu trong localStorage để mô phỏng chân thực
  const [virtualBalance, setVirtualBalance] = useState<number>(() => {
    const saved = localStorage.getItem('celra_virtual_bank_balance');
    return saved ? parseInt(saved, 10) : 5000000; // Khởi đầu 5.000.000 VND
  });

  const [pinCode, setPinCode] = useState<string>('123456');
  const [loading, setLoading] = useState(false);
  const [selectedFailureReason, setSelectedFailureReason] = useState<string>('Số dư tài khoản nguồn không đủ');
  const [customFailureText] = useState<string>('');
  const [resultState, setResultState] = useState<{
    status: 'success' | 'failed';
    code: string;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setResultState(null);
      setPinCode('123456');
    }
  }, [visible]);

  const updateVirtualBalance = (newBalance: number) => {
    setVirtualBalance(newBalance);
    localStorage.setItem('celra_virtual_bank_balance', newBalance.toString());
  };

  const resetVirtualBalance = () => {
    updateVirtualBalance(5000000);
    message.success('Đã nạp lại 5.000.000đ vào tài khoản ngân hàng ảo!');
  };

  // 🟢 KỊCH BẢN 1: THANH TOÁN THÀNH CÔNG
  const handleSimulateSuccess = async () => {
    if (virtualBalance < priceVnd) {
      message.error(`Số dư ngân hàng ảo (${virtualBalance.toLocaleString()}đ) không đủ để thanh toán ${priceVnd.toLocaleString()}đ. Bạn có thể bấm "Nạp thêm số dư ảo" bên dưới.`);
      return;
    }

    setLoading(true);
    try {
      const res = await processSandboxPayment({
        packageId: packageInfo?.id,
        amount: priceVnd,
        outcome: 'SUCCESS',
        bankName: 'MBBank - 0987654321',
      });

      // Trừ tiền ngân hàng ảo
      const newBal = virtualBalance - priceVnd;
      updateVirtualBalance(newBal);

      setResultState({
        status: 'success',
        code: res.code,
        message: `Đã thanh toán thành công ${priceVnd.toLocaleString('vi-VN')} ₫. Ví CELRA đã nhận ngay +${credits} Credit!`,
        details: res,
      });

      await fetchWallet();
      await fetchLedgers();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Lỗi khi xử lý thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // 🔴 KỊCH BẢN 2: MÔ PHỎNG THẤT BẠI & HOÀN TIỀN
  const handleSimulateFailure = async () => {
    setLoading(true);
    const reason = selectedFailureReason === 'other' ? (customFailureText || 'Lỗi từ chối giao dịch') : selectedFailureReason;
    try {
      const res = await processSandboxPayment({
        packageId: packageInfo?.id,
        amount: priceVnd,
        outcome: 'FAILED',
        failureReason: reason,
        bankName: 'MBBank - 0987654321',
      });

      setResultState({
        status: 'failed',
        code: res.code,
        message: `Giao dịch thất bại: "${reason}". Tiền đã được giữ an toàn và hoàn trả về tài khoản nguồn.`,
        details: res,
      });

      await fetchWallet();
      await fetchLedgers();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Lỗi khi xử lý mô phỏng thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={560}
      centered
      title={
        <div className="flex items-center justify-between pr-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Cổng Thanh Toán Giả Lập (Sandbox Banking)</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Mô phỏng quy trình trừ tiền tài khoản ảo &amp; kiểm thử 2 kịch bản
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
            Sandbox Demo
          </span>
        </div>
      }
    >
      {/* NẾU ĐÃ CÓ KẾT QUẢ GIAO DỊCH (THÀNH CÔNG HOẶC THẤT BẠI) */}
      {resultState ? (
        <div className="py-4 space-y-4">
          {resultState.status === 'success' ? (
            <Result
              status="success"
              title={<span className="text-emerald-700 font-bold">Thanh Toán Sandbox Thành Công!</span>}
              subTitle={
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p>{resultState.message}</p>
                  <p className="font-mono text-slate-500">Mã giao dịch: <strong>{resultState.code}</strong></p>
                </div>
              }
              extra={[
                <div key="receipt" className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs font-mono mb-4">
                  <div className="flex justify-between border-b pb-1 text-slate-500">
                    <span>Dịch vụ nạp:</span>
                    <strong className="text-slate-800">{packageName}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1 text-slate-500">
                    <span>Số tiền trừ (Ngân hàng ảo):</span>
                    <strong className="text-emerald-700">-{priceVnd.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1 text-slate-500">
                    <span>Số Credit cộng ví CELRA:</span>
                    <strong className="text-teal-700">+{credits} Credit</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Số dư ngân hàng ảo còn lại:</span>
                    <strong className="text-slate-800">{virtualBalance.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                </div>,
                <Button
                  key="close"
                  type="primary"
                  block
                  size="large"
                  onClick={onClose}
                  className="bg-teal-600 hover:bg-teal-700 font-bold"
                >
                  Hoàn Tất &amp; Xem Sổ Cái Giao Dịch
                </Button>,
              ]}
            />
          ) : (
            <Result
              status="error"
              title={<span className="text-rose-700 font-bold">Giao Dịch Thất Bại &amp; Đã Hoàn Tiền!</span>}
              subTitle={
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p>{resultState.message}</p>
                  <p className="font-mono text-slate-500">Mã giao dịch lưu vết: <strong>{resultState.code}</strong></p>
                </div>
              }
              extra={[
                <div key="fail-info" className="bg-rose-50/70 rounded-xl p-4 border border-rose-200 text-left space-y-2 text-xs font-mono mb-4">
                  <div className="flex justify-between border-b border-rose-200/80 pb-1 text-rose-800">
                    <span>Trạng thái giao dịch:</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">FAILED (ĐÃ GHI NHẬN)</span>
                  </div>
                  <div className="flex justify-between border-b border-rose-200/80 pb-1 text-slate-600">
                    <span>Số tiền hoàn trả:</span>
                    <strong className="text-emerald-700">+{priceVnd.toLocaleString('vi-VN')} ₫ (0đ bị mất)</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Số dư ngân hàng ảo:</span>
                    <strong className="text-slate-800">{virtualBalance.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                </div>,
                <Space key="actions" className="w-full flex">
                  <Button block onClick={() => setResultState(null)}>
                    Thử Lại Kịch Bản Khác
                  </Button>
                  <Button type="primary" danger block onClick={onClose}>
                    Đóng Cửa Sổ
                  </Button>
                </Space>,
              ]}
            />
          )}
        </div>
      ) : (
        /* GIAO DIỆN XÁC NHẬN THANH TOÁN SANDBOX */
        <div className="space-y-5 pt-2">
          {/* Card 1: Tài khoản Ngân hàng Ảo của User */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-400" />
                Tài Khoản Nguồn (Mô phỏng App Ngân Hàng MB)
              </span>
              <button
                type="button"
                onClick={resetVirtualBalance}
                title="Khôi phục số dư ảo về 5.000.000đ"
                className="text-[11px] text-teal-300 hover:text-white flex items-center gap-1 cursor-pointer underline"
              >
                <RotateCcw className="w-3 h-3" />
                Nạp lại số dư ảo
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Số dư khả dụng tài khoản ảo:</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400">
                  {virtualBalance.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold text-white block">NGUYEN VAN A</span>
                <span className="text-slate-400 font-mono text-[11px]">STK: 0987654321 (MB)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Thông tin Giao dịch Đang Thanh Toán */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">Đơn vị thụ hưởng:</span>
              <span className="font-bold text-slate-800">CÔNG TY CP CÔNG NGHỆ CELRA</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">Dịch vụ mua:</span>
              <Tag color="cyan" className="font-semibold m-0">{packageName}</Tag>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500">Quyền lợi nhận được:</span>
              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                +{credits} Credit Ví CELRA
              </span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-500 font-bold">Số tiền thanh toán:</span>
              <span className="text-base font-extrabold font-mono text-indigo-700">
                {priceVnd.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Mã PIN / OTP xác thực */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-bold text-slate-700 block">Mã xác thực OTP / PIN Demo:</span>
                <span className="text-[11px] text-slate-400">Mặc định mã an toàn thử nghiệm</span>
              </div>
            </div>
            <Input
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              style={{ width: 100, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}
              maxLength={6}
            />
          </div>

          <Divider style={{ margin: '12px 0' }}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chọn Kịch Bản Thử Nghiệm
            </span>
          </Divider>

          {/* KHUNG THAO TÁC 2 KỊCH BẢN */}
          <div className="space-y-3">
            {/* 🟢 NÚT KỊCH BẢN 1: THÀNH CÔNG */}
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleSimulateSuccess}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>XÁC NHẬN THANH TOÁN (MÔ PHỎNG THÀNH CÔNG)</span>
            </Button>
            <div className="text-[11px] text-slate-400 text-center">
              Trừ {priceVnd.toLocaleString()}đ trong số dư ảo &rarr; Cộng ngay +{credits} Credit &rarr; Ghi nhận Ledger Thành công.
            </div>

            {/* 🔴 NÚT KỊCH BẢN 2: THẤT BẠI & HOÀN TIỀN */}
            <div className="pt-2 border-t border-dashed border-slate-200">
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Kịch Bản Demo: Giả Lập Giao Dịch Thất Bại
                  </span>
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-100 px-1.5 py-0.2 rounded">
                    Bắt lỗi &amp; Hoàn tiền
                  </span>
                </div>

                <Radio.Group
                  value={selectedFailureReason}
                  onChange={(e) => setSelectedFailureReason(e.target.value)}
                  className="w-full flex flex-col gap-1.5 text-xs"
                >
                  <Radio value="Số dư tài khoản nguồn không đủ">
                    <span className="text-xs text-slate-700">Tài khoản nguồn không đủ số dư</span>
                  </Radio>
                  <Radio value="Mã OTP / PIN xác thực đã hết hạn hoặc không đúng">
                    <span className="text-xs text-slate-700">Mã OTP / PIN không hợp lệ</span>
                  </Radio>
                  <Radio value="Hệ thống ngân hàng đối tác bảo trì kết nối">
                    <span className="text-xs text-slate-700">Ngân hàng đối tác bảo trì kết nối</span>
                  </Radio>
                </Radio.Group>

                <Button
                  danger
                  block
                  loading={loading}
                  onClick={handleSimulateFailure}
                  className="font-bold bg-white hover:bg-rose-50 border-rose-400 text-rose-700 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>KÍCH HOẠT GIAO DỊCH THẤT BẠI &amp; HOÀN TIỀN</span>
                </Button>
                <div className="text-[10px] text-rose-600 text-center">
                  Tạo transaction trạng thái `FAILED` &rarr; Giữ nguyên số dư &rarr; Lưu vết cảnh báo vào Sổ Cái CELRA.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
