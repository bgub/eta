import * as fs from "node:fs";
import * as path from "node:path";

import type { Options } from "./config.ts";
import { EtaFileResolutionError } from "./err.ts";
import type { Eta as EtaCore } from "./internal.ts";

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
  let isInViewDirectory = false;

  const views = Array.isArray(this.config.views) ? this.config.views : !this.config.views ? [] : [this.config.views];

  if (!views || views.length === 0) {
    throw new EtaFileResolutionError("Views directory is not defined");
  }

  const baseFilePath = options?.filepath;
  const defaultExtension =
    this.config.defaultExtension === undefined
      ? ".eta"
      : this.config.defaultExtension;

  let resolvedPath: string | null = null;

  for (const [index, view] of views.entries()) {
    // how we index cached template paths
    const cacheIndex = JSON.stringify({
      filename: baseFilePath, // filename of the template which called includeFile()
      path: templatePath,
      views: view,
    });

    templatePath += path.extname(templatePath) ? "" : defaultExtension;

    // if the file was included from another template
    if (baseFilePath) {
      // check the cache

      if (this.config.cacheFilepaths && this.filepathCache[cacheIndex]) {
        resolvedPath = this.filepathCache[cacheIndex];
        break;
      }

      const absolutePathTest = absolutePathRegExp.exec(templatePath);

      if (absolutePathTest?.length) {
        const formattedPath = templatePath.replace(/^\/*|^\\*/, "");
        resolvedFilePath = path.join(view, formattedPath);
      } else {
        // resolve relative path and remap to current views dir
        const containingBase = views.find((view) => {
          return baseFilePath.startsWith(view);
        });
        const baseFileFolderPath = path.dirname(baseFilePath);
        resolvedFilePath = path.join(view, path.join(baseFileFolderPath, templatePath).replace(containingBase ?? "", ""));
      }
    } else {
      resolvedFilePath = path.join(view, templatePath);

      // check for dynamicly loaded templates
      const templates = options?.async
        ? this.templatesAsync
        : this.templatesSync;
        
      if(templates.get(resolvedFilePath)) {
        resolvedPath = resolvedFilePath;
        isInViewDirectory = true;
        break;
      }
    }

    isInViewDirectory = dirIsChild(view, resolvedFilePath);
    resolvedPath = resolvedFilePath;

    if (isInViewDirectory && fileExists(resolvedFilePath)) {
      // add resolved path to the cache
      if (baseFilePath && this.config.cacheFilepaths) {
        this.filepathCache[cacheIndex] = resolvedFilePath;
      }
      break;
    }
  }
  
  if(!isInViewDirectory) {
    throw new EtaFileResolutionError(
      `Template '${templatePath}' is not in the views directory`,
    );
  }
  return resolvedPath!;
}

function fileExists(path: string) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function dirIsChild(parent: string, dir: string): boolean {
  const relative = path.relative(parent, dir);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const absolutePathRegExp = /^\\|^\//;
