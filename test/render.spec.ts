import path from "node:path";
import { describe, expect, it } from "vitest";

import { Eta } from "../src/index";

interface SimpleEtaTemplate {
  greeting?: string;
  name: string;
}

describe("basic functionality", () => {
  const eta = new Eta();

  it("renderString: template compiles", () => {
    expect(
      eta.renderString("Hi <%= it.name%>", { name: "Ada Lovelace" }),
    ).toEqual("Hi Ada Lovelace");
  });
  it("renderString: string trimming", () => {
    expect(
      eta.renderString("Hi \n<%- =it.name_%>  !", { name: "Ada Lovelace" }),
    ).toEqual("Hi Ada Lovelace!");
  });
  it("render: passing in a template function", () => {
    expect(
      eta.render(eta.compile("Hi \n<%- =it.name_%>  !"), {
        name: "Ada Lovelace",
      }),
    ).toEqual("Hi Ada Lovelace!");
  });
});

describe("render caching", () => {
  const eta = new Eta({ cache: true });

  eta.loadTemplate("@template1", "Hi <%=it.name%>");

  it("Simple template caches", () => {
    expect(eta.render("@template1", { name: "Ada Lovelace" })).toEqual(
      "Hi Ada Lovelace",
    );

    expect(eta.templatesSync.get("@template1")).toBeTruthy();
  });

  it("throws if template doesn't exist", () => {
    expect(() => {
      eta.render("@should-error", {});
    }).toThrow(/Failed to get template/);
  });
});

describe("render caching w/ files", () => {
  const eta = new Eta({
    cache: true,
    views: path.join(__dirname, "templates"),
  });

  eta.loadTemplate(
    path.join(__dirname, "templates/nonexistent.eta"),
    "Hi <%=it.name%>",
  );

  it("Template files cache", () => {
    expect(eta.render("./nonexistent", { name: "Ada Lovelace" })).toEqual(
      "Hi Ada Lovelace",
    );
  });
});

describe("useWith", () => {
  it("Puts `it` in global scope with env.useWith", () => {
    const etaWithUseWith = new Eta({ useWith: true });

    expect(
      etaWithUseWith.renderString("Hi <%=name%>", { name: "Ada Lovelace" }),
    ).toEqual("Hi Ada Lovelace");
  });
});

function resolveAfter2Seconds(val: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(val);
    }, 20);
  });
}

async function asyncTest() {
  const result = await resolveAfter2Seconds("HI FROM ASYNC");
  return result;
}

describe("async", () => {
  const eta = new Eta();

  it("compiles asynchronously", async () => {
    expect(
      await eta.renderStringAsync("Hi <%= it.name %>", {
        name: "Ada Lovelace",
      }),
    ).toEqual("Hi Ada Lovelace");
  });

  it("async function works", async () => {
    expect(
      await eta.renderStringAsync("<%= await it.asyncTest() %>", {
        asyncTest: asyncTest,
      }),
    ).toEqual("HI FROM ASYNC");
  });

  it("Async template w/ syntax error throws", async () => {
    await expect(async () => {
      await eta.renderStringAsync("<%= @#$%^ %>", {});
    }).rejects.toThrow();
  });
});

describe("layouts", () => {
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  it("Nested layouts work as expected", () => {
    const res = eta.render("index.eta", { title: "Cool Title" });

    expect(res).toEqual(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>Cool Title</title>
</head>
<body>
This is the template body.
</body>
</html>`);
  });

  it("Layouts are called with arguments if they're provided", async () => {
    eta.loadTemplate(
      "@my-layout",
      `<%= it.title %> - <%~ it.body %> - <%~ it.content %> - <%~ it.randomNum %>`,
    );

    const res = await eta.renderString(
      `<% layout("@my-layout", { title: 'Nifty title', content: 'Nice content'}) %>
This is a layout`,
      { title: "Cool Title", randomNum: 3 },
    );

    // Note that layouts automatically accept the data of the template which called them,
    // after it is merged with `it` and { body:__eta.res }

    expect(res).toEqual("Nifty title - This is a layout - Nice content - 3");
  });
});

describe("file rendering", () => {
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  it("renders template file properly", () => {
    const res = eta.render<SimpleEtaTemplate>("simple.eta", { name: "friend" });

    expect(res).toEqual("Hi friend");
  });

  it("renders async template file properly", async () => {
    const res = await eta.renderAsync("async.eta", {});

    expect(res).toEqual(`ASYNC CONTENT BELOW!



HI FROM ASYNC`);
  });
});

describe("import values merging", () => {
  const eta = new Eta({ views: path.join(__dirname, "templates") });
  eta.loadTemplate("@simple", "<%= it.greeting ?? 'Hi' %> <%= it.name %>");
  eta.loadTemplate("@partial", "This is a partial.\n<%~ include('@simple', {name: 'Test Runner'}) %>\n");
  eta.loadTemplate("@partial-merge", "This is a partial.\n<%~ include('@simple', {greeting: 'Hello'}) %>\n");
  eta.loadTemplate("@partial-pass-data", "This is a partial.\n<%~ include('@simple') %>");

  it("can override value", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial", { greeting: "Hello", name: "friend" });

    expect(res).toEqual("This is a partial.\nHello Test Runner");
  });

  it("merges values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-merge", { name: "friend" });

    expect(res).toEqual("This is a partial.\nHello friend");
  });

  it("passes original values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-pass-data", { greeting: "Hello", name: "friend" });

    expect(res).toEqual("This is a partial.\nHello friend");
  });
});
