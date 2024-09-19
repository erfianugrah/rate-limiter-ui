export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const configStorageId = env.CONFIG_STORAGE.idFromName('global');
  const configStorage = env.CONFIG_STORAGE.get(configStorageId);

  let response;
  if (path === '/api/config') {
    response = await configStorage.fetch('https://rate-limit-configurator/config');
  } else if (path.startsWith('/api/config/rules/')) {
    const ruleId = path.split('/').pop();
    response = await configStorage.fetch(`https://rate-limit-configurator/rules/${ruleId}`);
  } else {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    console.log('Received POST request to /api/config');

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('Retrieved ConfigStorage object');

    const newRule = await request.json();
    console.log('Parsed request body:', JSON.stringify(newRule));

    const response = await configStorage.fetch('https://rate-limit-configurator/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    console.log('Received response from ConfigStorage:', response.status);

    const responseBody = await response.text();
    console.log('Response body:', responseBody);

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in onRequestPost:', error);
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

  try {
    console.log('Received PUT request to', path);

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('Retrieved ConfigStorage object');

    const updatedData = await request.json();
    console.log('Parsed request body:', JSON.stringify(updatedData));

    let response;
    if (path === '/api/config/reorder') {
      response = await configStorage.fetch('https://rate-limit-configurator/config/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } else if (path.startsWith('/api/config/rules/')) {
      const ruleId = path.split('/').pop();
      response = await configStorage.fetch(`https://rate-limit-configurator/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Received response from ConfigStorage:', response.status);

    const responseBody = await response.text();
    console.log('Response body:', responseBody);

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in onRequestPut:', error);
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

  try {
    console.log('Received DELETE request to', path);

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('Retrieved ConfigStorage object');

    if (path.startsWith('/api/config/rules/')) {
      const ruleId = path.split('/').pop();
      const response = await configStorage.fetch(
        `https://rate-limit-configurator/rules/${ruleId}`,
        {
          method: 'DELETE',
        }
      );

      console.log('Received response from ConfigStorage:', response.status);

      const responseBody = await response.text();
      console.log('Response body:', responseBody);

      return new Response(responseBody, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in onRequestDelete:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
