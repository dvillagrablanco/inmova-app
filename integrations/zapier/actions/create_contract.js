const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://inmovaapp.com/api/v1/contracts',
    body: {
      propertyId: bundle.inputData.propertyId,
      tenantId: bundle.inputData.tenantId,
      startDate: bundle.inputData.startDate,
      endDate: bundle.inputData.endDate,
      monthlyRent: parseFloat(bundle.inputData.monthlyRent),
      deposit: bundle.inputData.deposit ? parseFloat(bundle.inputData.deposit) : undefined,
      contractType: bundle.inputData.contractType || 'RESIDENTIAL',
    },
  });

  return response.json;
};

module.exports = {
  key: 'create_contract',
  noun: 'Contract',

  display: {
    label: 'Create Contract',
    description: 'Creates a new rental contract in Inmova.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'propertyId',
        label: 'Property',
        type: 'string',
        required: true,
        dynamic: 'find_property.id.address',
      },
      {
        key: 'tenantId',
        label: 'Tenant',
        type: 'string',
        required: true,
        dynamic: 'find_tenant.id.name',
      },
      {
        key: 'startDate',
        label: 'Start Date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'endDate',
        label: 'End Date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'monthlyRent',
        label: 'Monthly Rent (€)',
        type: 'number',
        required: true,
      },
      {
        key: 'deposit',
        label: 'Deposit (€)',
        type: 'number',
        required: false,
        helpText: 'Usually 1-2 months of rent',
      },
      {
        key: 'contractType',
        label: 'Contract Type',
        type: 'string',
        required: false,
        default: 'RESIDENTIAL',
        choices: [
          { value: 'RESIDENTIAL', label: 'Residential' },
          { value: 'COMMERCIAL', label: 'Commercial' },
          { value: 'VACATION', label: 'Vacation' },
        ],
      },
    ],

    sample: {
      id: 'contract_123',
      propertyId: 'prop_123',
      tenantId: 'tenant_123',
      startDate: '2025-02-01',
      monthlyRent: 1200,
      status: 'PENDING',
    },
  },
};
