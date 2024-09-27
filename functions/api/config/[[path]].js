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

function normalizeAction(action) {
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

function normalizeRule(rule) {
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
    if (jsonResponse.rules) {
      jsonResponse.rules = jsonResponse.rules.map(normalizeRule);
    } else if (jsonResponse.rule) {
      jsonResponse.rule = normalizeRule(jsonResponse.rule);
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

    const normalizedNewRule = normalizeRule(newRule);

    const response = await configStorage.fetch(
      "https://rate-limit-configurator/config",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedNewRule),
      },
    );
    console.log(
      "[[path]].js: Received response from ConfigStorage:",
      response.status,
    );

    const responseBody = await response.text();
    console.log("[[path]].js: Response body:", responseBody);

    const jsonResponse = JSON.parse(responseBody);
    if (jsonResponse.rule) {
      jsonResponse.rule = normalizeRule(jsonResponse.rule);
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
      const normalizedRules = updatedData.rules.map(normalizeRule);
      response = await configStorage.fetch(
        "https://rate-limit-configurator/config/reorder",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules: normalizedRules }),
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
        const normalizedUpdatedData = normalizeRule(updatedData);
        response = await configStorage.fetch(
          `https://rate-limit-configurator/rules/${ruleId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizedUpdatedData),
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
    if (jsonResponse.rules) {
      jsonResponse.rules = jsonResponse.rules.map(normalizeRule);
    } else if (jsonResponse.rule) {
      jsonResponse.rule = normalizeRule(jsonResponse.rule);
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

function isValidRuleStructure(rule) {
  return (
    rule &&
    typeof rule === "object" &&
    typeof rule.id === "string" &&
    typeof rule.order === "number" &&
    typeof rule.version === "number" &&
    typeof rule.name === "string" &&
    typeof rule.description === "string" &&
    typeof rule.rateLimit === "object" &&
    typeof rule.rateLimit.limit === "number" &&
    typeof rule.rateLimit.period === "number" &&
    typeof rule.fingerprint === "object" &&
    Array.isArray(rule.fingerprint.parameters) &&
    typeof rule.initialMatch === "object" &&
    Array.isArray(rule.initialMatch.conditions) &&
    typeof rule.initialMatch.action === "object" &&
    Array.isArray(rule.elseIfActions) &&
    (!rule.elseAction || typeof rule.elseAction === "object")
  );
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
