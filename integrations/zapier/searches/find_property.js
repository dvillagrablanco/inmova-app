const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://inmovaapp.com/api/v1/properties',
    params: {
      city: bundle.inputData.city,
      status: bundle.inputData.status,
      minPrice: bundle.inputData.minPrice,
      maxPrice: bundle.inputData.maxPrice,
      limit: 10,
    },
  });

  return response.json.data;
};

module.exports = {
  key: 'find_property',
  noun: 'Property',

  display: {
    label: 'Find Property',
    description: 'Searches for properties in Inmova.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'city',
        label: 'City',
        type: 'string',
        required: false,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        choices: [
          { value: 'AVAILABLE', label: 'Available' },
          { value: 'RENTED', label: 'Rented' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'SOLD', label: 'Sold' },
        ],
      },
      {
        key: 'minPrice',
        label: 'Min Price (€)',
        type: 'number',
        required: false,
      },
      {
        key: 'maxPrice',
        label: 'Max Price (€)',
        type: 'number',
        required: false,
      },
    ],

    sample: {
      id: 'prop_123',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      price: 1200,
      status: 'AVAILABLE',
      type: 'APARTMENT',
    },

    outputFields: [
      { key: 'id', label: 'Property ID' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'price', label: 'Price (€)' },
      { key: 'status', label: 'Status' },
      { key: 'type', label: 'Type' },
    ],
  },
};
