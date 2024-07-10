import { format as prettify, type Options as PrettierOptions } from 'prettier';
import { logger } from './utils.js';

const DEFAULT_OPTIONS: PrettierOptions = {
  bracketSpacing: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  semi: true,
  tabWidth: 2,
  useTabs: false,
};

/** Format a Typescript module with Prettier. */
export const format = async (ts: string): Promise<string> => {
  const options = { parser: 'typescript', ...DEFAULT_OPTIONS };
  logger.debug({ options }, 'Finalised prettier options');
  const result = prettify(ts, options);
  return result;
};
