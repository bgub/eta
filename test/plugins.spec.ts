import { describe, expect, it } from "vitest";

import type { EtaConfig } from "../src/config";
import { Eta } from "../src/index";
import type { AstObject } from "../src/parse";

function myPlugin() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    processAST: (ast: Array<AstObject>, _env?: EtaConfig) => {
      ast.push("String to append");
      return ast;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    processFnString: (str: string, _env?: EtaConfig) => {
      return str.replace(/@@num@@/, "2352.3");
    },
  };
}

const emojiTransform = () => {
  return {
    processTemplate: (str: string) => str.replace(":thumbsup:", "👍"),
  };
};

const capitalizeCool = () => {
  return {
    processTemplate: (str: string) => str.replace("cool", "COOL"),
  };
};

const replaceThumbsUp = () => {
  return {
    processTemplate: (str: string) => str.replace("👍", "✨"),
  };
};

describe("Plugins", () => {
  it("Plugins function properly", () => {
    const eta = new Eta({ plugins: [myPlugin()] });
    const template = `<%= it.val %> <%= @@num@@ %>.`;

    expect(eta.renderString(template, { val: "value" })).toEqual(
      "value 2352.3.String to append",
    );
  });
});

describe("processTemplate plugin", () => {
  it("Simple plugin works correctly", () => {
    const eta = new Eta({ plugins: [emojiTransform()] });
    const template = ":thumbsup:";

    const res = eta.renderString(template, {});

    expect(res).toEqual("👍");
  });

  it("Multiple chained plugins work correctly", () => {
    const eta = new Eta({
      plugins: [emojiTransform(), capitalizeCool(), replaceThumbsUp()],
    });
    const template = ":thumbsup: This is a cool template";

    const res = eta.renderString(template, {});

    expect(res).toEqual("✨ This is a COOL template");
  });
});
