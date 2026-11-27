import { create } from 'zustand';
import apiClient from '../api/client';
import type { ContextFact, ContextFactHistory } from '../types';

export interface CreateContextFactInput {
  key?: string;
  label?: string;
  group?: string;
  currentValue?: string;
  source?: string;
}

interface ContextState {
  facts: ContextFact[];
  factHistories: ContextFactHistory[];
  isLoading: boolean;
  error: string | null;

  fetchFacts: (group?: string) => Promise<void>;
  createFact: (data: CreateContextFactInput) => Promise<ContextFact>;
  updateFact: (factId: string, value: string, reason?: string) => Promise<void>;
  fetchFactHistory: (factId: string) => Promise<void>;
  auditFact: (factId: string) => Promise<unknown>;
  generateChecklists: (factId: string, payload?: Record<string, unknown>) => Promise<unknown>;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

export const useContextStore = create<ContextState>((set) => {
  const fetchFactsFn = async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<unknown, ContextFact[]>('/context-facts');
      const list = Array.isArray(res) ? res : [];
      set({ facts: list, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Không thể tải danh sách bối cảnh'), isLoading: false });
    }
  };

  const createFactFn = async (data: CreateContextFactInput) => {
    const payload = {
      key: data.key,
      label: data.label,
      group: data.group,
      currentValue: data.currentValue,
      source: data.source || 'Hệ thống',
    };
    const res = await apiClient.post<unknown, ContextFact>('/context-facts', payload);
    set((state) => ({ facts: [res, ...state.facts] }));
    return res;
  };

  const updateFactFn = async (factId: string, value: string, reason?: string) => {
    const res = await apiClient.patch<
      unknown,
      ContextFact & { history?: ContextFactHistory[] }
    >(`/context-facts/${factId}`, {
      currentValue: value,
      note: reason,
    });
    set((state) => ({
      facts: state.facts.map((f) =>
        f.id === factId
          ? {
              ...f,
              currentValue: res.currentValue,
              value: res.currentValue,
              updatedAt: res.updatedAt,
              history: res.history,
            }
          : f,
      ),
    }));
  };

  const fetchFactHistoryFn = async (factId: string) => {
    try {
      const res = await apiClient.get<unknown, { history?: ContextFactHistory[] }>(
        `/context-facts/${factId}`,
      );
      if (res && res.history) {
        set({ factHistories: res.history });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const auditFactFn = async (factId: string) => {
    return apiClient.post(`/context-facts/${factId}/compliance-audit`);
  };

  const generateChecklistsFn = async (factId: string, payload?: Record<string, unknown>) => {
    return apiClient.post(`/context-facts/${factId}/generate-checklists`, payload || {});
  };

  return {
    facts: [],
    factHistories: [],
    isLoading: false,
    error: null,

    fetchFacts: fetchFactsFn,
    createFact: createFactFn,
    updateFact: updateFactFn,
    fetchFactHistory: fetchFactHistoryFn,
    auditFact: auditFactFn,
    generateChecklists: generateChecklistsFn,
  };
});
