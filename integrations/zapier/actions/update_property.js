const perform = async (z, bundle) => {
  const updateData = {};

  if (bundle.inputData.price) updateData.price = parseFloat(bundle.inputData.price);
  if (bundle.inputData.status) updateData.status = bundle.inputData.status;
  if (bundle.inputData.description) updateData.description = bundle.inputData.description;
  if (bundle.inputData.rooms) updateData.rooms = parseInt(bundle.inputData.rooms);
  if (bundle.inputData.bathrooms) updateData.bathrooms = parseInt(bundle.inputData.bathrooms);

  const response = await z.request({
    method: 'PUT',
    url: `https://inmovaapp.com/api/v1/properties/${bundle.inputData.propertyId}`,
    body: updateData,
  });

  return response.json;
};

module.exports = {
  key: 'update_property',
  noun: 'Property',

  display: {
    label: 'Update Property',
    description: 'Updates an existing property in Inmova.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'propertyId',
        label: 'Property ID',
        type: 'string',
        required: true,
        dynamic: 'find_property.id.address',
      },
      {
        key: 'price',
        label: 'Price (€/month)',
        type: 'number',
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
        key: 'rooms',
        label: 'Number of Rooms',
        type: 'integer',
        required: false,
      },
      {
        key: 'bathrooms',
        label: 'Number of Bathrooms',
        type: 'integer',
        required: false,
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        required: false,
      },
    ],

    sample: {
      id: 'prop_123',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      price: 1300,
      status: 'RENTED',
    },
  },
};
