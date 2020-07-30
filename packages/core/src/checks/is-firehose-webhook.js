module.exports = (method) => {
  return (
    method.startsWith('firehoseWebhooks.') &&
    method.endsWith('.performSubscriptionKeyList')
  );
};
