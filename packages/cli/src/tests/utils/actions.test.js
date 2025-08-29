const { expect } = require('chai');
const { validateActions, ACTION_TYPES } = require('../../utils/actions');

describe('actions utility', () => {
  describe('validateActions', () => {
    it('should validate correct action formats', () => {
      const actions = ['trigger/test', 'create/item', 'search/find'];
      const result = validateActions(actions);

      expect(result).to.have.length(3);
      expect(result[0]).to.deep.equal({ type: 'trigger', key: 'test' });
      expect(result[1]).to.deep.equal({ type: 'create', key: 'item' });
      expect(result[2]).to.deep.equal({ type: 'search', key: 'find' });
    });

    it('should reject actions without forward slash', () => {
      expect(() => validateActions(['invalid'])).to.throw(
        'Invalid action format: "invalid". Expected format is "{action_type}/{action_key}".',
      );
    });

    it('should reject invalid action types', () => {
      expect(() => validateActions(['invalid/key'])).to.throw(
        'Invalid action type "invalid" in "invalid/key". Valid types are: trigger, create, search, searchOrCreate, bulkRead.',
      );
    });

    it('should accept all valid action types', () => {
      const actions = ACTION_TYPES.map((type) => `${type}/test`);
      const result = validateActions(actions);

      expect(result).to.have.length(ACTION_TYPES.length);
      result.forEach((action, index) => {
        expect(action.type).to.equal(ACTION_TYPES[index]);
        expect(action.key).to.equal('test');
      });
    });
  });
});
