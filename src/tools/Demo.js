"use strict";

const Demo = module.exports = {};

const Gui = require('./Gui.js');
const Inspector = require('./Inspector.js');
const ToolsCommon = require('../Common.js');

const Matter = require('matter-js'),
  Body = Matter.Body,
  Example = Matter.Example,
  Engine = Matter.Engine,
  World = Matter.World,
  Common = Matter.Common,
  Bodies = Matter.Bodies,
  Events = Matter.Events,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Runner = Matter.Runner,
  Render = Matter.Render;

Demo._matterLink = 'http://brm.io/matter-js/';
Demo._jqueryJsUrl = '//code.jquery.com/jquery-3.1.1.js';

Demo.create = function(options) {
  let demo = Object.assign({
    example: {
      instance: null
    },
    examples: [],
    toolbar: {
      title: null,
      url: null,
      reset: true,
      source: false,
      inspector: false,
      tools: false,
      fullscreen: true,
      exampleSelect: false
    },
    tools: {
      inspector: null,
      gui: null
    },
    dom: {}
  }, options || {});

  if (demo.examples.length > 1 && options.toolbar.exampleSelect !== false) {
    demo.toolbar.exampleSelect = true;
  }

  demo.dom = Demo._createDom(demo);
  Demo._bindDom(demo);

  return demo;
};

Demo.start = function(demo, initalExampleId) {
  initalExampleId = initalExampleId || demo.examples[0].id;

  if (window.location.hash.length > 0) {
    initalExampleId = window.location.hash.slice(1);
  }

  Demo.setExampleById(demo, initalExampleId);
};

Demo.stop = function(demo) {
  if (demo.example && demo.example.instance) {
    demo.example.instance.stop();
  }
};

Demo.setExampleById = function(demo, exampleId) {
  let example = demo.examples.filter((example) => {
    return example.id === exampleId;
  })[0];

  Demo.setExample(demo, example);
};

Demo.setExample = function(demo, example) {
  if (example) {
    let instance = demo.example.instance;

    if (instance) {
      instance.stop();

      if (instance.canvas) {
        instance.canvas.parentElement.removeChild(instance.canvas);
      }
    }

    window.location.hash = example.id;

    demo.example.instance = null;
    demo.example = example;
    demo.example.instance = example.init(demo);

    demo.dom.exampleSelect.value = example.id;
    demo.dom.buttonSource.href = example.sourceLink || demo.url || '#';
  } else {
    Demo.setExample(demo, demo.examples[0]);
  }

  if (demo.tools.inspector) {
    Demo.setInspector(demo, true);
  }

  if (demo.tools.gui) {
    Demo.setGui(demo, true);
  }
};

Demo.setInspector = function(demo, enabled) {
  if (!enabled) {
    Demo._destroyTools(demo, true, false);
    demo.dom.root.classList.toggle('matter-inspect-active', false);
    return;
  }

  let instance = demo.example.instance;

  if (!instance.engine || !instance.runner || !instance.render) {
    Matter.Common.warn('matter-demo: example does not expose a Matter.Engine, Matter.Runner or Matter.Render so Inspector can not run.');
  } else {
    //Demo._loadTools(() => {
      Demo._destroyTools(demo, true, false);

      demo.dom.root.classList.toggle('matter-inspect-active', true);

      demo.tools.inspector = Inspector.create(
        instance.engine, 
        instance.runner, 
        instance.render
      );
    //});
  }
};

Demo.setGui = function(demo, enabled) {
  if (!enabled) {
    Demo._destroyTools(demo, false, true);
    demo.dom.root.classList.toggle('matter-gui-active', false);
    return;
  }

  let instance = demo.example.instance;

  if (!instance.engine || !instance.runner || !instance.render) {
    Matter.Common.warn('matter-demo: example does not expose a Matter.Engine, Matter.Runner or Matter.Render so Inspector can not run.');
  } else {
    //Demo._loadTools(() => {
      Demo._destroyTools(demo, false, true);

      demo.dom.root.classList.toggle('matter-gui-active', true);

      demo.tools.gui = Gui.create(
        instance.engine, 
        instance.runner, 
        instance.render
      );
    //});
  }
};

Demo._loadTools = function(callback) {
  /*let count = 0;

  let checkReady = () => {
    count += 1;

    if (count === 2) {
      callback();
    }
  };

  let next;

  if (!window.MatterTools) {
    next = () => {*/
      /*var matterToolsScript = document.createElement('script');
      matterToolsScript.src = Demo._matterToolsJsUrl;
      matterToolsScript.onload = checkReady;
      document.body.appendChild(matterToolsScript);*/

      //ToolsCommon.injectScript(Demo._matterToolsJsUrl, 'matter-tools-jquery', checkReady);

      /*var matterToolsStyle = document.createElement('link');
      matterToolsStyle.media = 'all';
      matterToolsStyle.rel = 'stylesheet';
      matterToolsStyle.href = Demo._matterToolsCssUrl;
      matterToolsStyle.onload = checkReady;
      document.head.appendChild(matterToolsStyle);*/
    /*};
  } else {
    next = callback;
  }*/

  if (!window.jQuery) {
    /*var jQueryScript = document.createElement('script');
    jQueryScript.src = Demo._jqueryJsUrl;
    jQueryScript.onload = () => {
      count += 1;
      next();
    };
    document.body.appendChild(jQueryScript);*/
    ToolsCommon.injectScript(Demo._jqueryJsUrl, 'matter-tools-jquery', callback);
  } else {
    callback();
  }
};

