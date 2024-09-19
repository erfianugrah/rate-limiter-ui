export interface Condition {
  field: string;
  operator: string;
  value: string;
  headerName?: string;
  headerValue?: string;
}

export interface ConditionGroup {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[];
}

export interface FingerprintParameter {
  name: string;
  headerName?: string;
  headerValue?: string;
  body?: string;
}

export interface ConditionalAction {
  conditions: (Condition | ConditionGroup | { type: 'operator'; logic: string })[];
  action: {
    type: string;
  };
}

export interface RuleConfig {
  id: string;
  order: number;
  name: string;
  description: string;
  rateLimit: {
    limit: number;
    period: number;
  };
  fingerprint: {
    parameters: FingerprintParameter[];
  };
  initialMatch: ConditionalAction;
  elseAction?: {
    type: string;
  };
  elseIfActions: ConditionalAction[];
}
