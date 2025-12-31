const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://inmovaapp.com/api/v1/properties',
    params: {
      limit: bundle.meta.limit || 10,
      page: bundle.meta.page || 1,
    },
  });

  return response.json.data;
};

const performList = async (z, bundle) => {
  return perform(z, bundle);
};

const performSubscribe = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://inmovaapp.com/api/v1/webhooks',
    body: {
      url: bundle.targetUrl,
      events: ['PROPERTY_CREATED'],
      description: `Zapier: ${bundle.meta.zap?.title || 'Property Created Trigger'}`,
    },
  });

  return response.json;
};

const performUnsubscribe = async (z, bundle) => {
  await z.request({
    method: 'DELETE',
    url: `https://inmovaapp.com/api/v1/webhooks/${bundle.subscribeData.id}`,
  });

  return {};
};

module.exports = {
  key: 'property_created',
  noun: 'Property',

  display: {
    label: 'New Property',
    description: 'Triggers when a new property is created.',
    important: true,
  },

  operation: {
    type: 'hook',
    perform: perform,
    performList: performList,
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,

    inputFields: [],

    sample: {
      id: 'prop_123',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      price: 1200,
      rooms: 3,
      bathrooms: 2,
      squareMeters: 85,
      status: 'AVAILABLE',
      type: 'APARTMENT',
      createdAt: '2025-01-15T10:00:00Z',
    },

    outputFields: [
      { key: 'id', label: 'Property ID', type: 'string' },
      { key: 'address', label: 'Address', type: 'string' },
      { key: 'city', label: 'City', type: 'string' },
      { key: 'price', label: 'Price (€/month)', type: 'number' },
      { key: 'rooms', label: 'Rooms', type: 'integer' },
      { key: 'bathrooms', label: 'Bathrooms', type: 'integer' },
      { key: 'squareMeters', label: 'Square Meters', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'type', label: 'Type', type: 'string' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],
  },
};
