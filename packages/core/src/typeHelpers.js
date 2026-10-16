module.exports = {
  /**
   * @deprecated use one of the following functions instead:
   * - defineStaticInputField
   * - defineKnownInputFieldsFunc
   * - defineCustomInputFieldsFunc
   */
  defineInputField: (inputField) => inputField,

  defineStaticInputField: (inputField) => inputField,
  defineKnownInputFieldsFunc: (func) => func,
  defineCustomInputFieldsFunc: (func) => func,

  defineInputFields: (inputFields) => inputFields,
  defineCreate: (create) => create,
  defineTrigger: (trigger) => trigger,
  defineSearch: (search) => search,
  defineApp: (app) => app,
};
