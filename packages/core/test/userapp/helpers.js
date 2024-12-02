module.exports = {
  noop: (s) => {
    return s;
  },
  getCustomFields: async (z, bundle) => {
    const expensiveCustomFieldsRequestMock = async () => {
      return {
        data: [{ key: 'custom-field-1' }, { key: 'custom-field-2' }],
      };
    };

    const cachedData = await z.cache.get('custom-fields');
    if (cachedData) {
      return cachedData;
    }

    const response = await expensiveCustomFieldsRequestMock();
    const data = response.data;
    await z.cache.set('custom-fields', data);

    return data;
  },
};
