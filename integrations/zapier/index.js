const authentication = require('./authentication');
const propertyCreatedTrigger = require('./triggers/property_created');
const contractSignedTrigger = require('./triggers/contract_signed');
const paymentReceivedTrigger = require('./triggers/payment_received');
const createPropertyAction = require('./actions/create_property');
const updatePropertyAction = require('./actions/update_property');
const createTenantAction = require('./actions/create_tenant');
const createContractAction = require('./actions/create_contract');
const findPropertySearch = require('./searches/find_property');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    (request, z, bundle) => {
      request.headers['Authorization'] = `Bearer ${bundle.authData.apiKey}`;
      request.headers['User-Agent'] = 'Zapier/1.0';
      return request;
    },
  ],

  afterResponse: [],

  triggers: {
    [propertyCreatedTrigger.key]: propertyCreatedTrigger,
    [contractSignedTrigger.key]: contractSignedTrigger,
    [paymentReceivedTrigger.key]: paymentReceivedTrigger,
  },

  actions: {
    [createPropertyAction.key]: createPropertyAction,
    [updatePropertyAction.key]: updatePropertyAction,
    [createTenantAction.key]: createTenantAction,
    [createContractAction.key]: createContractAction,
  },

  searches: {
    [findPropertySearch.key]: findPropertySearch,
  },

  resources: {},
};
