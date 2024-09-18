// functions/api/config.js

export async function onRequestGet(context) {
  const { env } = context;
  const configStorageId = env.CONFIG_STORAGE.idFromName('global');
  const configStorage = env.CONFIG_STORAGE.get(configStorageId);

  const config = await configStorage.fetch('https://rate-limiter-ui/config');
  return new Response(await config.text(), {
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

    const newRules = await request.json();
    console.log('Parsed request body:', JSON.stringify(newRules));

    const response = await configStorage.fetch('https://rate-limiter-ui/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRules),
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

// New function to handle rule reordering
export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    console.log('Received PUT request to /api/config');

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('Retrieved ConfigStorage object');

    const updatedRules = await request.json();
    console.log('Parsed request body:', JSON.stringify(updatedRules));

    const response = await configStorage.fetch('https://rate-limiter-ui/config/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRules),
    });
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
