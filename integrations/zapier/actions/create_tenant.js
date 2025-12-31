const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://inmovaapp.com/api/v1/tenants',
    body: {
      firstName: bundle.inputData.firstName,
      lastName: bundle.inputData.lastName,
      email: bundle.inputData.email,
      phone: bundle.inputData.phone,
      dni: bundle.inputData.dni,
      nationality: bundle.inputData.nationality,
      birthDate: bundle.inputData.birthDate,
    },
  });

  return response.json;
};

module.exports = {
  key: 'create_tenant',
  noun: 'Tenant',

  display: {
    label: 'Create Tenant',
    description: 'Creates a new tenant in Inmova.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'firstName',
        label: 'First Name',
        type: 'string',
        required: true,
      },
      {
        key: 'lastName',
        label: 'Last Name',
        type: 'string',
        required: true,
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        required: true,
        helpText: 'Tenant email address',
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'string',
        required: false,
      },
      {
        key: 'dni',
        label: 'DNI/ID Number',
        type: 'string',
        required: false,
      },
      {
        key: 'nationality',
        label: 'Nationality',
        type: 'string',
        required: false,
      },
      {
        key: 'birthDate',
        label: 'Birth Date',
        type: 'datetime',
        required: false,
      },
    ],

    sample: {
      id: 'tenant_123',
      firstName: 'Juan',
      lastName: 'García',
      email: 'juan.garcia@example.com',
      phone: '+34612345678',
    },
  },
};
