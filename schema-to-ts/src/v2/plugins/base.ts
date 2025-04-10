import type { CompilerContext, TopLevelSchema } from '../helpers.ts';

import type { Logger } from 'pino';
import { logger } from '../../utils.ts';

/**
 * A compiler that can be used to compile a top-level schema into a
 * TypeScript type. May also register other schema types that need to be
 * compiled themselves.
 */
export abstract class TopLevelPlugin<$Schema extends TopLevelSchema> {
  protected logger: Logger;
  constructor() {
    this.logger = logger.child({
      compiler: this.constructor.name,
    });
  }

  /**
   * Determine if this compiler should handle the given schema.
   */
  abstract test(schema: TopLevelSchema): schema is $Schema;

  /**
   * Implement this method to compile the schema.
   */
  abstract compile(ctx: CompilerContext, schema: $Schema): void;
}
