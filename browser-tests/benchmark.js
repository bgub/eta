/* eslint-disable dot-notation, space-before-function-paren */
/* global template, doT, ejs, Handlebars, Sqrl, Mustache, swig, Highcharts, _, Eta */

/*

Modified from AUI's docs. See their license below:
==================================================
Copyright (c) 2017 糖饼

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const etaInstance = new eta.Eta({
  autoTrim: false,
});

Sqrl.defaultConfig.autoTrim = false;

var templateList = {
  template: `
<ul>
    <% for (var i = 0, l = list.length; i < l; i ++) { %>
        <li>User: <%= list[i].user %> / Web Site: <%= list[i].site %></li>
    <% } %>
</ul>`,
  "template-raw": `
<ul>
    <% for (var i = 0, l = list.length; i < l; i ++) { %>
        <li>User: <%- list[i].user %> / Web Site: <%- list[i].site %></li>
    <% } %>
</ul>`,
  "template-fast-mode": `
<ul>
    <% for (var i = 0, l = $data.list.length; i < l; i ++) { %>
        <li>User: <%= $data.list[i].user %> / Web Site: <%= $data.list[i].site %></li>
    <% } %>
</ul>`,
  "template-fast-mode-raw": `
<ul>
    <% for (var i = 0, l = $data.list.length; i < l; i ++) { %>
        <li>User: <%- $data.list[i].user %> / Web Site: <%- $data.list[i].site %></li>
    <% } %>
</ul>`,
  eta: `
<ul>
    <% for (var i = 0, ln = it.list.length; i < ln; i ++) { %>
        <li>User: <%= it.list[i].user %> / Web Site: <%= it.list[i].site %></li>
    <% } %>
</ul>`,
  "eta-raw": `
<ul>
    <% for (var i = 0, ln = it.list.length; i < ln; i ++) { %>
        <li>User: <%~ it.list[i].user %> / Web Site: <%~ it.list[i].site %></li>
    <% } %>
</ul>`,
  dot: `
<ul>
    {{ for (var i = 0, l = it.list.length; i < l; i ++) { }}
        <li>User: {{!it.list[i].user}} / Web Site: {{!it.list[i].site}}</li>
    {{ } }}
</ul>`,
  "dot-raw": `
<ul>
    {{ for (var i = 0, l = it.list.length; i < l; i ++) { }}
        <li>User: {{=it.list[i].user}} / Web Site: {{=it.list[i].site}}</li>
    {{ } }}
</ul>`,
};

/* ----------------- */

var config = {
  length: 20,
  calls: 6000,
  escape: true,
};

