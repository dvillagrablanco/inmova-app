const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://inmovaapp.com/api/v1/payments',
    params: {
      status: 'COMPLETED',
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
      events: ['PAYMENT_RECEIVED'],
      description: `Zapier: ${bundle.meta.zap?.title || 'Payment Received Trigger'}`,
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
  key: 'payment_received',
  noun: 'Payment',

  display: {
    label: 'Payment Received',
    description: 'Triggers when a payment is successfully received.',
    important: true,
  },

  operation: {
    type: 'hook',
    perform: perform,
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,

    sample: {
      id: 'payment_123',
      contractId: 'contract_123',
      amount: 1200,
      concept: 'Monthly rent - February 2025',
      status: 'COMPLETED',
      method: 'BANK_TRANSFER',
      receivedAt: '2025-02-01T09:00:00Z',
    },

    outputFields: [
      { key: 'id', label: 'Payment ID', type: 'string' },
      { key: 'contractId', label: 'Contract ID', type: 'string' },
      { key: 'amount', label: 'Amount (€)', type: 'number' },
      { key: 'concept', label: 'Concept', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'method', label: 'Payment Method', type: 'string' },
      { key: 'receivedAt', label: 'Received At', type: 'datetime' },
    ],
  },
};
