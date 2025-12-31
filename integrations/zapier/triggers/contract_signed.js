const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://inmovaapp.com/api/v1/contracts',
    params: {
      status: 'SIGNED',
      limit: bundle.meta.limit || 10,
      page: bundle.meta.page || 1,
    },
  });

  return response.json.data;
};

const performSubscribe = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://inmovaapp.com/api/v1/webhooks',
    body: {
      url: bundle.targetUrl,
      events: ['CONTRACT_SIGNED'],
      description: `Zapier: ${bundle.meta.zap?.title || 'Contract Signed Trigger'}`,
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
  key: 'contract_signed',
  noun: 'Contract',

  display: {
    label: 'Contract Signed',
    description: 'Triggers when a contract is signed by all parties.',
    important: true,
  },

  operation: {
    type: 'hook',
    perform: perform,
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,

    sample: {
      id: 'contract_123',
      propertyId: 'prop_123',
      tenantId: 'tenant_123',
      startDate: '2025-02-01',
      endDate: '2026-01-31',
      monthlyRent: 1200,
      deposit: 1200,
      status: 'SIGNED',
      signedAt: '2025-01-15T14:30:00Z',
    },

    outputFields: [
      { key: 'id', label: 'Contract ID', type: 'string' },
      { key: 'propertyId', label: 'Property ID', type: 'string' },
      { key: 'tenantId', label: 'Tenant ID', type: 'string' },
      { key: 'startDate', label: 'Start Date', type: 'datetime' },
      { key: 'endDate', label: 'End Date', type: 'datetime' },
      { key: 'monthlyRent', label: 'Monthly Rent (€)', type: 'number' },
      { key: 'deposit', label: 'Deposit (€)', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'signedAt', label: 'Signed At', type: 'datetime' },
    ],
  },
};
