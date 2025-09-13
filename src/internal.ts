import type { TemplateFunction } from "./compile.ts";
import { compile } from "./compile.ts";
import { compileBody, compileToString } from "./compile-string.ts";
import type { EtaConfig, Options } from "./config.ts";
import { defaultConfig } from "./config.ts";
import { EtaError, RuntimeErr } from "./err.ts";
import { parse } from "./parse.ts";
import {
  render,
  renderAsync,
  renderString,
  renderStringAsync,
} from "./render.ts";
import { Cacher } from "./storage.ts";

export class Eta {
  constructor(customConfig?: Partial<EtaConfig>) {
    if (customConfig) {
      this.config = { ...defaultConfig, ...customConfig };
    } else {
      this.config = { ...defaultConfig };
    }
  }

  config: EtaConfig;

  RuntimeErr = RuntimeErr;

  compile = compile;
  compileToString = compileToString;
  compileBody = compileBody;
  parse = parse;
  render = render;
  renderAsync = renderAsync;
  renderString = renderString;
  renderStringAsync = renderStringAsync;

  filepathCache: Record<string, string> = {};
  templatesSync: Cacher<TemplateFunction> = new Cacher<TemplateFunction>({});
  templatesAsync: Cacher<TemplateFunction> = new Cacher<TemplateFunction>({});

  // resolvePath takes a relative path from the "views" directory
  resolvePath:
    | null
    | ((this: Eta, template: string, options?: Partial<Options>) => string) =
    null;
  readFile: null | ((this: Eta, path: string) => string) = null;

  // METHODS

  configure(customConfig: Partial<EtaConfig>) {
    this.config = { ...this.config, ...customConfig };
  }

  withConfig(customConfig: Partial<EtaConfig>): this & { config: EtaConfig } {
    return { ...this, config: { ...this.config, ...customConfig } };
  }

  loadTemplate(
    name: string,
    template: string | TemplateFunction, // template string or template function
    options?: { async: boolean },
  ): void {
    if (typeof template === "string") {
      const templates = options?.async
        ? this.templatesAsync
        : this.templatesSync;

      templates.define(name, this.compile(template, options));
    } else {
      let templates = this.templatesSync;

      if (template.constructor.name === "AsyncFunction" || options?.async) {
        templates = this.templatesAsync;
      }

      templates.define(name, template);
    }
  }
}

// for instance checking against thrown errors
export { EtaError };
