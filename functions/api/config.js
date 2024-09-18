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

// functions/api/config.js
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    console.log('Received POST request to /api/config');

    const configStorageId = env.CONFIG_STORAGE.idFromName('global');
    console.log('ConfigStorage ID:', configStorageId);

    const configStorage = env.CONFIG_STORAGE.get(configStorageId);
    console.log('Retrieved ConfigStorage object');

    const newConfig = await request.json();
    console.log('Parsed request body:', JSON.stringify(newConfig));

    const response = await configStorage.fetch('https://rate-limiter-ui/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
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
