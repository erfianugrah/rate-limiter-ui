import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RuleConfig } from '../types/ruleTypes';

interface RuleStore {
  rules: RuleConfig[];
  isLoading: boolean;
  fetchRules: () => Promise<void>;
  addRule: (rule: Omit<RuleConfig, 'id' | 'order'>) => Promise<void>;
  updateRule: (rule: RuleConfig) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  reorderRules: (rules: RuleConfig[]) => Promise<void>;
}

export const useRuleStore = create<RuleStore>((set, get) => ({
  rules: [],
  isLoading: false,
  fetchRules: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/config', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      set({ rules: Array.isArray(data.rules) ? data.rules : [] });
    } catch (error) {
      console.error('Error fetching rules:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  addRule: async (rule: Omit<RuleConfig, 'id' | 'order'>) => {
    set({ isLoading: true });
    try {
      const newRule = { ...rule, id: uuidv4(), order: get().rules.length };
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify(newRule),
      });
      if (!response.ok) {
        throw new Error(`Failed to add rule: ${response.status} ${response.statusText}`);
      }
      set((state) => ({ rules: [...state.rules, newRule] }));
    } catch (error) {
      console.error('Error adding rule:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateRule: async (updatedRule: RuleConfig) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify(updatedRule),
      });
      if (!response.ok) {
        throw new Error(`Failed to update rule: ${response.status} ${response.statusText}`);
      }
      set((state) => ({
        rules: state.rules.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule)),
      }));
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteRule: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/config/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete rule: ${response.status} ${response.statusText}`);
      }
      set((state) => ({
        rules: state.rules.filter((rule) => rule.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  reorderRules: async (reorderedRules: RuleConfig[]) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/config/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify({ rules: reorderedRules }),
      });
      if (!response.ok) {
        throw new Error(`Failed to reorder rules: ${response.status} ${response.statusText}`);
      }
      set({ rules: reorderedRules });
    } catch (error) {
      console.error('Error reordering rules:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