Demo._destroyTools = function(demo, destroyInspector, destroyGui) {
  let inspector = demo.tools.inspector,
    gui = demo.tools.gui;

  if (destroyInspector && inspector && inspector !== true) {
    Inspector.destroy(inspector);
    demo.tools.inspector = null;
  }

  if (destroyGui && gui && gui !== true) {
    Gui.destroy(gui);
    demo.tools.gui = null;
  }
};

Demo.toggleFullscreen = function(demo) {
  let fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

  if (!fullscreenElement) {
    fullscreenElement = demo.dom.root;

    if (fullscreenElement.requestFullscreen) {
      fullscreenElement.requestFullscreen();
    } else if (fullscreenElement.mozRequestFullScreen) {
      fullscreenElement.mozRequestFullScreen();
    } else if (fullscreenElement.webkitRequestFullscreen) {
      fullscreenElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen(); 
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen(); 
    }
  }
};

Demo._bindDom = function(demo) {
  var dom = demo.dom;

  if (dom.exampleSelect) {
    dom.exampleSelect.addEventListener('change', function(event) {
      let exampleId = this.options[this.selectedIndex].value;
      Demo.setExampleById(demo, exampleId);
    });
  }

  if (dom.buttonReset) {
    dom.buttonReset.addEventListener('click', function(event) {
      Demo.setExample(demo, demo.example);
    });
  }

  if (dom.buttonInspect) {
    dom.buttonInspect.addEventListener('click', function(event) {
      var showInspector = !demo.tools.inspector;
      Demo.setInspector(demo, showInspector);
    });
  }

  if (dom.buttonTools) {
    dom.buttonTools.addEventListener('click', function(event) {
      var showGui = !demo.tools.gui;
      Demo.setGui(demo, showGui);
    });
  }

  if (dom.buttonFullscreen) {
    dom.buttonFullscreen.addEventListener('click', function(event) {
      Demo.toggleFullscreen(demo);
    });

    var fullscreenChange = function(event) {
      var isFullscreen = document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
      document.body.classList.toggle('matter-is-fullscreen', isFullscreen);

      setTimeout(function() {
        Demo.setExample(demo, demo.example);
      }, 500);
    };

    document.addEventListener('webkitfullscreenchange', fullscreenChange);
    document.addEventListener('mozfullscreenchange', fullscreenChange);
    document.addEventListener('fullscreenchange', fullscreenChange);
  }
};

Demo._createDom = function(options) {
  let styles = require("../styles/demo.css");
  ToolsCommon.injectStyles(styles, 'matter-demo-style');

  let root = document.createElement('div');

  let exampleOptions = options.examples.map((example) => {
    return `<option value="${example.id}">${example.name}</option>`;
  }).join(' ');

  root.innerHTML = `
    <div class="matter-demo ${options.toolbar.title}">
      <header class="matter-header">
        <div class="matter-header-inner">
          <h1 class="matter-demo-title">
            <a href="${options.toolbar.url}" target="_blank">${options.toolbar.title} ↗</a>
          </h1>
          <div class="matter-toolbar">
            <div class="matter-select-wrapper">
              <select class="matter-example-select matter-select">
                ${exampleOptions}
              </select>
            </div>
            <button class="matter-btn matter-btn-reset" title="Reset">↻&#xFE0E;</button>
            <a href="#" class="matter-btn matter-btn-source" title="Source" target="_blank">{ }</a>
            <button class="matter-btn matter-btn-tools" title="Tools">✎&#xFE0E;</button>
            <button class="matter-btn matter-btn-inspect" title="Inspect">&#8857;&#xFE0E;</button>
            <button class="matter-btn matter-btn-fullscreen" title="Fullscreen">&#9633;&#xFE0E;</button>
          </div>
          <a class="matter-link" href="${Demo._matterLink}" title="matter.js" target="_blank">
            <i>▲</i><i>●</i><i>■</i>
          </a>
        </div>
      </header>
      <div class="matter-render"></div>
    </div>
  `;

  let dom = {
    root: root.firstElementChild,
    title: root.querySelector('.matter-demo-title'),
    exampleSelect: root.querySelector('.matter-example-select'),
    buttonReset: root.querySelector('.matter-btn-reset'),
    buttonSource: root.querySelector('.matter-btn-source'),
    buttonTools: root.querySelector('.matter-btn-tools'),
    buttonInspect: root.querySelector('.matter-btn-inspect'),
    buttonFullscreen: root.querySelector('.matter-btn-fullscreen')
  };

  if (!options.toolbar.title) {
    ToolsCommon.domRemove(dom.title);
  }

  if (!options.toolbar.exampleSelect) {
    ToolsCommon.domRemove(dom.exampleSelect.parentElement);
  }

  if (!options.toolbar.reset) {
    ToolsCommon.domRemove(dom.buttonReset);
  }

  if (!options.toolbar.source) {
    ToolsCommon.domRemove(dom.buttonSource);
  }

  if (!options.toolbar.inspector) {
    ToolsCommon.domRemove(dom.buttonInspect);
  }

  if (!options.toolbar.tools) {
    ToolsCommon.domRemove(dom.buttonTools);
  }

  if (!options.toolbar.fullscreen) {
    ToolsCommon.domRemove(dom.buttonFullscreen);
  }

  return dom;
};