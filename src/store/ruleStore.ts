import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ConditionalAction, RuleConfig } from "../types/ruleTypes";

function normalizeAction(
  action: ConditionalAction["action"],
): ConditionalAction["action"] {
  switch (action.type) {
    case "customResponse":
      return {
        type: "customResponse",
        statusCode: action.statusCode || 200,
        bodyType: action.bodyType || "text",
        body: action.body || "",
      };
    case "rateLimit":
    case "block":
    case "allow":
    default:
      return { type: action.type };
  }
}

function normalizeRule(rule: RuleConfig): RuleConfig {
  return {
    ...rule,
    initialMatch: {
      ...rule.initialMatch,
      action: normalizeAction(rule.initialMatch.action),
    },
    elseIfActions: rule.elseIfActions.map((elseIf) => ({
      ...elseIf,
      action: normalizeAction(elseIf.action),
    })),
    elseAction: rule.elseAction ? normalizeAction(rule.elseAction) : undefined,
  };
}

interface RuleStore {
  rules: RuleConfig[];
  isLoading: boolean;
  fetchRules: () => Promise<void>;
  addRule: (
    rule: Omit<RuleConfig, "id" | "order" | "version">,
  ) => Promise<RuleConfig>;
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
      console.log("Fetching rules...");
      const response = await fetch("/api/config", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("Fetch response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to fetch rules: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      console.log("Fetched rules:", data);
      const normalizedRules = Array.isArray(data.rules)
        ? data.rules.map(normalizeRule)
        : [];
      set({ rules: normalizedRules });
    } catch (error) {
      console.error("Error fetching rules:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  addRule: async (rule: Omit<RuleConfig, "id" | "order" | "version">) => {
    set({ isLoading: true });
    try {
      const newRule = normalizeRule({
        ...rule,
        id: uuidv4(),
        order: get().rules.length,
        version: 0,
      });
      console.log("Adding new rule:", newRule);
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(newRule),
      });
      console.log("Add rule response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to add rule: ${response.status} ${response.statusText}`,
        );
      }
      const addedRule = await response.json();
      console.log("Added rule:", addedRule);
      const normalizedAddedRule = normalizeRule(addedRule);
      set((state) => ({ rules: [...state.rules, normalizedAddedRule] }));
      return normalizedAddedRule;
    } catch (error) {
      console.error("Error adding rule:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateRule: async (updatedRule: RuleConfig) => {
    set({ isLoading: true });
    try {
      const normalizedRule = normalizeRule(updatedRule);
      console.log("Updating rule:", normalizedRule);
      const response = await fetch(`/api/config/rules/${normalizedRule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(normalizedRule),
      });
      console.log("Update rule response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to update rule: ${response.status} ${response.statusText}`,
        );
      }
      const updatedRuleData = await response.json();
      console.log("Updated rule data:", updatedRuleData);
      const normalizedUpdatedRule = normalizeRule(updatedRuleData.rule);
      set((state) => ({
        rules: state.rules.map((rule) =>
          rule.id === updatedRule.id ? normalizedUpdatedRule : rule
        ),
      }));
      return normalizedUpdatedRule;
    } catch (error) {
      console.error("Error updating rule:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteRule: async (id: string) => {
    set({ isLoading: true });
    try {
      console.log("Deleting rule with ID:", id);
      const response = await fetch(`/api/config/rules/${id}`, {
        method: "DELETE",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("Delete rule response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to delete rule: ${response.status} ${response.statusText}`,
        );
      }
      const deletedRuleData = await response.json();
      console.log("Deleted rule data:", deletedRuleData);
      set((state) => ({
        rules: state.rules.filter((rule) => rule.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting rule:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  reorderRules: async (reorderedRules: RuleConfig[]) => {
    set({ isLoading: true });
    try {
      const normalizedReorderedRules = reorderedRules.map(normalizeRule);
      console.log("Reordering rules:", normalizedReorderedRules);
      const response = await fetch("/api/config/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ rules: normalizedReorderedRules }),
      });
      console.log("Reorder rules response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to reorder rules: ${response.status} ${response.statusText}`,
        );
      }
      const reorderedData = await response.json();
      console.log("Reordered rules data:", reorderedData);
      const normalizedReorderedData = reorderedData.rules.map(normalizeRule);
      set({ rules: normalizedReorderedData });
    } catch (error) {
      console.error("Error reordering rules:", error);
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ targetVersion }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to revert rule: ${response.status} ${response.statusText}`,
        );
      }
      const revertedRuleData = await response.json();
      console.log("Reverted rule data:", revertedRuleData);
      const normalizedRevertedRule = normalizeRule(revertedRuleData.rule);
      set((state) => ({
        rules: state.rules.map((
          rule,
        ) => (rule.id === ruleId ? normalizedRevertedRule : rule)),
      }));
      return normalizedRevertedRule;
    } catch (error) {
      console.error("Error reverting rule:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default function Component() {
  return null; // This component doesn't render anything
}
