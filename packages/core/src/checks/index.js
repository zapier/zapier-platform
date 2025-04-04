module.exports = {
  createIsObject: require('./create-is-object'),

  searchIsArray: require('./search-is-array'),

  triggerIsArray: require('./trigger-is-array'),
  triggerIsObject: require('./trigger-is-object'),
  triggerHasUniquePrimary: require('./trigger-has-unique-primary'),
  triggerHasId: require('./trigger-has-id'),

  firehoseSubscriptionIsArray: require('./firehose_is_array'),
  firehoseSubscriptionKeyIsString: require('./firehose_is_string'),

  performBufferReturnType: require('./perform-buffer-return-type'),

  dynamicFieldsHaveKeys: require('./dynamic-fields-have-keys'),
};
