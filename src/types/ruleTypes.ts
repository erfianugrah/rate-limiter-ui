// ruleTypes.ts
// Aligned with the canonical format from config storage

/**
 * Represents a comparison operator
 */
export enum OperatorType {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  MATCHES = 'matches',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
}

/**
 * Represents a rule action type
 */
export enum ActionType {
  BLOCK = 'block',
  ALLOW = 'allow',
  LOG = 'log',
  CHALLENGE = 'challenge',
  RATE_LIMIT = 'rateLimit',
}

/**
 * Represents a condition in a rule
 */
export interface Condition {
  field: string;
  operator: string;
  value?: string | number | boolean;
  headerName?: string;
  headerValue?: string;
}

/**
 * UI-specific extension for condition grouping
 */
export interface ConditionGroup {
  conditions:
    (Condition | ConditionGroup | { type: "operator"; logic: string })[];
}

/**
 * Represents a fingerprint parameter
 */
export interface FingerprintParameter {
  name: string;
  headerName?: string;
  headerValue?: string;
  // For backward compatibility - prefer bodyField and bodyFieldName for new code
  body?: string;
  bodyField?: string;
  bodyFieldName?: string;
  cookieName?: string;
  cookieValue?: string;
}

/**
 * Represents a rule action
 */
export interface RuleAction {
  type: string;
  // UI uses statusCode, canonical uses status - support both
  statusCode?: number;
  status?: number;
  bodyType?: "text" | "json" | "html";
  body?: string;
  parameters?: Record<string, unknown>;
  [key: string]: any; // For backward compatibility
}

/**
 * Represents a conditional match with action
 */
export interface ConditionalAction {
  conditions:
    (Condition | ConditionGroup | { type: "operator"; logic: string })[];
  action: RuleAction;
}

/**
 * Represents a rate limit rule
 * Aligned with canonical format but with UI-specific extensions
 */
export interface Rule {
  id: string;
  // UI uses order, canonical uses priority - support both
  order?: number;
  priority?: number;
  version?: number | string; // Can be number (legacy) or string (UUID for new system)
  versionId?: string; // Specific UUID for version
  versionCount?: number; // Count of versions
  name: string;
  description: string;
  rateLimit: {
    limit: number;
    period: number;
  };
  fingerprint: {
    parameters: FingerprintParameter[];
  };
  initialMatch: {
    conditions: Array<any>; // Keep flexible for compatibility
    action: RuleAction;
  };
  elseIfActions: Array<{
    conditions: Array<any>; // Keep flexible for compatibility
    action: RuleAction;
  }>;
  elseAction?: RuleAction;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Legacy type for backward compatibility
 */
export type RuleConfig = Rule;
