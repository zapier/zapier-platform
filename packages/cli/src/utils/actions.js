const ACTION_TYPES = [
  'trigger',
  'create',
  'search',
  'searchOrCreate',
  'bulkRead',
];

const validateActions = (actions) => {
  return actions.map((action) => {
    if (!action.includes('/')) {
      throw new Error(
        `Invalid action format: "${action}". Expected format is "{action_type}/{action_key}".`,
      );
    }

    const [actionType, actionKey] = action.split('/');
    if (!ACTION_TYPES.includes(actionType)) {
      throw new Error(
        `Invalid action type "${actionType}" in "${action}". Valid types are: ${ACTION_TYPES.join(
          ', ',
        )}.`,
      );
    }

    return {
      type: actionType,
      key: actionKey,
    };
  });
};

module.exports = {
  ACTION_TYPES,
  validateActions,
};
