module.exports = {
  ROOT_GITHUB: 'https://github.com/zapier/zapier-platform-schema',
  DOCS_PATH: 'docs/build/schema.md',
  SKIP_KEY: '_skipTest',
  // the following pairs of keys can't be used together in FieldSchema
  // they're stored here because they're used in a few places
  INCOMPATIBLE_FIELD_SCHEMA_KEYS: [
    ['children', 'list'], // This is actually a Feature Request (https://github.com/zapier/zapier-platform-cli/issues/115)
    ['children', 'dict'], // dict is ignored
    ['children', 'type'], // type is ignored
    ['children', 'placeholder'], // placeholder is ignored
    ['children', 'helpText'], // helpText is ignored
    ['children', 'default'], // default is ignored
    ['dict', 'list'], // Use only one or the other
    ['dynamic', 'dict'], // dict is ignored
    ['dynamic', 'choices'] // choices are ignored
  ]
};
