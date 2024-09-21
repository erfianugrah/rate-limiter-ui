import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RuleConfig } from '../types/ruleTypes';

interface RuleStore {
  rules: RuleConfig[];
  isLoading: boolean;
  fetchRules: () => Promise<void>;
  addRule: (rule: Omit<RuleConfig, 'id' | 'order' | 'version'>) => Promise<RuleConfig>;
  updateRule: (rule: RuleConfig) => Promise<RuleConfig>;
  deleteRule: (id: string) => Promise<void>;
  reorderRules: (rules: RuleConfig[]) => Promise<void>;
  revertRule: (ruleId: string, targetVersion: number) => Promise<RuleConfig>;
}

export const useRuleStore = create<RuleStore>((set, get) => ({
  rules: [],
  isLoading: false,
  fetchRules: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching rules...');
      const response = await fetch('/api/config', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched rules:', data);
      set({ rules: Array.isArray(data.rules) ? data.rules : [] });
    } catch (error) {
      console.error('Error fetching rules:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  addRule: async (rule: Omit<RuleConfig, 'id' | 'order' | 'version'>) => {
    set({ isLoading: true });
    try {
      const newRule = { ...rule, id: uuidv4(), order: get().rules.length, version: 0 };
      console.log('Adding new rule:', newRule);
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
      console.log('Add rule response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to add rule: ${response.status} ${response.statusText}`);
      }
      const addedRule = await response.json();
      console.log('Added rule:', addedRule);
      set((state) => ({ rules: [...state.rules, addedRule] }));
      return addedRule;
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
      console.log('Updating rule:', updatedRule);
      const response = await fetch(`/api/config/rules/${updatedRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify(updatedRule),
      });
      console.log('Update rule response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to update rule: ${response.status} ${response.statusText}`);
      }
      const updatedRuleData = await response.json();
      console.log('Updated rule data:', updatedRuleData);
      set((state) => ({
        rules: state.rules.map((rule) =>
          rule.id === updatedRule.id ? updatedRuleData.rule : rule
        ),
      }));
      return updatedRuleData.rule;
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
      console.log('Deleting rule with ID:', id);
      const response = await fetch(`/api/config/rules/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      console.log('Delete rule response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to delete rule: ${response.status} ${response.statusText}`);
      }
      const deletedRuleData = await response.json();
      console.log('Deleted rule data:', deletedRuleData);
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
      console.log('Reordering rules:', reorderedRules);
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
      console.log('Reorder rules response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to reorder rules: ${response.status} ${response.statusText}`);
      }
      const reorderedData = await response.json();
      console.log('Reordered rules data:', reorderedData);
      set({ rules: reorderedData.rules });
    } catch (error) {
      console.error('Error reordering rules:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  revertRule: async (ruleId: string, targetVersion: number) => {
    set({ isLoading: true });
    try {
      console.log(`Reverting rule ${ruleId} to version ${targetVersion}`);
      const response = await fetch(`/api/config/rules/${ruleId}/revert`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify({ targetVersion }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to revert rule: ${response.status} ${response.statusText}`);
      }
      const revertedRuleData = await response.json();
      console.log('Reverted rule data:', revertedRuleData);

      set((state) => ({
        rules: state.rules.map((rule) => (rule.id === ruleId ? revertedRuleData.rule : rule)),
      }));
      return revertedRuleData.rule;
    } catch (error) {
      console.error('Error reverting rule:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default function Component() {
  return null; // This component doesn't render anything
}
