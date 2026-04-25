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
  eta.loadTemplate(
    "@partial",
    "This is a partial.\n<%~ include('@simple', {name: 'Test Runner'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-merge",
    "This is a partial.\n<%~ include('@simple', {greeting: 'Hello'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-pass-data",
    "This is a partial.\n<%~ include('@simple') %>",
  );

  it("can override value", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello Test Runner");
  });

  it("merges values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-merge", {
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });

  it("passes original values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-pass-data", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });
});

describe("import values merging with varName data", () => {
  const eta = new Eta({
    varName: "data",
    views: path.join(__dirname, "templates"),
  });

  eta.loadTemplate("@simple", "<%= data.greeting ?? 'Hi' %> <%= data.name %>");
  eta.loadTemplate(
    "@partial",
    "This is a partial.\n<%~ include('@simple', {name: 'Test Runner'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-merge",
    "This is a partial.\n<%~ include('@simple', {greeting: 'Hello'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-pass-data",
    "This is a partial.\n<%~ include('@simple') %>",
  );

  it("can override value", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello Test Runner");
  });

  it("merges values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-merge", {
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });

  it("passes original values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-pass-data", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });
});

describe("import values merging with the useWith", () => {
  const eta = new Eta({
    useWith: true,
    views: path.join(__dirname, "templates"),
  });

  eta.loadTemplate(
    "@simple",
    "<%= typeof greeting !== 'undefined' ? greeting : 'Hi' %> <%= name %>",
  );
  eta.loadTemplate(
    "@partial",
    "This is a partial.\n<%~ include('@simple', {name: 'Test Runner'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-merge",
    "This is a partial.\n<%~ include('@simple', {greeting: 'Hello'}) %>\n",
  );
  eta.loadTemplate(
    "@partial-pass-data",
    "This is a partial.\n<%~ include('@simple') %>",
  );

  it("can override value", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello Test Runner");
  });

  it("merges values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-merge", {
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });

  it("passes original values", () => {
    const res = eta.render<SimpleEtaTemplate>("@partial-pass-data", {
      greeting: "Hello",
      name: "friend",
    });

    expect(res).toEqual("This is a partial.\nHello friend");
  });
});

describe("forEach loops in included templates", () => {
  const eta = new Eta();

  it("renders forEach loop inside included partial", () => {
    eta.loadTemplate(
      "@loop-partial",
      `<ul>
<% (it.items || []).forEach(item => { %>
<li><%= item %></li>
<% }) %>
</ul>`,
    );

    eta.loadTemplate(
      "@loop-main",
      `<%~ include('@loop-partial', {items: ['a', 'b', 'c']}) %>`,
    );

    const result = eta.render("@loop-main", {});

    expect(result).toContain("<li>a</li>");
    expect(result).toContain("<li>b</li>");
    expect(result).toContain("<li>c</li>");
  });

  it("renders includes called from within a forEach loop", () => {
    eta.loadTemplate(
      "@nested-partial",
      `<div>
<% (it.question.items || []).forEach(opt => { %>
<span><%= opt %></span>
<% }) %>
</div>`,
    );

    eta.loadTemplate(
      "@nested-main",
      `<% [{items: ['a', 'b']}, {items: ['c', 'd']}].forEach(q => { %>
<%~ include('@nested-partial', {question: q}) %>
<% }) %>`,
    );

    const result = eta.render("@nested-main", {});

    expect(result).toContain("<span>a</span>");
    expect(result).toContain("<span>b</span>");
    expect(result).toContain("<span>c</span>");
    expect(result).toContain("<span>d</span>");
  });
});

