import * as fs from "node:fs";
import * as path from "node:path";

import type { Options } from "./config.ts";
import type { Eta as EtaCore } from "./internal.ts";
import { EtaFileResolutionError } from "./err.ts";

export function readFile(this: EtaCore, path: string): string {
  let res = "";

  try {
    res = fs.readFileSync(path, "utf8");
    // biome-ignore lint/suspicious/noExplicitAny: it's an error
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      throw new EtaFileResolutionError(`Could not find template: ${path}`);
    } else {
      throw err;
    }
  }

  return res;
}

export function resolvePath(
  this: EtaCore,
  templatePath: string,
  options?: Partial<Options>,
): string {
  let resolvedFilePath = "";

  const views = this.config.views;

  if (!views) {
    throw new EtaFileResolutionError("Views directory is not defined");
  }

  const baseFilePath = options?.filepath;
  const defaultExtension =
    this.config.defaultExtension === undefined
      ? ".eta"
      : this.config.defaultExtension;

  // how we index cached template paths
  const cacheIndex = JSON.stringify({
    filename: baseFilePath, // filename of the template which called includeFile()
    path: templatePath,
    views: this.config.views,
  });

  templatePath += path.extname(templatePath) ? "" : defaultExtension;

  // if the file was included from another template
  if (baseFilePath) {
    // check the cache

    if (this.config.cacheFilepaths && this.filepathCache[cacheIndex]) {
      return this.filepathCache[cacheIndex];
    }

    const absolutePathTest = absolutePathRegExp.exec(templatePath);

    if (absolutePathTest?.length) {
      const formattedPath = templatePath.replace(/^\/*|^\\*/, "");
      resolvedFilePath = path.join(views, formattedPath);
    } else {
      resolvedFilePath = path.join(path.dirname(baseFilePath), templatePath);
    }
  } else {
    resolvedFilePath = path.join(views, templatePath);
  }

  if (dirIsChild(views, resolvedFilePath)) {
    // add resolved path to the cache
    if (baseFilePath && this.config.cacheFilepaths) {
      this.filepathCache[cacheIndex] = resolvedFilePath;
    }

    return resolvedFilePath;
  } else {
    throw new EtaFileResolutionError(
      `Template '${templatePath}' is not in the views directory`,
    );
  }
}

function dirIsChild(parent: string, dir: string) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const absolutePathRegExp = /^\\|^\//;
