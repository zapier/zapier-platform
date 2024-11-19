// Type definitions for zapier-platform-core
// Project: Zapier's Platform Core
// Definitions by: David Brownman <https://davidbrownman.com>

/// <reference types="node" />
/// <reference types="node-fetch" />

import { Agent } from 'http';
import { Headers } from 'node-fetch';

// The EXPORTED OBJECT
export const version: string;
export const tools: { env: { inject: (filename?: string) => void } };

// see: https://github.com/zapier/zapier-platform-cli/issues/339#issue-336888249
export const createAppTester: (
  appRaw: object,
  options?: { customStoreKey?: string }
) => <T, B extends Bundle>(
  func: (z: ZObject, bundle: B) => T | Promise<T>,
  bundle?: Partial<B>, // partial so we don't have to make a full bundle in tests
  clearZcacheBeforeUse?: boolean
) => Promise<T>; // appTester always returns a promise

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
    isBulkRead: boolean;
    isFillingDynamicDropdown: boolean;
    isLoadingSample: boolean;
    isPopulatingDedupe: boolean;
    isTestingAuth: boolean;
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
  cleanedRequest?:
    | Partial<{
        method: HttpMethod;
        querystring: { [x: string]: string };
        headers: { [x: string]: string };
        content: { [x: string]: string };
      }>
    | any;
  outputData?: object;
  subscribeData?: { id: string };
  targetUrl?: string;
}

declare class AppError extends Error {
  constructor(message: string, code?: string, status?: number);
}
declare class HaltedError extends Error {}
declare class ExpiredAuthError extends Error {}
declare class RefreshAuthError extends Error {}
declare class ThrottledError extends Error {
  constructor(message: string, delay?: number);
}
declare class ResponseError extends Error {
  constructor(response: HttpResponse);
}

// copied http stuff from external typings
export interface HttpRequestOptions {
  agent?: Agent;
  body?: string | Buffer | NodeJS.ReadableStream | Record<string, any>;
  compress?: boolean;
  follow?: number;
  form?: any;
  headers?: { [name: string]: string };
  json?: any;
  method?: HttpMethod;
  params?: Record<string, any>;
  raw?: boolean;
  redirect?: 'manual' | 'error' | 'follow';
  removeMissingValuesFrom?: {
    params?: boolean;
    body?: boolean;
  };
  size?: number;
  timeout?: number;
  url?: string;
  skipThrowForStatus?: boolean;

  /**
   * This is a special field that can be used to pass data to
   * middleware. It is not sent with the request, but is available in
   * the `response` object that middleware receives. This is useful for
   * things like `prefixErrorMessage` fields etc.
   */
  middlewareData?: Record<string, any>;
}

interface BaseHttpResponse {
  status: number;
  headers: Headers;
  getHeader(key: string): string | undefined;
  throwForStatus(): void;
  skipThrowForStatus: boolean;
  request: HttpRequestOptions;
}

export interface HttpResponse<T = any> extends BaseHttpResponse {
  content: string;
  data: T;
  /** @deprecated Since v10.0.0. Use `data` instead. */
  json?: T;
}

export interface RawHttpResponse<T = any> extends BaseHttpResponse {
  body: NodeJS.ReadableStream;
  buffer(): Promise<Buffer>;
  json(): Promise<T>;
  text(): Promise<string>;
}

type DehydrateFunc = <T>(
  func: (z: ZObject, bundle: Bundle<T>) => any,
  inputData?: T,
  cacheExpiration?: number,
) => string;

export interface ZObject {
  request: {
    // most specific overloads go first
    <T = any>(
      url: string,
      options: HttpRequestOptions & { raw: true }
    ): Promise<RawHttpResponse<T>>;
    <T = any>(
      options: HttpRequestOptions & { raw: true; url: string }
    ): Promise<RawHttpResponse<T>>;

    <T = any>(url: string, options?: HttpRequestOptions): Promise<
      HttpResponse<T>
    >;
    <T = any>(options: HttpRequestOptions & { url: string }): Promise<
      HttpResponse<T>
    >;
  };

  console: Console;

  dehydrate: DehydrateFunc;
  dehydrateFile: DehydrateFunc;

  cursor: {
    get: () => Promise<string>;
    set: (cursor: string) => Promise<null>;
  };
  generateCallbackUrl: () => string;

  /**
   * turns a file or request into a file into a publicly accessible url
   */
  stashFile: {
    (
      input: string | Buffer | NodeJS.ReadableStream,
      knownLength?: number,
      filename?: string,
      contentType?: string
    ): string;
    (input: Promise<RawHttpResponse>): string;
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
    Error: typeof AppError;
    HaltedError: typeof HaltedError;
    ExpiredAuthError: typeof ExpiredAuthError;
    RefreshAuthError: typeof RefreshAuthError;
    ThrottledError: typeof ThrottledError;
    ResponseError: typeof ResponseError;
  };

  cache: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
}

/**
 * A function that performs the action.
 *
 * @template BI The shape of data in the `bundle.inputData` object.
 * @template R The return type of the function.
 */
export type PerformFunction<BI = Record<string, any>, R = any> = (
  z: ZObject,
  bundle: Bundle<BI>
) => Promise<R>;

export type BeforeRequestMiddleware = (
  request: HttpRequestOptions,
  z: ZObject,
  bundle: Bundle
) => HttpRequestOptions | Promise<HttpRequestOptions>;

export type AfterResponseMiddleware = (
  response: HttpResponse,
  z: ZObject,
  bundle: Bundle
) => HttpResponse | Promise<HttpResponse>;

export interface BufferedItem<InputData = { [x: string]: any }> {
  inputData: InputData;
  meta: {
    id: string;
    [x: string]: any;
  };
}

export interface BufferedBundle<InputData = { [x: string]: any }> {
  authData: { [x: string]: string };
  buffer: BufferedItem<InputData>[];
  groupedBy: { [x: string]: string };
}

interface PerformBufferSuccessItem {
  outputData: { [x: string]: any };
  error?: string;
}

interface PerformBufferErrorItem {
  outputData?: { [x: string]: any };
  error: string;
}

export type PerformBufferResultItem =
  | PerformBufferSuccessItem
  | PerformBufferErrorItem;

export interface PerformBufferResult {
  [id: string]: PerformBufferResultItem;
}

export const performBuffer: (
  z: ZObject,
  bundle: BufferedBundle
) => Promise<PerformBufferResult>;
