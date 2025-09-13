import type { EtaConfig, Options } from "./config.ts";
import { EtaParseError } from "./err.ts";
import type { Eta } from "./internal.ts";

export type TemplateFunction = (
  this: Eta,
  data?: object,
  options?: Partial<Options>,
) => string;
/* END TYPES */

/* istanbul ignore next */
const AsyncFunction = (async () => {}).constructor;

/**
 * Takes a template string and returns a template function that can be called with (data, config)
 *
 * @param str - The template string
 * @param config - A custom configuration object (optional)
 */

export function compile(
  this: Eta,
  str: string,
  options?: Partial<Options>,
): TemplateFunction {
  const config: EtaConfig = this.config;

  /* ASYNC HANDLING */
  // code gratefully taken from https://github.com/mde/ejs and adapted
  const ctor = options?.async
    ? (AsyncFunction as FunctionConstructor)
    : Function;
  /* END ASYNC HANDLING */

  try {
    return new ctor(
      config.varName,
      "options",
      this.compileToString.call(this, str, options),
    ) as TemplateFunction; // eslint-disable-line no-new-func
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new EtaParseError(
        "Bad template syntax\n\n" +
          e.message +
          "\n" +
          Array(e.message.length + 1).join("=") +
          "\n" +
          this.compileToString.call(this, str, options) +
          "\n", // This will put an extra newline before the callstack for extra readability
      );
    } else {
      throw e;
    }
  }
}
