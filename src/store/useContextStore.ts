/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import apiClient from '../api/client';
import type { ContextFact, ContextFactHistory } from '../types';

interface ContextState {
  facts: ContextFact[];
  danhSachDuKien: ContextFact[];
  factHistories: ContextFactHistory[];
  lichSuDuKien: ContextFactHistory[];
  isLoading: boolean;
  dangTai: boolean;
  error: string | null;
  loi: string | null;

  fetchFacts: (group?: string) => Promise<void>;
  layDanhSachDuKien: (group?: string) => Promise<void>;
  createFact: (data: any) => Promise<any>;
  taoDuKien: (data: any) => Promise<any>;
  updateFact: (factId: string, value: string, reason?: string) => Promise<void>;
  capNhatDuKien: (factId: string, value: string, reason?: string) => Promise<void>;
  fetchFactHistory: (factId: string) => Promise<void>;
  layLichSuDuKien: (factId: string) => Promise<void>;
  auditFact: (factId: string) => Promise<any>;
  raSoatDuKien: (factId: string) => Promise<any>;
  generateChecklists: (factId: string, payload?: any) => Promise<any>;
  taoDanhMucKiemTra: (factId: string, payload?: any) => Promise<any>;
}

export const useContextStore = create<ContextState>((set) => {
  const fetchFactsFn = async (_group?: string) => {
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const res: any = await apiClient.get('/context-facts');
      const list = Array.isArray(res) ? res : [];
      set({ facts: list, danhSachDuKien: list, isLoading: false, dangTai: false });
    } catch (err: any) {
      set({ error: err.message, loi: err.message, isLoading: false, dangTai: false });
    }
  };

  const createFactFn = async (data: any) => {
    try {
      const payload = {
        key: data.khoa || data.key,
        label: data.nhan || data.label,
        group: data.nhom || data.group,
        currentValue: data.giaTriHienTai || data.currentValue,
        source: data.nguon || data.source || 'Hệ thống',
      };
      const res: any = await apiClient.post('/context-facts', payload);
      set((state) => {
        const updated = [res, ...state.facts];
        return { facts: updated, danhSachDuKien: updated };
      });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const updateFactFn = async (factId: string, value: string, reason?: string) => {
    try {
      const res: any = await apiClient.patch(`/context-facts/${factId}`, {
        currentValue: value,
        note: reason,
      });
      set((state) => {
        const updated = state.facts.map((f) =>
          f.id === factId
            ? { ...f, currentValue: res.currentValue, giaTriHienTai: res.currentValue, value: res.currentValue, updatedAt: res.updatedAt, history: res.history }
            : f,
        );
        return { facts: updated, danhSachDuKien: updated };
      });
    } catch (err: any) {
      throw err;
    }
  };

  const fetchFactHistoryFn = async (factId: string) => {
    try {
      const res: any = await apiClient.get(`/context-facts/${factId}`);
      if (res && res.history) {
        set({ factHistories: res.history, lichSuDuKien: res.history });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const auditFactFn = async (factId: string) => {
    try {
      const res: any = await apiClient.post(`/context-facts/${factId}/compliance-audit`);
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const generateChecklistsFn = async (factId: string, payload?: any) => {
    try {
      const res: any = await apiClient.post(`/context-facts/${factId}/generate-checklists`, payload || {});
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    facts: [],
    danhSachDuKien: [],
    factHistories: [],
    lichSuDuKien: [],
    isLoading: false,
    dangTai: false,
    error: null,
    loi: null,

    fetchFacts: fetchFactsFn,
    layDanhSachDuKien: fetchFactsFn,
    createFact: createFactFn,
    taoDuKien: createFactFn,
    updateFact: updateFactFn,
    capNhatDuKien: updateFactFn,
    fetchFactHistory: fetchFactHistoryFn,
    layLichSuDuKien: fetchFactHistoryFn,
    auditFact: auditFactFn,
    raSoatDuKien: auditFactFn,
    generateChecklists: generateChecklistsFn,
    taoDanhMucKiemTra: generateChecklistsFn,
  };
});
