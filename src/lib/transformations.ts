/**
 * Data transformation functions for mapping between UI models and canonical API models
 */
import type { Condition, RuleConfig } from '../types/ruleTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transforms a rule from any format to the canonical format expected by the API
 */
export function transformToCanonicalRule(rule: any): any {
  // Use canonical priority field (fallback to order for backward compatibility)
  const priority = rule.priority !== undefined ? rule.priority : rule.order;
  
  // Transform fingerprint parameters to ensure they match the canonical format
  const fingerprintParameters = Array.isArray(rule.fingerprint?.parameters) 
    ? rule.fingerprint.parameters.map((param: any) => ({
        name: param.name,
        headerName: param.headerName,
        headerValue: param.headerValue,
        // Map body to bodyField for backward compatibility
        bodyField: param.bodyField || param.body,
        bodyFieldName: param.bodyFieldName,
        cookieName: param.cookieName,
        cookieValue: param.cookieValue,
      }))
    : [];

  // Transform actions to use status instead of statusCode
  const transformAction = (action: any) => {
    if (!action) return undefined;
    
    return {
      type: action.type,
      // Use canonical status field (fallback to statusCode for backward compatibility)
      status: action.status !== undefined ? action.status : action.statusCode,
      // Include other fields but prefer canonical versions
      ...(action.body && { body: action.body }),
      ...(action.bodyType && { bodyType: action.bodyType }),
      ...(Object.keys(action).some(key => 
        !['type', 'status', 'statusCode', 'body', 'bodyType'].includes(key)
      ) && {
        parameters: Object.fromEntries(
          Object.entries(action).filter(([key]) => 
            !['type', 'status', 'statusCode', 'body', 'bodyType'].includes(key)
          )
        )
      })
    };
  };

  // Return the canonical rule format
  return {
    id: rule.id || uuidv4(),
    name: rule.name || '',
    description: rule.description || '',
    // Copy rate limit settings directly
    rateLimit: {
      limit: rule.rateLimit?.limit || 0,
      period: rule.rateLimit?.period || 0,
    },
    // Use transformed fingerprint parameters
    fingerprint: {
      parameters: fingerprintParameters
    },
    // Transform the initialMatch section
    initialMatch: {
      conditions: rule.initialMatch?.conditions || [],
      action: transformAction(rule.initialMatch?.action) || { type: 'block' }
    },
    // Transform the elseIfActions array
    elseIfActions: Array.isArray(rule.elseIfActions)
      ? rule.elseIfActions.map((elseIf: any) => ({
          conditions: elseIf.conditions || [],
          action: transformAction(elseIf.action) || { type: 'block' }
        }))
      : [],
    // Transform the elseAction if it exists
    elseAction: transformAction(rule.elseAction),
    // Use canonical priority
    priority: priority || 0,
    // Preserve version information
    version: rule.version || 0,
    // Preserve timestamps
    createdAt: rule.createdAt || new Date().toISOString(),
    updatedAt: rule.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transforms a rule from the canonical API format to the UI format
 */
export function transformToUIRule(rule: any): RuleConfig {
  // Transform actions to UI format
  const transformAction = (action: any) => {
    if (!action) return undefined;
    
    return {
      type: action.type,
      // Use UI statusCode field
      statusCode: action.statusCode !== undefined ? action.statusCode : action.status,
      // Include other fields
      ...(action.body && { body: action.body }),
      ...(action.bodyType && { bodyType: action.bodyType }),
      // Add any additional parameters
      ...(action.parameters || {})
    };
  };

  // Return the UI rule format
  return {
    id: rule.id,
    // Use UI order field (from priority for backward compatibility)
    order: rule.order !== undefined ? rule.order : rule.priority || 0,
    version: rule.version || 0,
    name: rule.name || '',
    description: rule.description || '',
    rateLimit: {
      limit: rule.rateLimit?.limit || 0,
      period: rule.rateLimit?.period || 0,
    },
    fingerprint: {
      parameters: Array.isArray(rule.fingerprint?.parameters)
        ? rule.fingerprint.parameters.map((param: any) => ({
            name: param.name,
            headerName: param.headerName,
            headerValue: param.headerValue,
            // UI uses body field
            body: param.body || param.bodyField,
            cookieName: param.cookieName,
            cookieValue: param.cookieValue,
          }))
        : []
    },
    initialMatch: {
      conditions: rule.initialMatch?.conditions || [],
      action: transformAction(rule.initialMatch?.action) || { type: 'block' }
    },
    elseIfActions: Array.isArray(rule.elseIfActions)
      ? rule.elseIfActions.map((elseIf: any) => ({
          conditions: elseIf.conditions || [],
          action: transformAction(elseIf.action) || { type: 'block' }
        }))
      : [],
    elseAction: transformAction(rule.elseAction),
  };
}