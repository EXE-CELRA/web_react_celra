import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  AlertTriangle, 
  RotateCcw
} from 'lucide-react';
import { Button, Radio, Input, message, Result, Tag } from 'antd';
import axios from 'axios';

export const MobileSandboxPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Params from QR Code URL
  const orderCode = searchParams.get('code') || `SBX-${Date.now()}`;
  const packageId = searchParams.get('pkg') || 'PKG_120';
  const orgId = searchParams.get('orgId') || '';
  const priceVnd = parseInt(searchParams.get('amount') || '200000', 10);

  const getPackageName = (id: string) => {
    if (id === 'PKG_50') return 'Gói Khởi Động (+50 Credit)';
    if (id === 'PKG_120') return 'Gói Tiêu Chuẩn (+120 Credit)';
    if (id === 'PKG_450') return 'Gói Doanh Nghiệp (+450 Credit)';
    return `Nạp Credit CELRA (${priceVnd.toLocaleString()}đ)`;
  };

  const packageName = getPackageName(packageId);

  // Số dư tài khoản ngân hàng ảo trên điện thoại
  const [virtualBalance, setVirtualBalance] = useState<number>(() => {
    const saved = localStorage.getItem('celra_mobile_virtual_balance');
    return saved ? parseInt(saved, 10) : 5000000;
  });

  const [pinCode, setPinCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [selectedFailureReason, setSelectedFailureReason] = useState<string>('Số dư tài khoản nguồn không đủ');
  const [paymentResult, setPaymentResult] = useState<{
    status: 'success' | 'failed';
    message: string;
    code: string;
  } | null>(null);

  const updateBalance = (newBal: number) => {
    setVirtualBalance(newBal);
    localStorage.setItem('celra_mobile_virtual_balance', newBal.toString());
  };

  const getApiBaseUrl = () => {
    // Nếu trên điện thoại đang truy cập qua IP LAN hoặc domain
    const host = window.location.hostname;
    return `http://${host}:3000/api/v1`;
  };

  // 🟢 KỊCH BẢN 1: THÀNH CÔNG TỪ ĐIỆN THOẠI
  const handleConfirmPayment = async () => {
    if (virtualBalance < priceVnd) {
      message.error('Số dư ngân hàng ảo không đủ. Vui lòng bấm Nạp lại số dư ảo.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${getApiBaseUrl()}/wallets/sandbox-payment`, {
        orgId,
        orderCode,
        packageId,
        amount: priceVnd,
        outcome: 'SUCCESS',
        bankName: 'MBBank Mobile (Quét từ điện thoại)',
      });

      // Trừ tiền ảo trên điện thoại
      const newBal = virtualBalance - priceVnd;
      updateBalance(newBal);

      setPaymentResult({
        status: 'success',
        code: orderCode,
        message: res.data?.message || 'Thanh toán thành công từ điện thoại!',
      });
      message.success('🎉 Thanh toán thành công! Màn hình máy tính của bạn sẽ tự động nhảy số!');
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi khi gửi yêu cầu thanh toán: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 🔴 KỊCH BẢN 2: THẤT BẠI TỪ ĐIỆN THOẠI
  const handleSimulateFailure = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${getApiBaseUrl()}/wallets/sandbox-payment`, {
        orgId,
        orderCode,
        packageId,
        amount: priceVnd,
        outcome: 'FAILED',
        failureReason: selectedFailureReason,
        bankName: 'MBBank Mobile (Quét từ điện thoại)',
      });

      setPaymentResult({
        status: 'failed',
        code: orderCode,
        message: res.data?.message || `Giao dịch thất bại: ${selectedFailureReason}. Đã hoàn tiền về tài khoản.`,
      });
      message.warning('Đã mô phỏng thất bại & ghi nhận hoàn tiền!');
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi khi gửi yêu cầu thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl font-sans">
      {/* Top Header Mock App Ngân Hàng */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 pt-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide">MBBank Mobile Gateway</div>
              <div className="text-[10px] text-teal-300 uppercase tracking-widest font-semibold">
                Mô phỏng Thanh Toán Sandbox
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-xs">
            TEST MODE
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4 flex-1">
        {paymentResult ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-4 text-center space-y-4">
            {paymentResult.status === 'success' ? (
              <Result
                status="success"
                title={<span className="text-emerald-700 font-bold text-lg">Thanh Toán Thành Công!</span>}
                subTitle={
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>Bạn đã chuyển khoản thành công <strong>{priceVnd.toLocaleString()} ₫</strong> qua cổng ngân hàng ảo.</p>
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium">
                      🚀 <strong>Màn hình máy tính của bạn đã tự động cập nhật số dư!</strong> Bạn có thể quay lại máy tính để tiếp tục làm việc.
                    </div>
                    <p className="font-mono text-slate-400 text-[11px]">Mã GD: {paymentResult.code}</p>
                  </div>
                }
                extra={[
                  <Button
                    key="retry"
                    block
                    type="primary"
                    onClick={() => setPaymentResult(null)}
                    className="bg-slate-900 hover:bg-slate-800 font-bold mt-2"
                  >
                    Thử Lại Giao Dịch Khác
                  </Button>
                ]}
              />
            ) : (
              <Result
                status="error"
                title={<span className="text-rose-700 font-bold text-lg">Giao Dịch Bị Hủy / Thất Bại</span>}
                subTitle={
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>{paymentResult.message}</p>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium">
                      🛡️ <strong>Đã ghi nhận giao dịch lỗi &amp; bảo toàn số dư!</strong> Màn hình máy tính cũng đã lưu vết sự cố này vào Sổ Cái.
                    </div>
                  </div>
                }
                extra={[
                  <Button
                    key="retry"
                    block
                    onClick={() => setPaymentResult(null)}
                    className="font-bold mt-2"
                  >
                    Thử Lại Lần Nữa
                  </Button>
                ]}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Banner Thông tin tài khoản ảo */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  Ví Ngân Hàng Thử Nghiệm
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateBalance(5000000);
                    message.success('Đã nạp lại 5.000.000đ vào ví ảo!');
                  }}
                  className="text-[11px] text-teal-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Nạp lại 5 triệu
                </button>
              </div>

              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[11px] text-slate-400 block">Số dư tài khoản ảo:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {virtualBalance.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-white block">NGUYEN VAN A</span>
                  <span className="text-[11px] text-slate-400 font-mono">0987654321</span>
                </div>
              </div>
            </div>

            {/* Chi tiết đơn hàng CELRA */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span>Chi Tiết Thanh Toán</span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold">
                  {orderCode.substring(0, 16)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Đơn vị thụ hưởng:</span>
                <strong className="text-slate-900">CÔNG TY CP CÔNG NGHỆ CELRA</strong>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Gói dịch vụ:</span>
                <Tag color="cyan" className="font-bold m-0">{packageName}</Tag>
              </div>

              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-900">Tổng tiền chuyển:</span>
                <span className="text-lg font-black font-mono text-indigo-700">
                  {priceVnd.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Mã xác thực PIN/OTP */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Mã PIN / OTP xác thực:</span>
                  <span className="text-[11px] text-slate-400">Mặc định mã demo</span>
                </div>
              </div>
              <Input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                style={{ width: 90, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}
                maxLength={6}
              />
            </div>

            {/* Khung hành động kịch bản */}
            <div className="space-y-3 pt-2">
              {/* 🟢 Nút Thành công */}
              <Button
                type="primary"
                block
                size="large"
                loading={loading}
                onClick={handleConfirmPayment}
                className="bg-emerald-600 hover:bg-emerald-700 font-extrabold shadow-md shadow-emerald-600/25 h-12 flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>XÁC NHẬN CHUYỂN TIỀN (THÀNH CÔNG)</span>
              </Button>

              {/* 🔴 Nút Thất bại */}
              <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200 space-y-2">
                <div className="text-[11px] font-bold text-rose-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Kịch Bản Demo: Giả Lập Lỗi
                  </span>
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-100 px-1.5 py-0.2 rounded">
                    Bắt lỗi
                  </span>
                </div>

                <Radio.Group
                  value={selectedFailureReason}
                  onChange={(e) => setSelectedFailureReason(e.target.value)}
                  className="w-full flex flex-col gap-1 text-[11px]"
                >
                  <Radio value="Số dư tài khoản nguồn không đủ">Số dư tài khoản nguồn không đủ</Radio>
                  <Radio value="Mã OTP / PIN xác thực đã hết hạn">Mã OTP / PIN không đúng</Radio>
                  <Radio value="Hệ thống ngân hàng đối tác bảo trì">Ngân hàng đối tác bảo trì</Radio>
                </Radio.Group>

                <Button
                  danger
                  block
                  loading={loading}
                  onClick={handleSimulateFailure}
                  className="font-bold bg-white text-rose-700 border-rose-300 hover:bg-rose-50 h-10 flex items-center justify-center gap-1.5 text-xs"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>KÍCH HOẠT GIAO DỊCH THẤT BẠI</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[10px] text-slate-400 border-t border-slate-200 bg-white">
        <p>Cổng mô phỏng thanh toán đa nền tảng CELRA &copy; {new Date().getFullYear()}</p>
        <p className="mt-0.5 text-slate-500">Môi trường kiểm thử Sandbox an toàn — Không trừ tiền thật</p>
      </footer>
    </div>
  );
};