describe("block", () => {
  const eta = new Eta();

  it("child overrides layout default", () => {
    eta.loadTemplate(
      "@block-layout",
      `<head><%~ block('styles', () => { %><link href="default.css"><% }) %></head><%~ it.body %>`,
    );

    const res = eta.renderString(
      `<% layout("@block-layout") %><p>Body</p><% block('styles', () => { %><link href="page.css"><% }) %>`,
      {},
    );

    expect(res).toEqual('<head><link href="page.css"></head><p>Body</p>');
  });

  it("block with default content when no override", () => {
    eta.loadTemplate(
      "@block-default",
      `<head><%~ block('styles', () => { %><link href="default.css"><% }) %></head><%~ it.body %>`,
    );

    const res = eta.renderString(
      `<% layout("@block-default") %><p>Body</p>`,
      {},
    );

    expect(res).toEqual('<head><link href="default.css"></head><p>Body</p>');
  });

  it("empty block with no default and no override", () => {
    eta.loadTemplate("@block-empty", `[<%~ block('sidebar') %>]<%~ it.body %>`);

    const res = eta.renderString(`<% layout("@block-empty") %>main`, {});

    expect(res).toEqual("[]main");
  });

  it("multiple blocks in one layout", () => {
    eta.loadTemplate(
      "@block-multi",
      `<head><%~ block('styles') %></head><footer><%~ block('scripts') %></footer><%~ it.body %>`,
    );

    const res = eta.renderString(
      `<% layout("@block-multi") %>body<% block('styles', () => { %>S<% }) %><% block('scripts', () => { %>J<% }) %>`,
      {},
    );

    expect(res).toEqual("<head>S</head><footer>J</footer>body");
  });

  it("block accessing outer scope data", () => {
    eta.loadTemplate("@block-data", `<%~ block('title') %>|<%~ it.body %>`);

    const res = eta.renderString(
      `<% layout("@block-data") %>body<% block('title', () => { %><%= it.name %><% }) %>`,
      { name: "Ada" },
    );

    expect(res).toEqual("Ada|body");
  });

  it("block doesn't leak into it.body", () => {
    eta.loadTemplate(
      "@block-noleak",
      `[<%~ block('extra') %>][<%~ it.body %>]`,
    );

    const res = eta.renderString(
      `<% layout("@block-noleak") %>body<% block('extra', () => { %>X<% }) %>`,
      {},
    );

    expect(res).toEqual("[X][body]");
  });

  it("blockAsync with async content", async () => {
    eta.loadTemplate(
      "@block-async-layout",
      `<%~ await blockAsync('content') %>|<%~ it.body %>`,
      { async: true },
    );

    const res = await eta.renderStringAsync(
      `<% layout("@block-async-layout") %>body<% await blockAsync('content', async () => { %><%= await it.getData() %><% }) %>`,
      { getData: () => Promise.resolve("async-val") },
    );

    expect(res).toEqual("async-val|body");
  });
});

describe("customTags", () => {
  it("basic custom tag renders output", () => {
    const eta = new Eta({
      customTags: {
        "*": (content, data) =>
          (data as Record<string, string>)[content.trim()],
      },
    });

    const res = eta.renderString("Hello <%* name %>!", { name: "World" });
    expect(res).toEqual("Hello World!");
  });

  it("comment tag that outputs nothing", () => {
    const eta = new Eta({
      customTags: { "#": () => "" },
    });

    const res = eta.renderString("A<%# this is a comment %>B", {});
    expect(res).toEqual("AB");
  });

  it("multiple custom tags in one template", () => {
    const translations: Record<string, Record<string, string>> = {
      en: { greeting: "Hello" },
    };

    const eta = new Eta({
      customTags: {
        "#": () => "",
        "*": (key, data) =>
          translations[(data as { lang: string }).lang][key.trim()],
      },
    });

    const res = eta.renderString("<%# comment %><p><%* greeting %></p>", {
      lang: "en",
    });
    expect(res).toEqual("<p>Hello</p>");
  });

  it("throws on conflicting custom tag prefix", () => {
    expect(() => new Eta({ customTags: { "=": () => "" } })).toThrow(
      /conflicts with a built-in prefix/,
    );
    expect(() => new Eta({ customTags: { "-": () => "" } })).toThrow(
      /conflicts with a built-in prefix/,
    );
  });

  it("works alongside built-in tags", () => {
    const eta = new Eta({
      customTags: { "*": (content) => content.trim().toUpperCase() },
    });

    const res = eta.renderString("<%= it.a %>|<%* hello %>|<%~ it.b %>", {
      a: "A",
      b: "<B>",
    });
    expect(res).toEqual("A|HELLO|<B>");
  });
});

