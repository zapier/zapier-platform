module.exports = {
  createIsObject: require('./create-is-object'),

  searchIsArray: require('./search-is-array'),

  triggerIsArray: require('./trigger-is-array'),
  triggerIsObject: require('./trigger-is-object'),
  triggerHasUniqueIds: require('./trigger-has-unique-ids'),
  triggerHasUniquePrimary: require('./trigger-has-unique-primary'),
  firehoseSubscriptionIsArray: require('./firehose_is_array'),
  firehoseSubscriptionKeyIsString: require('./firehose_is_string'),
};
