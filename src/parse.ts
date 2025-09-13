import { ParseErr } from "./err.ts";
import type { Eta } from "./internal.ts";
import { trimWS } from "./utils.ts";

export type TagType = "r" | "e" | "i" | "";

export interface TemplateObject {
  t: TagType;
  val: string;
  lineNo?: number;
}

export type AstObject = string | TemplateObject;

/* END TYPES */

const templateLitReg =
  /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g;

const singleQuoteReg = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g;

const doubleQuoteReg = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g;

/** Escape special regular expression characters inside a string */

function escapeRegExp(string: string) {
  // From MDN
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function getLineNo(str: string, index: number) {
  return str.slice(0, index).split("\n").length;
}

export function parse(this: Eta, str: string): Array<AstObject> {
  const config = this.config;

  let buffer: Array<AstObject> = [];
  let trimLeftOfNextStr: string | false = false;
  let lastIndex = 0;
  const parseOptions = config.parse;

  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.processTemplate) {
        str = plugin.processTemplate(str, config);
      }
    }
  }

  /* Adding for EJS compatibility */
  if (config.rmWhitespace) {
    // Code taken directly from EJS
    // Have to use two separate replaces here as `^` and `$` operators don't
    // work well with `\r` and empty lines don't work well with the `m` flag.
    // Essentially, this replaces the whitespace at the beginning and end of
    // each line and removes multiple newlines.
    str = str.replace(/[\r\n]+/g, "\n").replace(/^\s+|\s+$/gm, "");
  }
  /* End rmWhitespace option */

  templateLitReg.lastIndex = 0;
  singleQuoteReg.lastIndex = 0;
  doubleQuoteReg.lastIndex = 0;

  function pushString(strng: string, shouldTrimRightOfString?: string | false) {
    if (strng) {
      // if string is truthy it must be of type 'string'

      strng = trimWS(
        strng,
        config,
        trimLeftOfNextStr, // this will only be false on the first str, the next ones will be null or undefined
        shouldTrimRightOfString,
      );

      if (strng) {
        // replace \ with \\, ' with \'
        // we're going to convert all CRLF to LF so it doesn't take more than one replace

        strng = strng.replace(/\\|'/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n");

        buffer.push(strng);
      }
    }
  }

  const prefixes = [
    parseOptions.exec,
    parseOptions.interpolate,
    parseOptions.raw,
  ].reduce((accumulator, prefix) => {
    if (accumulator && prefix) {
      return accumulator + "|" + escapeRegExp(prefix);
    } else if (prefix) {
      // accumulator is falsy
      return escapeRegExp(prefix);
    } else {
      // prefix and accumulator are both falsy
      return accumulator;
    }
  }, "");

  const parseOpenReg = new RegExp(
    escapeRegExp(config.tags[0]) + "(-|_)?\\s*(" + prefixes + ")?\\s*",
    "g",
  );

  const parseCloseReg = new RegExp(
    "'|\"|`|\\/\\*|(\\s*(-|_)?" + escapeRegExp(config.tags[1]) + ")",
    "g",
  );

  let m: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: this is performant
  while ((m = parseOpenReg.exec(str))) {
    const precedingString = str.slice(lastIndex, m.index);

    lastIndex = m[0].length + m.index;

    const wsLeft = m[1];
    const prefix = m[2] || ""; // by default either ~, =, or empty

    pushString(precedingString, wsLeft);

    parseCloseReg.lastIndex = lastIndex;
    let closeTag: RegExpExecArray | null;
    let currentObj: AstObject | false = false;

    // biome-ignore lint/suspicious/noAssignInExpressions: this is performant
    while ((closeTag = parseCloseReg.exec(str))) {
      if (closeTag[1]) {
        const content = str.slice(lastIndex, closeTag.index);

        parseOpenReg.lastIndex = lastIndex = parseCloseReg.lastIndex;

        trimLeftOfNextStr = closeTag[2];

        const currentType: TagType =
          prefix === parseOptions.exec
            ? "e"
            : prefix === parseOptions.raw
              ? "r"
              : prefix === parseOptions.interpolate
                ? "i"
                : "";

        currentObj = { t: currentType, val: content };
        break;
      } else {
        const char = closeTag[0];
        if (char === "/*") {
          const commentCloseInd = str.indexOf("*/", parseCloseReg.lastIndex);

          if (commentCloseInd === -1) {
            ParseErr("unclosed comment", str, closeTag.index);
          }
          parseCloseReg.lastIndex = commentCloseInd;
        } else if (char === "'") {
          singleQuoteReg.lastIndex = closeTag.index;

          const singleQuoteMatch = singleQuoteReg.exec(str);
          if (singleQuoteMatch) {
            parseCloseReg.lastIndex = singleQuoteReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        } else if (char === '"') {
          doubleQuoteReg.lastIndex = closeTag.index;
          const doubleQuoteMatch = doubleQuoteReg.exec(str);

          if (doubleQuoteMatch) {
            parseCloseReg.lastIndex = doubleQuoteReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        } else if (char === "`") {
          templateLitReg.lastIndex = closeTag.index;
          const templateLitMatch = templateLitReg.exec(str);
          if (templateLitMatch) {
            parseCloseReg.lastIndex = templateLitReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        }
      }
    }
    if (currentObj) {
      if (config.debug) {
        currentObj.lineNo = getLineNo(str, m.index);
      }
      buffer.push(currentObj);
    } else {
      ParseErr("unclosed tag", str, m.index);
    }
  }

  pushString(str.slice(lastIndex, str.length), false);

  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.processAST) {
        buffer = plugin.processAST(buffer, config);
      }
    }
  }

  return buffer;
}
