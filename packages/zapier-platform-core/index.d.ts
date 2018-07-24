// Type definitions for zapier-platform-core
// Project: Zapier's Platform Core
// Definitions by: David Brownman <https://davidbrownman.com>

/// <reference types="node" />

import { Agent } from 'http';

// The EXPORTED OBJECT
export const version: string;
export const tools: { env: { inject: (filename?: string) => void } };

// see: https://github.com/zapier/zapier-platform-cli/issues/339#issue-336888249
export const createAppTester: (
  appRaw: object
) => <T extends any, B extends Bundle>(
  func: (z: ZObject, bundle: B) => Promise<T>,
  bundle?: Partial<B> // partial so we don't have to make a full bundle in tests
) => T extends Promise<T> ? T : Promise<T>;

// internal only
// export const integrationTestHandler: () => any;
// export const createAppHandler: (appRaw: object) => any

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface Bundle<InputData = { [x: string]: any }> {
  authData: { [x: string]: string };
  inputData: InputData;
  inputDataRaw: { [x: string]: string };
  meta: {
    frontend: boolean;
    prefill: boolean;
    hydrate: boolean;
    test_poll: boolean;
    standard_poll: boolean;
    first_poll: boolean;
    limit: number;
    page: number;
    zap?: { id: string };
  };
  rawRequest?: Partial<{
    method: HttpMethod;
    querystring: string;
    headers: { [x: string]: string };
    content: string;
  }>;
  cleanedRequest?: Partial<{
    method: HttpMethod;
    querystring: { [x: string]: string };
    headers: { [x: string]: string };
    content: { [x: string]: string };
  }>;
}

declare class HaltedError extends Error {}
declare class ExpiredAuthError extends Error {}
declare class RefreshAuthError extends Error {}

// copied http stuff from external typings
export interface HttpRequestOptions {
  url?: string;
  method?: HttpMethod;
  body?: string | Buffer | ReadableStream | object;
  headers?: { [name: string]: string };
  json?: object | any[];
  params?: object;
  form?: object;
  raw?: boolean;
  redirect?: 'manual' | 'error' | 'follow';
  follow?: number;
  compress?: boolean;
  agent?: Agent;
  timeout?: number;
  size?: number;
}

interface BaseHttpResponse {
  status: number;
  headers: { [key: string]: string };
  getHeader(key: string): string | undefined;
  throwForStatus(): void;
  request: HttpRequestOptions;
}

export interface HttpResponse extends BaseHttpResponse {
  content: string;
  json?: object;
}

export interface RawHttpResponse extends BaseHttpResponse {
  content: Buffer;
  json: Promise<object | undefined>;
  body: ReadableStream;
}

export interface ZObject {
  request: {
    // most specific overloads go first
    (url: string, options: HttpRequestOptions & { raw: true }): Promise<
      RawHttpResponse
    >;
    (options: HttpRequestOptions & { raw: true; url: string }): Promise<
      RawHttpResponse
    >;

    (url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
    (options: HttpRequestOptions & { url: string }): Promise<HttpResponse>;
  };

  console: Console;

  dehydrate: <T>(
    func: (z: this, bundle: Bundle<T>) => any,
    inputData: object
  ) => string;

  cursor: {
    get: () => Promise<string>;
    set: (cursor: string) => Promise<null>;
  };

  /**
   * turns a file or request into a file into a publicly accessible url
   */
  stashFile: {
    (
      input: string | Buffer | ReadableStream,
      knownLength?: number,
      filename?: string,
      contentType?: string
    ): string;
    (input: Promise<string>): string;
  };

  JSON: {
    /**
     * Acts a lot like regular `JSON.parse`, but throws a nice error for improper json input
     */
    parse: (text: string) => any;
    stringify: typeof JSON.stringify;
  };

  /**
   * Easily hash data using node's crypto package
   * @param algorithm probably 'sha256', see [this](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for more options
   * @param data the data you want to hash
   * @param encoding defaults to 'hex'
   * @param input_encoding defaults to 'binary'
   */
  hash: (
    algorithm: string,
    data: string,
    encoding?: string,
    input_encoding?: string
  ) => string;

  errors: {
    HaltedError: typeof HaltedError;
    ExpiredAuthError: typeof ExpiredAuthError;
    RefreshAuthError: typeof RefreshAuthError;
  };
}
