const ACTION_TYPES = [
  'trigger',
  'create',
  'search',
  'searchOrCreate',
  'bulkRead',
];

const validateActions = (actions, appDefinition = null) => {
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

    // If app definition is provided, validate that the action exists
    if (appDefinition) {
      validateActionExistsInApp(actionType, actionKey, appDefinition, action);
    }

    return {
      type: actionType,
      key: actionKey,
    };
  });
};

const validateActionExistsInApp = (
  actionType,
  actionKey,
  appDefinition,
  originalAction,
) => {
  // Map action types to their plural forms in the app definition
  const typeMapping = {
    trigger: 'triggers',
    create: 'creates',
    search: 'searches',
    searchOrCreate: 'searchOrCreates',
    bulkRead: 'bulkReads',
  };

  const pluralType = typeMapping[actionType];
  const actionsOfType = appDefinition[pluralType] || {};

  // Check if the action key exists in the app definition
  if (!actionsOfType[actionKey]) {
    const availableKeys = Object.keys(actionsOfType);
    const availableMessage =
      availableKeys.length > 0
        ? ` Available ${actionType} actions: ${availableKeys.join(', ')}.`
        : ` No ${actionType} actions found in the app.`;

    throw new Error(
      `Action "${originalAction}" does not exist in the app.${availableMessage}`,
    );
  }
};

module.exports = {
  ACTION_TYPES,
  validateActions,
};
