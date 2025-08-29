const { expect } = require('chai');
const { validateActions, ACTION_TYPES } = require('../../utils/actions');

describe('actions utility', () => {
  describe('validateActions', () => {
    it('should validate correct action formats', () => {
      const actions = [
        'trigger/new_item',
        'create/create_item',
        'search/find_item',
      ];
      const result = validateActions(actions);

      expect(result).to.have.length(3);
      expect(result[0]).to.deep.equal({ type: 'trigger', key: 'new_item' });
      expect(result[1]).to.deep.equal({ type: 'create', key: 'create_item' });
      expect(result[2]).to.deep.equal({ type: 'search', key: 'find_item' });
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

    describe('app definition validation', () => {
      const mockAppDefinition = {
        triggers: {
          new_item: { key: 'new_item' },
          updated_item: { key: 'updated_item' },
        },
        creates: {
          create_item: { key: 'create_item' },
        },
        searches: {
          find_item: { key: 'find_item' },
        },
        searchOrCreates: {},
        bulkReads: {},
      };

      it('should validate actions that exist in the app', () => {
        const actions = [
          'trigger/new_item',
          'create/create_item',
          'search/find_item',
        ];
        const result = validateActions(actions, mockAppDefinition);

        expect(result).to.have.length(3);
        expect(result[0]).to.deep.equal({ type: 'trigger', key: 'new_item' });
        expect(result[1]).to.deep.equal({ type: 'create', key: 'create_item' });
        expect(result[2]).to.deep.equal({ type: 'search', key: 'find_item' });
      });

      it('should reject actions that do not exist in the app', () => {
        expect(() =>
          validateActions(['trigger/nonexistent'], mockAppDefinition),
        ).to.throw(
          'Action "trigger/nonexistent" does not exist in the app. Available trigger actions: new_item, updated_item.',
        );
      });

      it('should handle action types with no actions in the app', () => {
        expect(() =>
          validateActions(['bulkRead/nonexistent'], mockAppDefinition),
        ).to.throw(
          'Action "bulkRead/nonexistent" does not exist in the app. No bulkRead actions found in the app.',
        );
      });

      it('should work without app definition (backward compatibility)', () => {
        const actions = ['trigger/any_key', 'create/any_key'];
        const result = validateActions(actions, null);

        expect(result).to.have.length(2);
        expect(result[0]).to.deep.equal({ type: 'trigger', key: 'any_key' });
        expect(result[1]).to.deep.equal({ type: 'create', key: 'any_key' });
      });
    });
  });
});
