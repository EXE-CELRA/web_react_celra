import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, message } from 'antd';
import { 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  Wallet, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck,
  Zap,
  Check,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import { VietQRModal } from '../../components/common/VietQRModal';
import { SandboxBankingModal } from '../../components/common/SandboxBankingModal';
import { ElectronicReceiptModal } from '../../components/common/ElectronicReceiptModal';
import type { CreditPackage } from '../../types';

export const WalletPage: React.FC = () => {
  const { wallet, ledgers, packages, fetchWallet, fetchLedgers, fetchPackages, isLoading } = useWalletStore();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [sandboxPackage, setSandboxPackage] = useState<CreditPackage | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    fetchWallet();
    fetchLedgers();
    fetchPackages();
  }, []);

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setQrModalOpen(true);
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (date: string, record: any) => {
        const val = date || record.createdAt;
        return val ? new Date(val).toLocaleString('vi-VN') : 'Vừa xong';
      },
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      width: 170,
      render: (type: string) => {
        if (type === 'deposit') {
          return <Tag color="green">Nạp Gói Credit</Tag>;
        }
        if (type === 'capture') {
          return <Tag color="blue">Rà Soát Tuân Thủ</Tag>;
        }
        if (type === 'hold') {
          return <Tag color="orange">Tạm Giữ Ký Quỹ</Tag>;
        }
        if (type === 'refund') {
          return <Tag color="purple">Hoàn Trả Credit</Tag>;
        }
        return <Tag color="default">{type || 'Giao dịch'}</Tag>;
      },
    },
    {
      title: 'Biến động Credit',
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      render: (amount: number, record: any) => {
        const isPositive = record.type === 'deposit' || record.type === 'refund';
        return (
          <span className={`font-bold font-mono text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : '-'} {Math.abs(amount).toLocaleString()} Credit
          </span>
        );
      },
    },
    {
      title: 'Chi tiết giao dịch',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (taskName: string, record: any) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs">{taskName || 'Giao dịch ví CELRA'}</div>
          {record.note && <div className="text-[11px] text-slate-500 mt-0.5">{record.note}</div>}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        if (status === 'success') {
          return (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
            </span>
          );
        }
        if (status === 'failed') {
          return (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Thất bại / Lỗi
            </span>
          );
        }
        if (status === 'refunded') {
          return (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Đã hoàn tiền
            </span>
          );
        }
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Đang xử lý'}
          </span>
        );
      },
    },
    {
      title: 'Chứng từ',
      key: 'actions',
      width: 110,
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="link"
          icon={<Receipt className="w-3.5 h-3.5 text-teal-600" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTx(record);
            setReceiptModalOpen(true);
          }}
          className="text-teal-700 font-semibold p-0 flex items-center gap-1 text-xs"
        >
          Biên nhận
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-400/30">
              CELRA Credit Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <Coins className="w-6 h-6 text-teal-400" />
            Ví &amp; Quản Lý Gói Credit Doanh Nghiệp
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Hệ thống thanh toán tính phí linh hoạt theo từng gói Credit — Không chi phí duy trì cố định — 
            Chỉ khấu trừ Credit khi thực hiện rà soát bối cảnh hoặc khởi tạo checklist tuân thủ pháp lý.
          </p>
        </div>

        <Button
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={() => {
            fetchWallet();
            fetchLedgers();
            message.success('Đã đồng bộ số dư ví mới nhất');
          }}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 shrink-0 self-start md:self-auto cursor-pointer"
        >
          Làm mới số dư
        </Button>
      </div>

      {/* 2. Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Available Credit Balance */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Số dư Credit khả dụng
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-950 mt-1 font-mono flex items-baseline gap-1.5">
                {wallet ? wallet.balance.toLocaleString() : '0'}
                <span className="text-sm font-bold text-teal-700 font-sans">Credit</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Sẵn sàng cho mọi lượt kiểm tra &amp; rà soát
              </div>
            </div>
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Cost per Audit */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Chi phí rà soát tiêu chuẩn
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-mono flex items-baseline gap-1.5">
                25
                <span className="text-sm font-bold text-blue-700 font-sans">Credit / thẻ</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <Zap className="w-3.5 h-3.5 text-blue-600" /> Tương đương ~
                {wallet ? Math.floor(wallet.balance / 25) : 0} lượt rà soát bối cảnh
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CREDIT PACKAGES (3 Pricing Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Chọn Gói Nạp Credit VietQR Tức Thì
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn gói phù hợp để thanh toán tự động qua VietQR. Credit sẽ được cộng vào số dư ngay sau khi xác nhận.
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Hỗ trợ VietQR 24/7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 transition-all duration-200 relative flex flex-col justify-between ${
                  isPopular
                    ? 'bg-gradient-to-b from-teal-50/60 to-white border-2 border-teal-500 shadow-md ring-4 ring-teal-500/10'
                    : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    {pkg.badge || 'Phổ biến nhất'}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {pkg.name}
                    </span>
                    {!isPopular && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold text-slate-900 font-mono">
                      +{pkg.credits}{' '}
                      <span className="text-lg font-bold text-teal-700 font-sans">Credit</span>
                    </div>
                    <div className="text-lg font-bold text-slate-700 mt-1">
                      {pkg.priceVnd.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    💡 {pkg.bonusText}
                  </p>

                  <ul className="text-xs text-slate-600 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Rà soát ~<strong>{Math.floor(pkg.credits / 25)}</strong> thẻ context bối cảnh</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Kích hoạt Rule Engine &amp; sinh Checklist</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Không giới hạn thời hạn sử dụng Credit</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                      isPopular
                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Nạp VietQR Thật ({pkg.priceVnd.toLocaleString('vi-VN')} ₫)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSandboxPackage(pkg);
                      setSandboxModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mô phỏng Sandbox (Trừ tiền ảo)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Ledger Transaction History */}
      <Card
        title={
          <div className="flex items-center gap-2 py-1">
            <Coins className="w-5 h-5 text-teal-600" />
            <span className="font-bold text-slate-900">Nhật Ký Biến Động Số Dư Credit (Ledger)</span>
          </div>
        }
        extra={
          <Button
            size="small"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              fetchWallet();
              fetchLedgers();
            }}
          >
            Làm mới sổ cái
          </Button>
        }
        className="rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <Table
          dataSource={ledgers}
          columns={columns}
          rowKey={(record: any) => record.id || record.code || Math.random().toString()}
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedTx(record);
              setReceiptModalOpen(true);
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 5. VietQR Modal for Selected Package */}
      <VietQRModal
        visible={qrModalOpen}
        initialPackage={selectedPackage}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedPackage(null);
        }}
        onSuccess={() => {
          fetchWallet();
          fetchLedgers();
        }}
      />

      {/* 6. Sandbox Banking Modal */}
      <SandboxBankingModal
        visible={sandboxModalOpen}
        packageInfo={sandboxPackage}
        onClose={() => {
          setSandboxModalOpen(false);
          setSandboxPackage(null);
        }}
        onSuccess={() => {
          fetchWallet();
          fetchLedgers();
        }}
      />

      {/* 7. Electronic Receipt Modal */}
      <ElectronicReceiptModal
        visible={receiptModalOpen}
        transaction={selectedTx}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTx(null);
        }}
      />
    </div>
  );
};
