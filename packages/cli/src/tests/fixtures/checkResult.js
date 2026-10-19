const issueGroup = (tag) => ({
  type: 'read',
  violations: [{ type: 'some_trigger', results: [{ message: tag, tag }] }],
});

// Mirrors the shape of a POST /check response. Counts drive how many issues land
// in each bucket; the display labels are the ones the backend sends.
const checkResult = ({ errors = 0, warnings = 0, suggestions = 0 } = {}) => ({
  errors: {
    total_failures: errors,
    results: errors ? [issueGroup('D001')] : [],
    display_label: 'Errors',
  },
  warnings: {
    total_failures: warnings,
    results: warnings ? [issueGroup('L004')] : [],
    display_label: 'Publishing Tasks',
  },
  suggestions: {
    total_failures: suggestions,
    results: suggestions ? [issueGroup('A001')] : [],
    display_label: 'Warnings',
  },
  total_failures: errors + warnings + suggestions,
  passes: [{ tag: 'D002' }],
});

module.exports = {
  checkResult,
};
