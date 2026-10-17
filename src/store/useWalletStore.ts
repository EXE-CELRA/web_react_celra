import { create } from 'zustand';
import apiClient from '../api/client';
import type { WalletInfo, WalletLedger, CreditPackage } from '../types';

interface WalletState {
  wallet: WalletInfo | null;
  ledgers: WalletLedger[];
  packages: CreditPackage[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: () => Promise<void>;
  fetchLedgers: () => Promise<void>;
  fetchPackages: () => Promise<CreditPackage[]>;
  buyPackage: (packageId: string) => Promise<any>;
  deposit: (amount: number, note?: string) => Promise<any>;
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
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  ledgers: [],
  packages: [
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
  ],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const res: any = await apiClient.get('/wallets/my-wallet');
      set({ wallet: res, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchLedgers: async () => {
    try {
      const res: any = await apiClient.get('/wallets/transactions');
      set({ ledgers: Array.isArray(res) ? res : [] });
    } catch (err) {
      console.error(err);
    }
  },

  fetchPackages: async () => {
    try {
      const res: any = await apiClient.get('/wallets/packages');
      if (Array.isArray(res) && res.length > 0) {
        set({ packages: res });
        return res;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  },

  buyPackage: async (packageId: string) => {
    try {
      const res: any = await apiClient.post('/wallets/buy-package', { packageId });
      set({ wallet: res });
      // Refresh ledgers after purchase
      const txRes: any = await apiClient.get('/wallets/transactions');
      if (Array.isArray(txRes)) set({ ledgers: txRes });
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  deposit: async (amount: number, note?: string) => {
    try {
      const res: any = await apiClient.post('/wallets/deposit', { amount, note });
      set({ wallet: res });
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  generateDepositQR: async (amount: number, note?: string, packageId?: string) => {
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
  },
}));
