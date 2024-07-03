import { format as prettify, type Options as PrettierOptions } from 'prettier';

const DEFAULT_OPTIONS: PrettierOptions = {
  bracketSpacing: true,
  trailingComma: 'all',
  singleQuote: false,
  printWidth: 80,
  semi: true,
  tabWidth: 2,
  useTabs: false,
  proseWrap: 'always',
};

/** Format a Typescript module with Prettier. */
export const format = async (ts: string): Promise<string> =>
  prettify(ts, { parser: 'typescript', ...DEFAULT_OPTIONS });
