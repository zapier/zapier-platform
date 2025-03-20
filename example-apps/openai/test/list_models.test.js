/* globals describe, it, expect */
/* eslint-disable no-undef */

const listModels = require('../dynamic_dropdowns/list_models');

describe('list_models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns formatted list of models', async () => {
    const mockResponse = {
      data: {
        data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }],
      },
    };

    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    const z = { request: mockRequest };
    const bundle = {};

    const results = await listModels.operation.perform(z, bundle);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({
      url: expect.stringContaining('/models'),
    });

    expect(results).toEqual([
      { id: 'gpt-4', name: 'gpt-4' },
      { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' },
    ]);
  });

  it('handles API errors', async () => {
    const mockRequest = jest
      .fn()
      .mockRejectedValue(new Error('Failed to fetch models'));
    const z = { request: mockRequest };
    const bundle = {};

    try {
      await listModels.operation.perform(z, bundle);
    } catch (error) {
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(error.message).toContain('Failed to fetch models');
      return;
    }
    throw new Error('Should have thrown an error');
  });
});
