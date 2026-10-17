import { create } from 'zustand';
import apiClient from '../api/client';
import type { ContextFact, ContextFactHistory } from '../types';

interface ContextState {
  facts: ContextFact[];
  factHistories: ContextFactHistory[];
  isLoading: boolean;
  error: string | null;

  fetchFacts: (group?: string) => Promise<void>;
  updateFact: (factId: string, value: string, reason?: string) => Promise<void>;
  fetchFactHistory: (factId: string) => Promise<void>;
  auditFact: (factId: string) => Promise<any>;
  generateChecklists: (factId: string, payload?: any) => Promise<any>;
}

export const useContextStore = create<ContextState>((set) => ({
  facts: [],
  factHistories: [],
  isLoading: false,
  error: null,

  fetchFacts: async (_group?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.get('/context-facts');
      const list = Array.isArray(res) ? res : [];
      set({ facts: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateFact: async (factId: string, value: string, reason?: string) => {
    try {
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
    } catch (err: any) {
      throw err;
    }
  },

  fetchFactHistory: async (factId: string) => {
    try {
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
