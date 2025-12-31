const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://inmovaapp.com/api/v1/properties',
    body: {
      address: bundle.inputData.address,
      city: bundle.inputData.city,
      price: parseFloat(bundle.inputData.price),
      type: bundle.inputData.type,
      postalCode: bundle.inputData.postalCode,
      country: bundle.inputData.country || 'ES',
      rooms: bundle.inputData.rooms ? parseInt(bundle.inputData.rooms) : undefined,
      bathrooms: bundle.inputData.bathrooms ? parseInt(bundle.inputData.bathrooms) : undefined,
      squareMeters: bundle.inputData.squareMeters
        ? parseFloat(bundle.inputData.squareMeters)
        : undefined,
      floor: bundle.inputData.floor ? parseInt(bundle.inputData.floor) : undefined,
      status: bundle.inputData.status || 'AVAILABLE',
      description: bundle.inputData.description,
    },
  });

  return response.json;
};

module.exports = {
  key: 'create_property',
  noun: 'Property',

  display: {
    label: 'Create Property',
    description: 'Creates a new property in Inmova.',
    important: true,
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'address',
        label: 'Address',
        type: 'string',
        required: true,
        helpText: 'Full street address of the property',
      },
      {
        key: 'city',
        label: 'City',
        type: 'string',
        required: true,
      },
      {
        key: 'price',
        label: 'Price (€/month)',
        type: 'number',
        required: true,
        helpText: 'Monthly rental price in euros',
      },
      {
        key: 'type',
        label: 'Property Type',
        type: 'string',
        required: true,
        choices: [
          { value: 'APARTMENT', label: 'Apartment' },
          { value: 'HOUSE', label: 'House' },
          { value: 'ROOM', label: 'Room' },
          { value: 'STUDIO', label: 'Studio' },
          { value: 'OFFICE', label: 'Office' },
          { value: 'PARKING', label: 'Parking' },
          { value: 'STORAGE', label: 'Storage' },
        ],
      },
      {
        key: 'postalCode',
        label: 'Postal Code',
        type: 'string',
        required: false,
      },
      {
        key: 'country',
        label: 'Country',
        type: 'string',
        required: false,
        default: 'ES',
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
        key: 'squareMeters',
        label: 'Square Meters',
        type: 'number',
        required: false,
      },
      {
        key: 'floor',
        label: 'Floor Number',
        type: 'integer',
        required: false,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        default: 'AVAILABLE',
        choices: [
          { value: 'AVAILABLE', label: 'Available' },
          { value: 'RENTED', label: 'Rented' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
          { value: 'SOLD', label: 'Sold' },
        ],
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
    ],
  },
};
