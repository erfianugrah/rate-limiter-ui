export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const configStorageId = env.CONFIG_STORAGE.idFromName('global');
  const configStorage = env.CONFIG_STORAGE.get(configStorageId);

  console.log(`config.js: Received GET request for path: ${path}`);

  let response;
  if (path === '/api/config') {
    console.log('config.js: Fetching config from ConfigStorage');
    response = await configStorage.fetch('https://rate-limit-configurator/config');
    console.log('config.js: Received response from ConfigStorage:', response.status);
  } else if (path.startsWith('/api/config/rules/')) {
    const ruleId = path.split('/').pop();
    console.log(`config.js: Fetching rule with ID: ${ruleId}`);
    response = await configStorage.fetch(`https://rate-limit-configurator/rules/${ruleId}`);
  } else {
    console.log(`config.js: Invalid GET path: ${path}`);
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responseBody = await response.text();
  console.log('config.js: Response body from ConfigStorage:', responseBody);

  return new Response(responseBody, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    console.log('config.js: Received POST request to /api/config');

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('config.js: ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('config.js: Retrieved ConfigStorage object');

    const newRule = await request.json();
    console.log('config.js: Parsed request body:', JSON.stringify(newRule));

    const response = await configStorage.fetch('https://rate-limit-configurator/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    console.log('config.js: Received response from ConfigStorage:', response.status);

    const responseBody = await response.text();
    console.log('config.js: Response body:', responseBody);

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('config.js: Error in onRequestPost:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  console.log('config.js: Received PUT request to', path);

  try {
    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('config.js: ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('config.js: Retrieved ConfigStorage object');

    const updatedData = await request.json();
    console.log('config.js: Parsed request body:', JSON.stringify(updatedData));

    let response;
    if (path === '/api/config/reorder') {
      console.log('config.js: Reordering rules');
      response = await configStorage.fetch('https://rate-limit-configurator/config/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } else if (path.startsWith('/api/config/rules/')) {
      const ruleId = path.split('/').pop();
      console.log(`config.js: Updating rule with ID: ${ruleId}`);
      response = await configStorage.fetch(`https://rate-limit-configurator/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } else {
      console.log(`config.js: Invalid PUT path: ${path}`);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('config.js: Received response from ConfigStorage:', response.status);

    const responseBody = await response.text();
    console.log('config.js: Response body:', responseBody);

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('config.js: Error in onRequestPut:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  console.log('config.js: Received DELETE request to', path);

  try {
    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('config.js: ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('config.js: Retrieved ConfigStorage object');

    if (path.startsWith('/api/config/rules/')) {
      const ruleId = path.split('/').pop();
      console.log(`config.js: Deleting rule with ID: ${ruleId}`);
      const response = await configStorage.fetch(
        `https://rate-limit-configurator/rules/${ruleId}`,
        {
          method: 'DELETE',
        }
      );

      console.log('config.js: Received response from ConfigStorage:', response.status);

      const responseBody = await response.text();
      console.log('config.js: Response body:', responseBody);

      return new Response(responseBody, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`config.js: Invalid DELETE path: ${path}`);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('config.js: Error in onRequestDelete:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Catch-all handler
export const onRequest = async (context) => {
  const { request } = context;
  console.log(`config.js: Received ${request.method} request for ${request.url}`);

  switch (request.method) {
    case 'GET':
      return onRequestGet(context);
    case 'POST':
      return onRequestPost(context);
    case 'PUT':
      return onRequestPut(context);
    case 'DELETE':
      return onRequestDelete(context);
    case 'OPTIONS':
      return onRequestOptions(context);
    default:
      console.log(`config.js: Unsupported method ${request.method}`);
      return new Response('Method Not Allowed', { status: 405 });
  }
};
