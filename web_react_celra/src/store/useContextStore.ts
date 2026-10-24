/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import apiClient from '../api/client';
import type { ContextFact, ContextFactHistory } from '../types';

interface ContextState {
  facts: ContextFact[];
  factHistories: ContextFactHistory[];
  isLoading: boolean;
  error: string | null;

  fetchFacts: (group?: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFact: (data: { key: string; label: string; group: string; currentValue: string; source?: string }) => Promise<any>;
  updateFact: (factId: string, value: string, reason?: string) => Promise<void>;
  fetchFactHistory: (factId: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditFact: (factId: string) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateChecklists: (factId: string, payload?: any) => Promise<any>;
}

export const useContextStore = create<ContextState>((set) => ({
  facts: [],
  factHistories: [],
  isLoading: false,
  error: null,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fetchFacts: async (_group?: string) => {
    set({ isLoading: true, error: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.get('/context-facts');
      const list = Array.isArray(res) ? res : [];
      set({ facts: list, isLoading: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createFact: async (data: { key: string; label: string; group: string; currentValue: string; source?: string }) => {
    // eslint-disable-next-line no-useless-catch
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post('/context-facts', data);
      set((state) => ({ facts: [res, ...state.facts] }));
      return res;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw err;
    }
  },

  updateFact: async (factId: string, value: string, reason?: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.patch(`/context-facts/${factId}`, {
        currentValue: value,
        note: reason,
      });
      set((state) => ({
        facts: state.facts.map((f) =>
          f.id === factId
            ? { ...f, currentValue: res.currentValue, value: res.currentValue, updatedAt: res.updatedAt, history: res.history }
            : f,
        ),
      }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw err;
    }
  },

  fetchFactHistory: async (factId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.get(`/context-facts/${factId}`);
      if (res && res.history) {
        set({ factHistories: res.history });
      }
    } catch (err) {
      console.error(err);
    }
  },

  auditFact: async (factId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post(`/context-facts/${factId}/compliance-audit`);
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  generateChecklists: async (factId: string, payload?: any) => {
    try {
      const res: any = await apiClient.post(`/context-facts/${factId}/generate-checklists`, payload || {});
      return res;
    } catch (err: any) {
      throw err;
    }
  },
}));
