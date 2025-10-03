import type { AstObject } from "./parse.ts";
import { XMLEscape } from "./utils.ts";

type trimConfig = "nl" | "slurp" | false;

export interface Options {
  /** Compile to async function */
  async?: boolean;

  /** Absolute path to template file */
  filepath?: string;
}

export interface EtaConfig {
  /** Whether or not to automatically XML-escape interpolations. Default true */
  autoEscape: boolean;

  /** Apply a filter function defined on the class to every interpolation or raw interpolation */
  autoFilter: boolean;

  /** Configure automatic whitespace trimming. Default `[false, 'nl']` */
  autoTrim: trimConfig | [trimConfig, trimConfig];

  /** Whether or not to cache templates if `name` or `filename` is passed */
  cache: boolean;

  /** Holds cache of resolved filepaths. Set to `false` to disable. */
  cacheFilepaths: boolean;

  /** Whether to pretty-format error messages (introduces runtime penalties) */
  debug: boolean;

  /** Function to XML-sanitize interpolations */
  escapeFunction: (str: unknown) => string;

  /** Function applied to all interpolations when autoFilter is true */
  filterFunction: (val: unknown) => string;

  /** Name of the function that can be used in template code to output text to the result (like EJS's `outputFunctionName`). */
  outputFunctionName: string;

  /** Raw JS code inserted in the template function. Useful for declaring global variables for user templates */
  functionHeader: string;

  /** Parsing options */
  parse: {
    /** Which prefix to use for evaluation. Default `""`, does not support `"-"` or `"_"` */
    exec: string;

    /** Which prefix to use for interpolation. Default `"="`, does not support `"-"` or `"_"` */
    interpolate: string;

    /** Which prefix to use for raw interpolation. Default `"~"`, does not support `"-"` or `"_"` */
    raw: string;
  };

  /** Array of plugins */
  plugins: Array<{
    processFnString?: (fnString: string, env?: EtaConfig) => string;
    processAST?: (ast: AstObject[], env?: EtaConfig) => AstObject[];
    processTemplate?: (fnString: string, env?: EtaConfig) => string;
  }>;

  /** Remove all safe-to-remove whitespace */
  rmWhitespace: boolean;

  /** Delimiters: by default `['<%', '%>']` */
  tags: [string, string];

  /** Make data available on the global object instead of varName */
  useWith: boolean;

  /** Name of the data object. Default `it` */
  varName: string;

  /** Directory that contains templates */
  views?: string;

  /** Control template file extension defaults. Default `.eta` */
  defaultExtension?: string;
}

/* END TYPES */

/** Eta's base (global) configuration */
const defaultConfig: EtaConfig = {
  autoEscape: true,
  autoFilter: false,
  autoTrim: [false, "nl"],
  cache: false,
  cacheFilepaths: true,
  debug: false,
  escapeFunction: XMLEscape,
  // default filter function (not used unless enables) just stringifies the input
  filterFunction: (val) => String(val),
  outputFunctionName: 'output',
  functionHeader: "",
  parse: {
    exec: "",
    interpolate: "=",
    raw: "~",
  },
  plugins: [],
  rmWhitespace: false,
  tags: ["<%", "%>"],
  useWith: false,
  varName: "it",
  defaultExtension: ".eta",
};

export { defaultConfig };
