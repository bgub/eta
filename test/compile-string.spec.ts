import { describe, expect, it } from "vitest";

import { Eta } from "../src/index";

const eta = new Eta();

const fs = require("node:fs"),
  path = require("node:path"),
  filePath = path.join(__dirname, "templates/complex.eta");

const complexTemplate = fs.readFileSync(filePath, "utf8");

describe("Compile to String test", () => {
  it("compiles a simple template", () => {
    const str = eta.compileToString("hi <%= it.name %>");
    expect(str).toEqual(`
let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

__eta.res+='hi '
__eta.res+=__eta.e(it.name)

if (__eta.layout) {
  __eta.res = include (__eta.layout, {...it, body: __eta.res, ...__eta.layoutData});
}

return __eta.res;
`);
  });

  it("compiles a simple template with a raw tag", () => {
    const str = eta.compileToString("hi <%~ it.name %>");
    expect(str).toEqual(`
let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

__eta.res+='hi '
__eta.res+=it.name

if (__eta.layout) {
  __eta.res = include (__eta.layout, {...it, body: __eta.res, ...__eta.layoutData});
}

return __eta.res;
`);
  });

  it("works with whitespace trimming", () => {
    const str = eta.compileToString(
      "hi\n<%- = it.firstname-%>\n<%_ = it.lastname_%>",
    );
    expect(str).toEqual(`
let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

__eta.res+='hi'
__eta.res+=__eta.e(it.firstname)
__eta.res+=__eta.e(it.lastname)

if (__eta.layout) {
  __eta.res = include (__eta.layout, {...it, body: __eta.res, ...__eta.layoutData});
}

return __eta.res;
`);
  });

  it("compiles complex template", () => {
    const str = eta.compileToString(complexTemplate);
    expect(str).toEqual(`
let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

__eta.res+='Hi\\n'
console.log("Hope you like Eta!")
__eta.res+=__eta.e(it.htmlstuff)
__eta.res+='\\n'
for (var key in it.obj) {
__eta.res+='Value: '
__eta.res+=__eta.e(it.obj[key])
__eta.res+=', Key: '
__eta.res+=__eta.e(key)
__eta.res+='\\n'
if (key === 'thirdchild') {
__eta.res+='  '
for (var i = 0, arr = it.obj[key]; i < arr.length; i++) {
__eta.res+='      Salutations! Index: '
__eta.res+=__eta.e(i)
__eta.res+=', parent key: '
__eta.res+=__eta.e(key)
__eta.res+='      \\n  '
}
}
}
__eta.res+='\\nThis is a partial: '
__eta.res+=include("mypartial")

if (__eta.layout) {
  __eta.res = include (__eta.layout, {...it, body: __eta.res, ...__eta.layoutData});
}

return __eta.res;
`);
  });
});
