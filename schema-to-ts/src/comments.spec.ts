import { commentToTsDocString, reflowLines } from './comments.js';
import { describe, expect, it } from 'vitest';

import { lexer } from 'marked';

describe('comments to TsDoc strings', () => {
  it('should handle short single-line docs', () => {
    const expected = '/** hello */\n';
    const actual = commentToTsDocString('hello');
    expect(actual).toBe(expected);
  });

  it.each([
    ['hello', '/** hello */\n'],
    [
      '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789',
      '/**\n * 123456789 123456789 123456789 123456789 123456789 123456789\n * 123456789 123456789 123456789\n */\n',
    ],
  ])('should produce expected outputs', (input, expected) => {
    const actual = commentToTsDocString(input);
    expect(actual).toEqual(expected);
  });
});

describe('reflowing rules', () => {
  it.each([
    ['foobar', ['foobar']],
    ['123456789 123456789 0123456789', ['123456789 123456789', '0123456789']],
  ])('should reflow lines', (input, expected) => {
    const tokens = lexer(input);
    const actual = reflowLines(tokens, { width: 20 });
    expect(actual).toEqual(expected);
  });

  // These are now just markdown to markdown; so should remain
  // unchanged from the schema. Originally used {@link}, but markdown
  // was nicer.
  it('should convert solitary links to TSDoc', () => {
    const input = '[A link](http://some.domain.com)';
    const expected = [`[A link](http://some.domain.com)`];
    const tokens = lexer(input);
    const actual = reflowLines(tokens, { width: 20 });
    expect(actual).toEqual(expected);
  });

  it('should not wrap solitary links', () => {
    const input = '[A link](http://reeeeeaaaallll.loooooong.domain.com)';
    const expected = [`[A link](http://reeeeeaaaallll.loooooong.domain.com)`];
    const tokens = lexer(input);
    const actual = reflowLines(tokens, { width: 20 });
    expect(actual).toEqual(expected);
  });
});
