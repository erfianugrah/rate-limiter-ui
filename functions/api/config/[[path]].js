export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
};

/**
 * Transforms a rule from any format to the canonical format expected by the API
 */
function transformToCanonicalRule(rule) {
  // Use canonical priority field (fallback to order for backward compatibility)
  const priority = rule.priority !== undefined ? rule.priority : rule.order;
  
  // Transform fingerprint parameters to ensure they match the canonical format
  const fingerprintParameters = Array.isArray(rule.fingerprint?.parameters) 
    ? rule.fingerprint.parameters.map((param) => ({
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
  const transformAction = (action) => {
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
    id: rule.id,
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
      ? rule.elseIfActions.map((elseIf) => ({
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
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

/**
 * Transforms a rule from the canonical API format to the UI format
 */
function transformToUIRule(rule) {
  // Transform actions to UI format
  const transformAction = (action) => {
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
        ? rule.fingerprint.parameters.map((param) => ({
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
      ? rule.elseIfActions.map((elseIf) => ({
          conditions: elseIf.conditions || [],
          action: transformAction(elseIf.action) || { type: 'block' }
        }))
      : [],
    elseAction: transformAction(rule.elseAction),
  };
}

/**
 * Legacy function for backward compatibility
 * Normalizes a rule to ensure all required fields are present
 */
function normalizeRule(rule) {
  return transformToUIRule(transformToCanonicalRule(rule));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const configStorageId = env.CONFIG_STORAGE.idFromName("global");
  const configStorage = env.CONFIG_STORAGE.get(configStorageId);

  console.log(`[[path]].js: Received GET request for path: ${path}`);

  let response;
  if (path === "/api/config") {
    console.log("[[path]].js: Fetching config from ConfigStorage");
    response = await configStorage.fetch(
      "https://rate-limit-configurator/config",
    );
  } else if (path.startsWith("/api/config/rules/")) {
    const parts = path.split("/");
    const ruleId = parts[4];
    if (parts[5] === "versions") {
      console.log(`[[path]].js: Fetching versions for rule with ID: ${ruleId}`);
      response = await configStorage.fetch(
        `https://rate-limit-configurator/versions/${ruleId}`,
      );
    } else {
      console.log(`[[path]].js: Fetching rule with ID: ${ruleId}`);
      response = await configStorage.fetch(
        `https://rate-limit-configurator/rules/${ruleId}`,
      );
    }
  } else {
    console.log(`[[path]].js: Invalid GET path: ${path}`);
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(
    "[[path]].js: Response status from ConfigStorage:",
    response.status,
  );

  const responseBody = await response.text();
  console.log("[[path]].js: Response body from ConfigStorage:", responseBody);

  // Ensure we're returning JSON
  try {
    const jsonResponse = JSON.parse(responseBody);
    
    // Transform rules from canonical format to UI format
    if (jsonResponse.rules) {
      jsonResponse.rules = jsonResponse.rules.map(rule => transformToUIRule(rule));
    } else if (jsonResponse.rule) {
      jsonResponse.rule = transformToUIRule(jsonResponse.rule);
    } else if (jsonResponse.versions && Array.isArray(jsonResponse.versions)) {
      // Handle version history - transform each version's rule
      jsonResponse.versions = jsonResponse.versions.map(version => ({
        ...version,
        rule: transformToUIRule(version.rule)
      }));
    }
    
    return new Response(JSON.stringify(jsonResponse), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[[path]].js: Error parsing JSON response:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON response", details: responseBody }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    console.log("[[path]].js: Received POST request to /api/config");

    const configStorageId = env.CONFIG_STORAGE.idFromName("global");
    console.log("[[path]].js: ConfigStorage ID:", configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log("[[path]].js: Retrieved ConfigStorage object");

    const newRule = await request.json();
    console.log("[[path]].js: Parsed request body:", JSON.stringify(newRule));

    if (!isValidRuleStructure(newRule)) {
      console.error("[[path]].js: Invalid rule structure", newRule);
      return new Response(JSON.stringify({ error: "Invalid rule structure" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform to canonical format for the API
    const canonicalRule = transformToCanonicalRule(newRule);
    console.log("[[path]].js: Transformed to canonical rule format:", canonicalRule);

    const response = await configStorage.fetch(
      "https://rate-limit-configurator/config",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canonicalRule),
      },
    );
    console.log(
      "[[path]].js: Received response from ConfigStorage:",
      response.status,
    );

    const responseBody = await response.text();
    console.log("[[path]].js: Response body:", responseBody);

    const jsonResponse = JSON.parse(responseBody);
    
    // Transform any returned rule to UI format
    if (jsonResponse.rule) {
      jsonResponse.rule = transformToUIRule(jsonResponse.rule);
    }

    return new Response(JSON.stringify(jsonResponse), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[[path]].js: Error in onRequestPost:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  console.log("[[path]].js: Received PUT request to", path);

  try {
    const configStorageId = env.CONFIG_STORAGE.idFromName("global");
    console.log("[[path]].js: ConfigStorage ID:", configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log("[[path]].js: Retrieved ConfigStorage object");

    const updatedData = await request.json();
    console.log(
      "[[path]].js: Parsed request body:",
      JSON.stringify(updatedData),
    );

    let response;
    if (path === "/api/config/reorder") {
      console.log("[[path]].js: Reordering rules");
      
      // Transform all rules to canonical format for the API
      const canonicalRules = updatedData.rules.map((rule, index) => {
        // Update priority based on new order
        return transformToCanonicalRule({
          ...rule,
          priority: index,
          order: index
        });
      });
      
      response = await configStorage.fetch(
        "https://rate-limit-configurator/config/reorder",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules: canonicalRules }),
        },
      );
    } else if (path.startsWith("/api/config/rules/")) {
      const parts = path.split("/");
      const ruleId = parts[4];
      if (parts[5] === "revert") {
        console.log(`[[path]].js: Reverting rule with ID: ${ruleId}`);
        response = await configStorage.fetch(
          `https://rate-limit-configurator/rules/${ruleId}/revert`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
          },
        );
      } else {
        console.log(`[[path]].js: Updating rule with ID: ${ruleId}`);
        if (!isValidRuleStructure(updatedData)) {
          console.error("[[path]].js: Invalid rule structure", updatedData);
          return new Response(
            JSON.stringify({ error: "Invalid rule structure" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        
        // Transform to canonical format for API
        const canonicalRule = transformToCanonicalRule(updatedData);
        console.log("[[path]].js: Transformed to canonical rule format:", canonicalRule);
        
        response = await configStorage.fetch(
          `https://rate-limit-configurator/rules/${ruleId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(canonicalRule),
          },
        );
      }
    } else {
      console.log(`[[path]].js: Invalid PUT path: ${path}`);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      "[[path]].js: Received response from ConfigStorage:",
      response.status,
    );

    const responseBody = await response.text();
    console.log("[[path]].js: Response body:", responseBody);

    const jsonResponse = JSON.parse(responseBody);
    
    // Transform from canonical format to UI format
    if (jsonResponse.rules) {
      jsonResponse.rules = jsonResponse.rules.map(rule => transformToUIRule(rule));
    } else if (jsonResponse.rule) {
      jsonResponse.rule = transformToUIRule(jsonResponse.rule);
    } else if (jsonResponse.versions && Array.isArray(jsonResponse.versions)) {
      // Handle rule version history
      jsonResponse.versions = jsonResponse.versions.map(version => ({
        ...version,
        rule: transformToUIRule(version.rule)
      }));
    }

    return new Response(JSON.stringify(jsonResponse), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[[path]].js: Error in onRequestPut:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  console.log("[[path]].js: Received DELETE request to", path);

  try {
    const configStorageId = env.CONFIG_STORAGE.idFromName("global");
    console.log("[[path]].js: ConfigStorage ID:", configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log("[[path]].js: Retrieved ConfigStorage object");

    if (path.startsWith("/api/config/rules/")) {
      const ruleId = path.split("/").pop();
      console.log(`[[path]].js: Deleting rule with ID: ${ruleId}`);
      const response = await configStorage.fetch(
        `https://rate-limit-configurator/rules/${ruleId}`,
        {
          method: "DELETE",
        },
      );

      console.log(
        "[[path]].js: Received response from ConfigStorage:",
        response.status,
      );

      const responseBody = await response.text();
      console.log("[[path]].js: Response body:", responseBody);

      return new Response(responseBody, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log(`[[path]].js: Invalid DELETE path: ${path}`);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[[path]].js: Error in onRequestDelete:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Validates that a rule has the minimum required structure
 * Supports both canonical format (priority) and UI format (order)
 */
function isValidRuleStructure(rule) {
  // Check if rule exists and is an object
  if (!rule || typeof rule !== "object") {
    console.log("Invalid rule: not an object", rule);
    return false;
  }

  // Check required string fields
  if (typeof rule.id !== "string") {
    console.log("Invalid rule: missing id", rule);
    return false;
  }
  
  if (typeof rule.name !== "string") {
    console.log("Invalid rule: missing name", rule);
    return false;
  }
  
  if (typeof rule.description !== "string") {
    console.log("Invalid rule: missing description", rule);
    return false;
  }

  // Check ordering field (either order or priority)
  if (
    (typeof rule.order !== "number" && typeof rule.priority !== "number") ||
    (rule.order === undefined && rule.priority === undefined)
  ) {
    console.log("Invalid rule: missing order/priority", rule);
    return false;
  }

  // Check version (optional in canonical format)
  if (rule.version !== undefined && typeof rule.version !== "number") {
    console.log("Invalid rule: invalid version", rule);
    return false;
  }

  // Check rate limit structure
  if (
    typeof rule.rateLimit !== "object" ||
    typeof rule.rateLimit.limit !== "number" ||
    typeof rule.rateLimit.period !== "number"
  ) {
    console.log("Invalid rule: invalid rateLimit", rule.rateLimit);
    return false;
  }

  // Check fingerprint structure
  if (
    typeof rule.fingerprint !== "object" ||
    !Array.isArray(rule.fingerprint.parameters)
  ) {
    console.log("Invalid rule: invalid fingerprint", rule.fingerprint);
    return false;
  }

  // Check initial match structure
  if (
    typeof rule.initialMatch !== "object" ||
    !Array.isArray(rule.initialMatch.conditions) ||
    typeof rule.initialMatch.action !== "object" ||
    typeof rule.initialMatch.action.type !== "string"
  ) {
    console.log("Invalid rule: invalid initialMatch", rule.initialMatch);
    return false;
  }

  // Check elseIfActions
  if (!Array.isArray(rule.elseIfActions)) {
    console.log("Invalid rule: invalid elseIfActions", rule.elseIfActions);
    return false;
  }

  // Check elseAction if it exists
  if (
    rule.elseAction !== undefined &&
    (typeof rule.elseAction !== "object" || typeof rule.elseAction.type !== "string")
  ) {
    console.log("Invalid rule: invalid elseAction", rule.elseAction);
    return false;
  }

  return true;
}

export const onRequest = async (context) => {
  const { request } = context;
  console.log(
    `[[path]].js: Received ${request.method} request for ${request.url}`,
  );

  switch (request.method) {
    case "GET":
      return onRequestGet(context);
    case "POST":
      return onRequestPost(context);
    case "PUT":
      return onRequestPut(context);
    case "DELETE":
      return onRequestDelete(context);
    case "OPTIONS":
      return onRequestOptions(context);
    default:
      console.log(`[[path]].js: Unsupported method ${request.method}`);
      return new Response("Method Not Allowed", { status: 405 });
  }
};
