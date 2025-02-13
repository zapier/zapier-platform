/* globals describe, it, expect */

const zapier = require('zapier-platform-core');
const App = require('../index');
const chatCompletion = require('../creates/chat_completion');
const { DEFAULT_MODEL } = require('../constants');

describe('chat_completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a basic chat completion', async () => {
    const bundle = {
      inputData: {
        user_message: 'Hello, how are you?',
        model: DEFAULT_MODEL,
      },
    };

    const mockResponse = {
      data: {
        id: 'chatcmpl-123',
        model: DEFAULT_MODEL,
        usage: {
          prompt_tokens: 20,
          completion_tokens: 15,
          total_tokens: 35,
        },
        choices: [
          {
            message: {
              content: 'I am doing well, thank you for asking!',
            },
          },
        ],
      },
    };

    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    const z = { request: mockRequest };

    const result = await chatCompletion.operation.perform(z, bundle);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({
      url: expect.stringContaining('/chat/completions'),
      method: 'POST',
      body: expect.stringContaining(bundle.inputData.user_message),
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('creates a chat completion with advanced options', async () => {
    const bundle = {
      inputData: {
        user_message: 'Write a story',
        model: DEFAULT_MODEL,
        developer_message: 'You are a creative writer',
        temperature: 0.9,
        max_completion_tokens: 100,
      },
    };

    const mockResponse = {
      data: {
        id: 'chatcmpl-456',
        model: DEFAULT_MODEL,
        usage: {
          prompt_tokens: 25,
          completion_tokens: 50,
          total_tokens: 75,
        },
      },
    };

    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    const z = { request: mockRequest };

    const result = await chatCompletion.operation.perform(z, bundle);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({
      url: expect.stringContaining('/chat/completions'),
      method: 'POST',
      body: expect.stringMatching(/temperature.*0.9/),
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('creates a chat completion with image', async () => {
    const bundle = {
      inputData: {
        user_message: 'Describe this image',
        model: DEFAULT_MODEL,
        files: ['https://example.com/image.jpg'],
      },
    };

    const mockResponse = {
      data: {
        id: 'chatcmpl-789',
        model: DEFAULT_MODEL,
        usage: {
          prompt_tokens: 30,
          completion_tokens: 20,
          total_tokens: 50,
        },
      },
    };

    const mockRequest = jest.fn().mockResolvedValue(mockResponse);
    const z = { request: mockRequest };

    const result = await chatCompletion.operation.perform(z, bundle);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({
      url: expect.stringContaining('/chat/completions'),
      method: 'POST',
      body: expect.stringMatching(/image_url.*example.com/),
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('handles API errors', async () => {
    const bundle = {
      inputData: {
        user_message: 'Hello',
        model: DEFAULT_MODEL,
      },
    };

    const mockRequest = jest.fn().mockRejectedValue(new Error('Invalid request'));
    const z = { request: mockRequest };

    try {
      await chatCompletion.operation.perform(z, bundle);
    } catch (error) {
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(error.message).toContain('Invalid request');
      return;
    }
    throw new Error('Should have thrown an error');
  });
}); 