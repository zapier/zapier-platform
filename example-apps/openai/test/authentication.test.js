/* globals describe, it, expect */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('custom auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes authentication and returns json', async () => {
    const bundle = {
      authData: {
        api_key: 'secret',
      },
    };

    // Mock successful response
    const mockResponse = {
      status: 200,
      data: {
        email: 'test@example.com'
      }
    };

    // Mock the request client
    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    const z = {
      request: mockRequest
    };

    const response = await App.authentication.test(z, bundle);
    
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({
      url: expect.stringContaining('/me')
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('email', 'test@example.com');
  });

  it('fails on bad auth', async () => {
    const bundle = {
      authData: {
        api_key: 'bad',
      },
    };

    // Mock failed response
    const mockRequest = jest.fn().mockRejectedValue(new Error('Incorrect API key provided'));
    const z = {
      request: mockRequest
    };

    try {
      await App.authentication.test(z, bundle);
    } catch (error) {
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(error.message).toContain('Incorrect API key provided');
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
