// Type definitions for zapier-platform-core
// Project: Zapier's Platform Core
// Definitions by: David Brownman <https://davidbrownman.com>

/// <reference types="node" />

import { Agent } from 'http';

// The EXPORTED OBJECT
export const version: string;
export const tools: { env: { inject: (filename?: string) => void } };
export const createAppTester: (
  appRaw: object
) => (
  func: (z: zObject, bundle: Bundle) => any,
  bundle?: Partial<Bundle> // partial so we don't have to make a full bundle in tests
) => Promise<any>;

// internal only
// export const integrationTestHandler: () => any;
// export const createAppHandler: (appRaw: object) => any

type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface Bundle {
  authData: { [x: string]: string };
  inputData: { [x: string]: string };
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
    method: HTTPMethod;
    querystring: string;
    headers: { [x: string]: string };
    content: string;
  }>;
  cleanedRequest?: Partial<{
    method: HTTPMethod;
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
  method?: HTTPMethod;
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

interface BaseHTTPResponse {
  status: number;
  headers: { [key: string]: string };
  getHeader(key: string): string | undefined;
  throwForStatus(): void;
  request: HttpRequestOptions;
}

export interface HTTPResponse extends BaseHTTPResponse {
  content: string;
  json?: object;
}

export interface RawHTTPResponse extends BaseHTTPResponse {
  content: Buffer;
  json: Promise<object | undefined>;
  body: ReadableStream;
}

export interface zObject {
  request: {
    // most specific overloads go first
    (url: string, options: HttpRequestOptions & { raw: true }): Promise<
      RawHTTPResponse
    >;
    (options: HttpRequestOptions & { raw: true; url: string }): Promise<
      RawHTTPResponse
    >;

    (url: string, options?: HttpRequestOptions): Promise<HTTPResponse>;
    (options: HttpRequestOptions & { url: string }): Promise<HTTPResponse>;
  };

  console: Console;

  dehyrate: (
    func: (z: this, bundle: Bundle) => any,
    inputData: object
  ) => string;

  // coming soon
  // cursor: {
  //   get: () => Promise<string>
  //   set: (cursor: string) => Promise<void>
  // }

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
