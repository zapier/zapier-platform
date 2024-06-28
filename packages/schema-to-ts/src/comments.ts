import wrap from "word-wrap";

import { Token, lexer, type TokensList } from "marked";
import type { Tokens } from "marked";

const SINGLE_LINE_CONTENT_WIDTH = 60;
const MULTILINE_DEFAULT_CONTENT_WIDTH = 65;

export const commentToTsDocString = (comment: string): string => {
  const stripped = comment?.trim();
  if (!stripped) return "";

  const tokens = lexer(stripped);
  const lines = reflowLines(tokens);
  if (lines.length === 1 && lines[0].length < SINGLE_LINE_CONTENT_WIDTH) {
    return `/** ${stripped} */\n`;
  }
  const docsLines = lines.map((line) => ` * ${line}`).join("\n");
  return `/**\n${docsLines}\n */\n`;
};

export const reflowLines = (
  tokens: TokensList,
  { width = MULTILINE_DEFAULT_CONTENT_WIDTH } = {},
): string[] => {
  return tokens.flatMap((t) => reflowToken(t, width));
};

const reflowToken = (token: Token, width: number): string[] => {
  if (isSolitaryLink(token)) {
    const link = token.tokens[0];
    const docLink = `[${link.text}](${link.href})`;
    return [docLink];
  }
  return wrap(token.raw, { width, indent: "", trim: true }).split(/\n/);
};

const isSolitaryLink = (
  token: Token,
): token is Tokens.Paragraph & { tokens: [Tokens.Link] } =>
  token.type === "paragraph" &&
  token.tokens?.length === 1 &&
  token.tokens[0].type === "link";
