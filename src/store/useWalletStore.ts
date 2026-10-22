import { create } from 'zustand';
import apiClient from '../api/client';
import type { WalletInfo, WalletLedger, CreditPackage } from '../types';

interface WalletState {
  wallet: WalletInfo | null;
  thongTinVi: WalletInfo | null;
  ledgers: WalletLedger[];
  danhSachGiaoDich: WalletLedger[];
  packages: CreditPackage[];
  danhSachGoiCredit: CreditPackage[];
  isLoading: boolean;
  dangTai: boolean;
  error: string | null;
  loi: string | null;

  fetchWallet: () => Promise<void>;
  layThongTinVi: () => Promise<void>;
  fetchLedgers: () => Promise<void>;
  layDanhSachGiaoDich: () => Promise<void>;
  fetchPackages: () => Promise<CreditPackage[]>;
  layDanhSachGoiCredit: () => Promise<CreditPackage[]>;
  buyPackage: (packageId: string) => Promise<any>;
  muaGoiCredit: (packageId: string) => Promise<any>;
  deposit: (amount: number, note?: string) => Promise<any>;
  napTien: (amount: number, note?: string) => Promise<any>;
  generateDepositQR: (
    amount: number,
    note?: string,
    packageId?: string,
  ) => Promise<{
    qrCodeUrl: string;
    checkoutUrl?: string;
    orderCode: string;
    amount: number;
    accountNo?: string;
    accountName?: string;
    bankId?: string;
  }>;
  taoMaVietQrNapTien: (
    amount: number,
    note?: string,
    packageId?: string,
  ) => Promise<any>;
  processSandboxPayment: (payload: {
    packageId?: string;
    amount?: number;
    outcome: 'SUCCESS' | 'FAILED';
    failureReason?: string;
    bankName?: string;
  }) => Promise<any>;
  xuLyThanhToanSandbox: (payload: any) => Promise<any>;
}

export const useWalletStore = create<WalletState>((set) => {
  const defaultPackages: CreditPackage[] = [
    {
      id: 'PKG_50',
      name: 'Gói Khởi Động',
      credits: 50,
      priceVnd: 100000,
      badge: 'Khởi đầu',
      bonusText: 'Trải nghiệm rà soát cơ bản',
      popular: false,
    },
    {
      id: 'PKG_120',
      name: 'Gói Tiêu Chuẩn',
      credits: 120,
      priceVnd: 200000,
      badge: 'Phổ biến nhất',
      bonusText: 'Tặng 20 Credit (Tiết kiệm 17%)',
      popular: true,
    },
    {
      id: 'PKG_450',
      name: 'Gói Doanh Nghiệp',
      credits: 450,
      priceVnd: 500000,
      badge: 'Tiết kiệm 45%',
      bonusText: 'Tặng 200 Credit (Tối ưu chi phí)',
      popular: false,
    },
  ];

  const fetchWalletFn = async () => {
    set({ isLoading: true, dangTai: true });
    try {
      const res: any = await apiClient.get('/wallets/my-wallet');
      set({ wallet: res, thongTinVi: res, isLoading: false, dangTai: false });
    } catch (err: any) {
      set({ error: err.message, loi: err.message, isLoading: false, dangTai: false });
    }
  };

  const fetchLedgersFn = async () => {
    try {
      const res: any = await apiClient.get('/wallets/transactions');
      const list = Array.isArray(res) ? res : [];
      set({ ledgers: list, danhSachGiaoDich: list });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackagesFn = async () => {
    try {
      const res: any = await apiClient.get('/wallets/packages');
      if (Array.isArray(res) && res.length > 0) {
        set({ packages: res, danhSachGoiCredit: res });
        return res;
      }
    } catch (err) {
      console.error(err);
    }
    return defaultPackages;
  };

  const buyPackageFn = async (packageId: string) => {
    try {
      const res: any = await apiClient.post('/wallets/buy-package', { packageId });
      set({ wallet: res, thongTinVi: res });
      const txRes: any = await apiClient.get('/wallets/transactions');
      if (Array.isArray(txRes)) set({ ledgers: txRes, danhSachGiaoDich: txRes });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const depositFn = async (amount: number, note?: string) => {
    try {
      const res: any = await apiClient.post('/wallets/deposit', { amount, note });
      set({ wallet: res, thongTinVi: res });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const generateDepositQRFn = async (amount: number, note?: string, packageId?: string) => {
    try {
      const res: any = await apiClient.post('/payments/vietqr/generate', {
        amount,
        note,
        packageId,
      });
      return {
        qrCodeUrl: res.qrUrl,
        checkoutUrl: res.qrUrl,
        orderCode: res.content || `CELRA NAP ${amount}`,
        amount: res.amount,
        accountNo: res.accountNo,
        accountName: res.accountName,
        bankId: res.bankId,
      };
    } catch (err: any) {
      throw err;
    }
  };

  const processSandboxPaymentFn = async (payload: any) => {
    try {
      const res: any = await apiClient.post('/wallets/sandbox-payment', payload);
      if (res.wallet) {
        set({ wallet: res.wallet, thongTinVi: res.wallet });
      }
      const txRes: any = await apiClient.get('/wallets/transactions');
      if (Array.isArray(txRes)) set({ ledgers: txRes, danhSachGiaoDich: txRes });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    wallet: null,
    thongTinVi: null,
    ledgers: [],
    danhSachGiaoDich: [],
    packages: defaultPackages,
    danhSachGoiCredit: defaultPackages,
    isLoading: false,
    dangTai: false,
    error: null,
    loi: null,

    fetchWallet: fetchWalletFn,
    layThongTinVi: fetchWalletFn,
    fetchLedgers: fetchLedgersFn,
    layDanhSachGiaoDich: fetchLedgersFn,
    fetchPackages: fetchPackagesFn,
    layDanhSachGoiCredit: fetchPackagesFn,
    buyPackage: buyPackageFn,
    muaGoiCredit: buyPackageFn,
    deposit: depositFn,
    napTien: depositFn,
    generateDepositQR: generateDepositQRFn,
    taoMaVietQrNapTien: generateDepositQRFn,
    processSandboxPayment: processSandboxPaymentFn,
    xuLyThanhToanSandbox: processSandboxPaymentFn,
  };
});
