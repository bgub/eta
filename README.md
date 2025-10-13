<p align="center">
  <img align="center" width="50%" src="https://github.com/bgub/eta/assets/25597854/041dbe34-883b-459b-8607-c787815c441a">
</p>

<h1 align="center" style="text-align: center; width: fit-content; margin-left: auto; margin-right: auto;">eta (η)</h1>

<p align="center">
  <a href="https://eta.js.org">Documentation</a> -
  <a href="https://discord.gg/27gGncJYE2">Chat</a> -
  <a href="https://eta.js.org/playground">Playground</a>
</p>

<span align="center">

[![GitHub package.json version (main)](https://img.shields.io/github/package-json/v/bgub/eta/main?label=current%20version)](https://www.npmjs.com/package/eta)
[![GitHub Actions Status](https://github.com/bgub/eta/actions/workflows/ci.yml/badge.svg)](https://github.com/bgub/eta/actions)
[![Codecov](https://codecov.io/github/bgub/eta/branch/main/graph/badge.svg)](https://codecov.io/github/bgub/eta)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg)](https://paypal.me/bengubler)

</span>

<span align="center">

**You're viewing the source for Eta v4 (ESM-only)**

</span>

## Summary

Eta is a lightweight and blazing fast embedded JS templating engine that works inside Node, Deno, and the browser. It's written in TypeScript and emphasizes great performance, configurability, and small bundle size.

### 🌟 Features

- 📦 0 dependencies
- 💡 Only ~3.5 KB minzipped
- ⚡️ Written in TypeScript
- ✨ Deno support (+ Node and browser)
- 🚀 Super Fast
- 🔧 Configurable
  - Plugins, custom delimiters, caching
- 🔨 Powerful
  - Precompilation, partials, async
  - **Layout support**!
- 🔥 Reliable
  - Better quotes/comments support
    - _ex._ `<%= someval + "string %>" %>` compiles correctly, while it fails with doT or EJS
  - Great error reporting
- ⚡️ Exports ES Modules
- 📝 Easy template syntax

## Get Started

_For more thorough documentation, visit [https://eta.js.org](https://eta.js.org)_

Install Eta

```bash
npm install eta
```

In the root of your project, create `templates/simple.eta`

```eta
Hi <%= it.name %>!
```

Then, in your JS file:

```js
import { Eta } from "eta";
// or use https://jsr.io/@bgub/eta

const eta = new Eta({ views: path.join(__dirname, "templates") });

// Render a template

const res = eta.render("./simple", { name: "Ben" });
console.log(res); // Hi Ben!
```

## FAQs

<details>
  <summary>
    <b>Where did Eta's name come from?</b>
  </summary>

"Eta" means tiny in Esperanto. Plus, it can be used as an acronym for all sorts of cool phrases: "ECMAScript Template Awesomeness", "Embedded Templating Alternative", etc....

Additionally, Eta is a letter of the Greek alphabet (it stands for all sorts of cool things in various mathematical fields, including efficiency) and is three letters long (perfect for a file extension).

</details>

<br />

## Integrations

<details>
  <summary>
    <b>Visual Studio Code</b>
  </summary>

[@shadowtime2000](https://github.com/shadowtime2000) created [eta-vscode](https://marketplace.visualstudio.com/items?itemName=shadowtime2000.eta-vscode).

</details>

<details>
  <summary>
    <b>ESLint</b>
  </summary>

[eslint-plugin-eta](https://github.com/eta-dev/eslint-plugin-eta) was created to provide an ESLint processor so you can lint your Eta templates.

</details>

<details>
  <summary>
    <b>Webpack</b>
  </summary>

Currently there is no official Webpack integration but [@clshortfuse](https://github.com/clshortfuse) shared the loader he uses:

```javascript
{
  loader: 'html-loader',
  options: {
    preprocessor(content, loaderContext) {
      return eta.render(content, {}, { filename: loaderContext.resourcePath });
    },
  },
}
```

</details>

<details>
  <summary>
    <b>Node-RED</b>
  </summary>

To operate with Eta templates in Node-RED: [@ralphwetzel/node-red-contrib-eta](https://flows.nodered.org/node/@ralphwetzel/node-red-contrib-eta)

  <img width="150" alt="image" src="https://user-images.githubusercontent.com/16342003/160198427-2a69ff10-e8bf-4873-9d99-2929a584ccc8.png">

</details>

<details>
  <summary>
    <b>Koa</b>
  </summary>

To render Eta templates in [Koa](https://koajs.com) web framework: [@cedx/koa-eta](https://github.com/cedx/koa-eta/wiki)

</details>

<details>
  <summary>
    <b>Vite</b>
  </summary>

To use Eta templates in your Vite project: [@rinoshiyo/vite-plugin-eta](https://github.com/rinoshiyo/vite-plugin-eta)

</details>

<br />

## Projects using `eta`

- [Docusaurus v2](https://v2.docusaurus.io): open-source documentation framework that uses Eta to generate a SSR build
- [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api): Open source typescript api codegenerator from Swagger. Uses Eta as codegenerator by templates
- [html-bundler-webpack-plugin](https://github.com/webdiscus/html-bundler-webpack-plugin): Webpack plugin make easily to bundle HTML pages from templates, source styles and scripts
- [SmartDeno](https://github.com/guildenstern70/SmartDeno): SmartDeno is an easy to setup web template using Deno & Oak
- [stc](https://github.com/long-woo/stc): OpenAPI (Swagger) and Apifox documentation converted to api. Use eta templates to generate code.
- [Add yours!](https://github.com/bgub/eta/edit/master/README.md)

## Contributors

Made with ❤️ by [bgub](https://github.com/bgub) and [many wonderful contributors](https://github.com/bgub/eta/graphs/contributors). Contributions of any kind are welcome!

## Credits

- Async support, file handling, and error formatting were based on code from [EJS](https://github.com/mde/ejs), which is licensed under the Apache-2.0 license. Code was modified and refactored to some extent.
- Syntax and some parts of compilahttps://jsr.io/@bgub/etation are heavily based off EJS, Nunjucks, and doT.
