const testAuth = async (z, bundle) => {
  // Test API key by fetching user info
  const response = await z.request({
    method: 'GET',
    url: 'https://inmovaapp.com/api/v1/properties',
    params: { limit: 1 },
  });

  if (response.status !== 200) {
    throw new Error('Invalid API key');
  }

  return response.json;
};

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText:
        'Get your API key from [Inmova Dashboard](https://inmovaapp.com/dashboard/integrations/api-keys)',
    },
  ],
  test: testAuth,
  connectionLabel: '{{bundle.authData.apiKey}}',
};