function getParameterByName(name) {
  var url = window.location.href;
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  var results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

if (window.location.search) {
  if (getParameterByName("length")) {
    config.length = Number(getParameterByName("length"));
  }
  if (getParameterByName("calls")) {
    config.calls = Number(getParameterByName("calls"));
  }
  if (getParameterByName("escape")) {
    config.escape = getParameterByName("escape") === "true";
  }
}

// 制造测试数据
var data = {
  list: [],
};

for (let i = 0; i < config.length; i++) {
  data.list.push({
    index: i,
    user: '<strong style="color:red">糖饼</strong>',
    site: "https://github.com/aui",
    weibo: "http://weibo.com/planeart",
    QQweibo: "http://t.qq.com/tangbin",
  });
}

// 待测试的引擎列表
var testList = [
  {
    name: "art-template",
    tester: () => {
      var id = config.escape ? "template" : "template-raw";
      var source = templateList[id];
      //   console.log(fn.toString())
      var html = "";
      for (let i = 0; i < config.calls; i++) {
        const fn = template.compile(source);
        html = fn(data);
      }
      return html;
    },
  },

  {
    name: "art-template / fast mode",
    tester: () => {
      var id = config.escape ? "template-fast-mode" : "template-fast-mode-raw";
      var source = templateList[id];
      var html = "";
      for (let i = 0; i < config.calls; i++) {
        const fn = template.compile(source);
        html = fn(data);
      }
      return html;
    },
  },

  {
    name: "lodash.template",
    tester: () => {
      var id = config.escape ? "template" : "template-raw";
      var source = templateList[id];
      var html = "";
      for (let i = 0; i < config.calls; i++) {
        const fn = _.template(source);
        html = fn(data);
      }
      return html;
    },
  },

  {
    name: "doT",
    tester: () => {
      var id = config.escape ? "dot" : "dot-raw";
      var source = templateList[id];
      var html = "";
      for (let i = 0; i < config.calls; i++) {
        const fn = doT.template(source);
        html = fn(data);
      }
      return html;
    },
  },

  {
    name: "ejs",
    tester: () => {
      var id = config.escape ? "template" : "template-raw";
      var source = templateList[id];
      var html = "";
      for (let i = 0; i < config.calls; i++) {
        const fn = ejs.compile(source);
        html = fn(data);
      }
      return html;
    },
  },

  {
    name: "Eta",
    tester: () => {
      var id = config.escape ? "eta" : "eta-raw";

      var source = templateList[id];
      var html = "";
      data.$name = "temp";
      for (let i = 0; i < config.calls; i++) {
        const fn = etaInstance.compile(source);
        html = etaInstance.render(fn, data);
      }
      return html;
    },
  },
];

Highcharts.setOptions({
  colors: [
    "#EF6F65",
    "#F3AB63",
    "#F8D56F",
    "#99DD7A",
    "#74BBF3",
    "#CB93E0",
    "#A2A2A4",
    "#E1AC65",
    "#6AF9C4",
  ],
});

var runTest = (callback) => {
  var list = testList.filter(
    (test) => !config.escape || test.supportEscape !== false,
  );

  var Timer = function () {
    this.startTime = window.performance.now();
  };

  Timer.prototype.stop = function () {
    return window.performance.now() - this.startTime;
  };

  var colors = Highcharts.getOptions().colors;
  var categories = [];

  for (let i = 0; i < list.length; i++) {
    categories.push(list[i].name);
  }

  var chart = new Highcharts.Chart({
    chart: {
      animation: {
        duration: 150,
      },
      renderTo: "test-container",
      height: categories.length * 32,
      type: "bar",
    },

    title: false,

    // subtitle: {
    //     text: config.length + ' list × ' + config.calls + ' calls'
    // },

    xAxis: {
      categories: categories,
      labels: {},
    },

    yAxis: {
      min: 0,
      title: {
        text: "Time",
      },
    },

    legend: {
      enabled: false,
    },

    tooltip: {
      formatter: function () {
        return "<b>" + this.x + "</b><br/>" + this.y + " ops/sec";
      },
    },

    credits: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          formatter: function () {
            return this.y + " ops/sec";
          },
        },
      },
    },
    series: [
      {
        data: [],
      },
    ],
  });

  function tester(target) {
    var time = new Timer();
    var html = target.tester();
    var endTime = time.stop();
    console.log(target.name + "------------------\n", html);

    var timeInSecs = endTime / 1000;
    var opsPerSec = Math.round(config.calls / timeInSecs);

    chart.series[0].addPoint({
      color: colors.shift(),
      y: opsPerSec,
    });

    if (!list.length) {
      callback();
      return;
    }

    target = list.shift();

    setTimeout(() => {
      tester(target);
    }, 500);
  }

  var target = list.shift();
  tester(target);
};

window.restart = (key, value) => {
  config[key] = value;
};

function getLink() {
  window.location.search =
    "length=" +
    config.length +
    "&calls=" +
    config.calls +
    "&escape=" +
    config.escape;
}

window.load = (selector) => {
  var app = document.querySelector(selector);
  var body = `
<h1>Eta Browser Benchmarks</h1>
<br>
<em>This benchmark of popular embedded template engines measures both compilation and rendering. Since the results can be somewhat inconsistent (and don't reflect the full picture, like feature support) this feature is best used by developers working on Eta.</em>
<br><br>
<em>Note: doT and Eta usually trade off the lead on unescaped templates. Keep in mind that Eta supports template tags inside strings & comments, plugins, whitespace trimming, etc.</em>
<br><br>
<em>Note: these benchmarks are ONLY VALID if page is served by a server (localhost, RawGit are ok). Otherwise results are highly variable and inaccurate (I don't know why!)</em>
<br><br>
<strong>Longer (more ops/sec) is better</strong>

<div class="header">
    <p class="item">
        <button id="button-start" class="button">Run Test&raquo;</button>
        <button id="button-restart" class="button" style="display:none">Restart</button>
        <br><br>
        <span>config: </span>
        <label><input type="number" value="{{it.length}}" onchange="restart('length', this.value)"> list</label>
        <strong>×</strong>
        <label><input type="number" value="{{it.calls}}" onchange="restart('calls', this.value)"> calls</label>
        <label><input type="checkbox" {{@if(it.escape)}}checked{{/if}} onchange="restart('escape', this.checked)"> escape</label>
        <button id="get-link" class="button">&#x1f517; Get link</button>

    </p>
    <p class="item">
    </p>
</div>
<div id="test-container" style="min-width: 400px; margin: 0 auto"></div>`;

  var data = config;
  data.testList = testList;
  app.innerHTML = Sqrl.render(body, data, { name: "body" });

  document.getElementById("get-link").addEventListener("click", getLink);

  document.getElementById("button-start").onclick = function () {
    this.disabled = true;
    runTest(() => {
      this.style.display = "none";
      document.getElementById("button-restart").style.display = "";
    });
  };

  document.getElementById("button-restart").onclick = () => {
    window.location.reload();
  };
};
