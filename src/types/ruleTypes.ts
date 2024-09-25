// ruleTypes.ts

export interface Condition {
  field: string;
  operator: string;
  value: string;
  headerName?: string;
  headerValue?: string;
}

export interface ConditionGroup {
  conditions:
    (Condition | ConditionGroup | { type: "operator"; logic: string })[];
}

export type FingerprintParameter = {
  name: string;
  headerName?: string;
  headerValue?: string;
  body?: string;
  bodyField?: string;
  bodyFieldName?: string;
  value?: string;
  cookieName?: string;
  cookieValue?: string;
};

export interface ConditionalAction {
  conditions:
    (Condition | ConditionGroup | { type: "operator"; logic: string })[];
  action: {
    type: string;
    statusCode?: number;
    bodyType?: "text" | "json" | "html";
    body?: string;
  };
}

// @/types/ruleTypes.ts

export interface RuleConfig {
  id: string;
  order: number;
  version: number;
  name: string;
  description: string;
  rateLimit: {
    limit: number;
    period: number;
  };
  fingerprint: {
    parameters: Array<{
      name: string;
      headerName?: string;
      headerValue?: string;
      body?: string;
    }>;
  };
  initialMatch: {
    conditions: Array<any>; // Define a more specific type if possible
    action: {
      type: string;
      [key: string]: any; // Allow additional properties
    };
  };
  elseIfActions: Array<{
    conditions: Array<any>; // Define a more specific type if possible
    action: {
      type: string;
      [key: string]: any; // Allow additional properties
    };
  }>;
  elseAction?: {
    type: string;
    [key: string]: any; // Allow additional properties
  };
}