describe("capture", () => {
  const eta = new Eta();

  it("captures inline HTML and passes it to an included template", () => {
    eta.loadTemplate("@wrapper", `<div id="wrapper"><%~ it.content %></div>`);

    const res = eta.renderString(
      `<%~ include("@wrapper", {content: capture(() => { %><h1>Hello</h1><% })}) %>`,
      {},
    );

    expect(res).toEqual('<div id="wrapper"><h1>Hello</h1></div>');
  });

  it("captures content that uses data from the outer scope", () => {
    eta.loadTemplate("@card", `<div class="card"><%~ it.body %></div>`);

    const res = eta.renderString(
      `<%~ include("@card", {body: capture(() => { %><p><%= it.name %></p><% })}) %>`,
      { name: "Ada" },
    );

    expect(res).toEqual('<div class="card"><p>Ada</p></div>');
  });

  it("does not pollute the outer template's output", () => {
    eta.loadTemplate("@slot", `[<%~ it.slot %>]`);

    const res = eta.renderString(
      `before|<%~ include("@slot", {slot: capture(() => { %>inner<% })}) %>|after`,
      {},
    );

    expect(res).toEqual("before|[inner]|after");
  });

  it("works with nested captures", () => {
    eta.loadTemplate("@outer", `<outer><%~ it.content %></outer>`);
    eta.loadTemplate("@inner", `<inner><%~ it.content %></inner>`);

    const res = eta.renderString(
      `<%~ include("@outer", {content: capture(() => { %><%~ include("@inner", {content: capture(() => { %>deep<% })}) %><% })}) %>`,
      {},
    );

    expect(res).toEqual("<outer><inner>deep</inner></outer>");
  });

  it("works with loops inside capture", () => {
    eta.loadTemplate("@list", `<ul><%~ it.items %></ul>`);

    const res = eta.renderString(
      `<%~ include("@list", {items: capture(() => { %><% ['a','b','c'].forEach(x => { %><li><%= x %></li><% }) %><% })}) %>`,
      {},
    );

    expect(res).toEqual("<ul><li>a</li><li>b</li><li>c</li></ul>");
  });

  it("works with async rendering", async () => {
    eta.loadTemplate("@async-wrapper", `<div><%~ it.content %></div>`);

    const res = await eta.renderStringAsync(
      `<%~ include("@async-wrapper", {content: capture(() => { %><p>async content</p><% })}) %>`,
      {},
    );

    expect(res).toEqual("<div><p>async content</p></div>");
  });

  it("capture returns a string that can be stored in a variable", () => {
    const res = eta.renderString(
      `<% const heading = capture(() => { %><h1>Title</h1><% }) %>The heading is: <%~ heading %>`,
      {},
    );

    expect(res).toEqual("The heading is: <h1>Title</h1>");
  });

  it("restores output buffer when capture callback throws", () => {
    expect(() => {
      eta.renderString(
        `before<% capture(() => { throw new Error("fail") }) %>after`,
        {},
      );
    }).toThrow("fail");

    // Verify the Eta instance still works correctly after the error
    const res = eta.renderString("still works: <%= it.x %>", { x: "yes" });
    expect(res).toEqual("still works: yes");
  });

  it("captureAsync works with async content", async () => {
    eta.loadTemplate("@async-slot", `<section><%~ it.content %></section>`);

    const res = await eta.renderStringAsync(
      `<%~ include("@async-slot", {content: await captureAsync(async () => { %><p><%= await it.getData() %></p><% })}) %>`,
      { getData: () => Promise.resolve("async value") },
    );

    expect(res).toEqual("<section><p>async value</p></section>");
  });

  it("captureAsync does not pollute outer output", async () => {
    const res = await eta.renderStringAsync(
      `A|<% const x = await captureAsync(async () => { %><%= await it.val() %><% }) %>B|<%~ x %>`,
      { val: () => Promise.resolve("captured") },
    );

    expect(res).toEqual("A|B|captured");
  });

  it("captureAsync restores buffer on async error", async () => {
    await expect(async () => {
      await eta.renderStringAsync(
        `before<% await captureAsync(async () => { throw new Error("async fail") }) %>`,
        {},
      );
    }).rejects.toThrow("async fail");

    const res = eta.renderString("still works", {});
    expect(res).toEqual("still works");
  });
});
