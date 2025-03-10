import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ConditionalAction, Rule, RuleAction } from "../types/ruleTypes";
import { transformToCanonicalRule, transformToUIRule } from "../lib/transformations";

/**
 * Normalizes an action to ensure it has all required fields
 */
function normalizeAction(action: RuleAction): RuleAction {
  switch (action.type) {
    case "customResponse":
      return {
        type: "customResponse",
        statusCode: action.statusCode || action.status || 200,
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

/**
 * Normalizes a rule to ensure all fields follow UI conventions
 */
function normalizeRule(rule: Rule): Rule {
  return {
    ...rule,
    // Support both order and priority, with order taking precedence for UI
    order: rule.order !== undefined ? rule.order : rule.priority,
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
  rules: Rule[];
  isLoading: boolean;
  fetchRules: () => Promise<void>;
  addRule: (rule: Omit<Rule, "id" | "order" | "priority" | "version">) => Promise<Rule>;
  updateRule: (rule: Rule) => Promise<Rule>;
  deleteRule: (id: string) => Promise<void>;
  reorderRules: (rules: Rule[]) => Promise<void>;
  revertRule: (ruleId: string, targetVersion: string) => Promise<Rule>;
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
      
      // Transform the rules from API format to UI format
      const transformedRules = Array.isArray(data.rules)
        ? data.rules.map((rule: any) => normalizeRule(transformToUIRule(rule)))
        : [];
      
      set({ rules: transformedRules });
    } catch (error) {
      console.error("Error fetching rules:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  addRule: async (rule: Omit<Rule, "id" | "order" | "priority" | "version">) => {
    set({ isLoading: true });
    try {
      // Create a new rule with UI-specific fields
      const newUIRule = normalizeRule({
        ...rule,
        id: uuidv4(),
        order: get().rules.length,
        version: 0,
      });
      
      // Transform to canonical format for API submission
      const canonicalRule = transformToCanonicalRule(newUIRule);
      console.log("Adding new rule:", canonicalRule);
      
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(canonicalRule),
      });
      
      console.log("Add rule response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to add rule: ${response.status} ${response.statusText}`,
        );
      }
      
      // Transform the response back to UI format
      const apiResponse = await response.json();
      console.log("Added rule API response:", apiResponse);
      const uiRule = normalizeRule(transformToUIRule(apiResponse));
      
      set((state) => ({ rules: [...state.rules, uiRule] }));
      return uiRule;
    } catch (error) {
      console.error("Error adding rule:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateRule: async (updatedRule: Rule) => {
    set({ isLoading: true });
    try {
      // Normalize the rule for UI consistency
      const normalizedRule = normalizeRule(updatedRule);
      
      // Transform to canonical format for API
      const canonicalRule = transformToCanonicalRule(normalizedRule);
      console.log("Updating rule (canonical format):", canonicalRule);
      
      const response = await fetch(`/api/config/rules/${canonicalRule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify(canonicalRule),
      });
      
      console.log("Update rule response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to update rule: ${response.status} ${response.statusText}`,
        );
      }
      
      // Transform the response back to UI format
      const updatedRuleData = await response.json();
      console.log("Updated rule data from API:", updatedRuleData);
      const uiRule = normalizeRule(transformToUIRule(updatedRuleData.rule));
      
      set((state) => ({
        rules: state.rules.map((rule) =>
          rule.id === updatedRule.id ? uiRule : rule
        ),
      }));
      
      return uiRule;
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
  
  reorderRules: async (reorderedRules: Rule[]) => {
    set({ isLoading: true });
    try {
      // Transform all rules to canonical format for API
      const canonicalRules = reorderedRules.map((rule, index) => {
        // Update each rule's order/priority based on new position
        const updatedRule = { 
          ...rule, 
          order: index,
          priority: index 
        };
        return transformToCanonicalRule(updatedRule);
      });
      
      console.log("Reordering rules (canonical format):", canonicalRules);
      const response = await fetch("/api/config/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ rules: canonicalRules }),
      });
      
      console.log("Reorder rules response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `Failed to reorder rules: ${response.status} ${response.statusText}`,
        );
      }
      
      // Transform response back to UI format
      const reorderedData = await response.json();
      console.log("Reordered rules data from API:", reorderedData);
      const uiRules = reorderedData.rules.map((rule: any) => 
        normalizeRule(transformToUIRule(rule))
      );
      
      set({ rules: uiRules });
    } catch (error) {
      console.error("Error reordering rules:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  revertRule: async (ruleId: string, targetVersion: string) => {
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
      
      // Transform reverted rule from API to UI format
      const revertedRuleData = await response.json();
      console.log("Reverted rule data from API:", revertedRuleData);
      const uiRule = normalizeRule(transformToUIRule(revertedRuleData.rule));
      
      set((state) => ({
        rules: state.rules.map((rule) => (rule.id === ruleId ? uiRule : rule)),
      }));
      
      return uiRule;
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
