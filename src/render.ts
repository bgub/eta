import type { TemplateFunction } from "./compile.ts";

/* TYPES */
import type { Options } from "./config.ts";
import { EtaNameResolutionError } from "./err.ts";
import type { Eta } from "./internal.ts";

/* END TYPES */

function handleCache(
  this: Eta,
  template: string,
  options: Partial<Options>,
): TemplateFunction {
  const templateStore = options?.async
    ? this.templatesAsync
    : this.templatesSync;

  if (this.resolvePath && this.readFile && !template.startsWith("@")) {
    const templatePath = options.filepath as string;

    const cachedTemplate = templateStore.get(templatePath);

    if (this.config.cache && cachedTemplate) {
      return cachedTemplate;
    } else {
      const templateString = this.readFile(templatePath);

      const templateFn = this.compile(templateString, options);

      if (this.config.cache) templateStore.define(templatePath, templateFn);

      return templateFn;
    }
  } else {
    const cachedTemplate = templateStore.get(template);

    if (cachedTemplate) {
      return cachedTemplate;
    } else {
      throw new EtaNameResolutionError(`Failed to get template '${template}'`);
    }
  }
}

export function render<T extends object>(
  this: Eta,
  template: string | TemplateFunction, // template name or template function
  data: T,
  meta?: { filepath: string },
): string {
  let templateFn: TemplateFunction;
  const options = { ...meta, async: false };

  if (typeof template === "string") {
    if (this.resolvePath && this.readFile && !template.startsWith("@")) {
      options.filepath = this.resolvePath(template, options);
    }

    templateFn = handleCache.call(this, template, options);
  } else {
    templateFn = template;
  }

  const res = templateFn.call(this, data, options);

  return res;
}

export function renderAsync<T extends object>(
  this: Eta,
  template: string | TemplateFunction, // template name or template function
  data: T,
  meta?: { filepath: string },
): Promise<string> {
  let templateFn: TemplateFunction;
  const options = { ...meta, async: true };

  if (typeof template === "string") {
    if (this.resolvePath && this.readFile && !template.startsWith("@")) {
      options.filepath = this.resolvePath(template, options);
    }

    templateFn = handleCache.call(this, template, options);
  } else {
    templateFn = template;
  }

  const res = templateFn.call(this, data, options);

  // Return a promise
  return Promise.resolve(res);
}

export function renderString<T extends object>(
  this: Eta,
  template: string,
  data: T,
): string {
  const templateFn = this.compile(template, { async: false });

  return render.call(this, templateFn, data);
}

export function renderStringAsync<T extends object>(
  this: Eta,
  template: string,
  data: T,
): Promise<string> {
  const templateFn = this.compile(template, { async: true });

  return renderAsync.call(this, templateFn, data);
}
