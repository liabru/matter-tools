"use strict";

/**
 * A tool for for running and testing example scenes.
 * @module Demo
 */

const Matter = require('matter-js');
const Common = Matter.Common;
const Demo = module.exports = {};
const Gui = require('matter-tools').Gui;
const Inspector = require('matter-tools').Inspector;
const ToolsCommon = require('./Common');

Demo._isIOS = window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

Demo._matterLink = 'http://brm.io/matter-js/';

/**
 * Creates a new demo instance.
 * See example for options and usage.
 * @function Demo.create
 * @param {} options
 */
Demo.create = function(options) {
  let demo = Object.assign({
    example: {
      instance: null
    },
    examples: [],
    resetOnOrientation: false,
    preventZoom: false,
    inline: false,
    startExample: true,
    appendTo: document.body,
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

  if (Demo._isIOS) {
    demo.toolbar.fullscreen = false;
  }

  if (!Gui) {
    demo.toolbar.tools = false;
    demo.tools.gui = false;
  }

  if (!Inspector) {
    demo.toolbar.inspector = false;
    demo.tools.inspector = false;
  }

  demo.dom = Demo._createDom(demo);
  Demo._bindDom(demo);

  if (demo.inline) {
    demo.dom.root.classList.add('matter-demo-inline');
  }

  if (demo.appendTo) {
    demo.appendTo.appendChild(demo.dom.root);
  }

  if (demo.startExample) {
    Demo.start(demo, demo.startExample);
  }

  return demo;
};

/**
 * Starts a new demo instance by running the first or given example.
 * See example for options and usage.
 * @function Demo.start
 * @param {demo} demo
 * @param {string} [initalExampleId] example to start (defaults to first)
 */
Demo.start = function(demo, initalExampleId) {
  initalExampleId = typeof initalExampleId === 'string' ? initalExampleId : demo.examples[0].id;

  if (window.location.hash.length > 0) {
    initalExampleId = window.location.hash.slice(1);
  }

  Demo.setExampleById(demo, initalExampleId);
};

/**
 * Stops the currently running example in the demo.
 * This requires that the `example.init` function returned 
 * an object specifiying a `stop` function.
 * @function Demo.stop
 * @param {demo} demo
 */
Demo.stop = function(demo) {
  if (demo.example && demo.example.instance) {
    demo.example.instance.stop();
  }
};

/**
 * Stops and restarts the currently running example.
 * @function Demo.reset
 * @param {demo} demo
 */
Demo.reset = function(demo) {
  Common._nextId = 0;
  Common._seed = 0;

  Demo.setExample(demo, demo.example);
};

/**
 * Starts the given example by its id. 
 * Any running example will be stopped.
 * @function Demo.setExampleById
 * @param {demo} demo
 * @param {string} exampleId 
 */
Demo.setExampleById = function(demo, exampleId) {
  let example = demo.examples.filter((example) => {
    return example.id === exampleId;
  })[0];

  Demo.setExample(demo, example);
};

/**
 * Starts the given example.
 * Any running example will be stopped.
 * @function Demo.setExample
 * @param {demo} demo
 * @param {example} example 
 */
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

    demo.example.instance = instance = example.init(demo);

    if (!instance.canvas && instance.render) {
      instance.canvas = instance.render.canvas;
    }

    if (instance.canvas) {
      demo.dom.header.style.maxWidth = instance.canvas.width + 'px';
      demo.dom.root.appendChild(instance.canvas);
    }

    demo.dom.exampleSelect.value = example.id;
    demo.dom.buttonSource.href = example.sourceLink || demo.url || '#';

    setTimeout(function() {
      if (demo.tools.inspector) {
        Demo.setInspector(demo, true);
      }

      if (demo.tools.gui) {
        Demo.setGui(demo, true);
      }
    }, 500);
  } else {
    Demo.setExample(demo, demo.examples[0]);
  }
};

/**
 * Enables or disables the inspector tool.
 * If `enabled` a new `Inspector` instance will be created and the old one destroyed.
 * @function Demo.setInspector
 * @param {demo} demo
 * @param {bool} enabled
 */
Demo.setInspector = function(demo, enabled) {
  if (!enabled) {
    Demo._destroyTools(demo, true, false);
    demo.dom.root.classList.toggle('matter-inspect-active', false);
    return;
  }

  let instance = demo.example.instance;

  Demo._destroyTools(demo, true, false);
  demo.dom.root.classList.toggle('matter-inspect-active', true);

  demo.tools.inspector = Inspector.create(
    instance.engine,
    instance.render
  );
};

/**
 * Enables or disables the Gui tool.
 * If `enabled` a new `Gui` instance will be created and the old one destroyed.
 * @function Demo.setGui
 * @param {demo} demo
 * @param {bool} enabled
 */
Demo.setGui = function(demo, enabled) {
  if (!enabled) {
    Demo._destroyTools(demo, false, true);
    demo.dom.root.classList.toggle('matter-gui-active', false);
    return;
  }

  let instance = demo.example.instance;

  Demo._destroyTools(demo, false, true);
  demo.dom.root.classList.toggle('matter-gui-active', true);

  demo.tools.gui = Gui.create(
    instance.engine, 
    instance.runner, 
    instance.render
  );
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

Demo._toggleFullscreen = function(demo) {
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

  window.addEventListener('orientationchange', function() {
    setTimeout(() => {
      if (demo.resetOnOrientation) {
        Demo.reset(demo);
      }
    }, 300);
  });

  if (demo.preventZoom) {
    document.body.addEventListener('gesturestart', function(event) { 
      event.preventDefault(); 
    });

    var allowTap = true,
      tapTimeout;

    document.body.addEventListener('touchstart', function(event) {
      if (!allowTap) {
        event.preventDefault();
      }

      allowTap = false;

      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(function() {
        allowTap = true;
      }, 500);
    });
  }

  if (dom.exampleSelect) {
    dom.exampleSelect.addEventListener('change', function() {
      let exampleId = this.options[this.selectedIndex].value;
      Demo.setExampleById(demo, exampleId);
    });
  }

  if (dom.buttonReset) {
    dom.buttonReset.addEventListener('click', function() {
      Demo.reset(demo);
    });
  }

  if (dom.buttonInspect) {
    dom.buttonInspect.addEventListener('click', function() {
      var showInspector = !demo.tools.inspector;
      Demo.setInspector(demo, showInspector);
    });
  }

  if (dom.buttonTools) {
    dom.buttonTools.addEventListener('click', function() {
      var showGui = !demo.tools.gui;
      Demo.setGui(demo, showGui);
    });
  }

  if (dom.buttonFullscreen) {
    dom.buttonFullscreen.addEventListener('click', function() {
      Demo._toggleFullscreen(demo);
    });

    var fullscreenChange = function() {
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
  let styles = require('../styles/demo.css');
  ToolsCommon.injectStyles(styles, 'matter-demo-style');

  let root = document.createElement('div');

  let exampleOptions = options.examples.map((example) => {
    return `<option value="${example.id}">${example.name}</option>`;
  }).join(' ');

  var preventZoomClass = options.preventZoom && Demo._isIOS ? 'prevent-zoom-ios' : '';

  root.innerHTML = `
    <div class="matter-demo ${options.toolbar.title} ${preventZoomClass}">
      <div class="matter-header-outer">
        <header class="matter-header">
          <div class="matter-header-inner">
            <h1 class="matter-demo-title">
              <a href="${options.toolbar.url}" target="_blank">
              ${options.toolbar.title}
                <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/>
                </svg>
              </a>
            </h1>
            <div class="matter-toolbar">
              <div class="matter-select-wrapper">
                <select class="matter-example-select matter-select">
                  ${exampleOptions}
                </select>
                <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
              </div>
              <button class="matter-btn matter-btn-reset" title="Reset">
                <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
              </button>
              <a href="#" class="matter-btn matter-btn-source" title="Source" target="_blank">{ }</a>
              <button class="matter-btn matter-btn-tools" title="Tools">
                <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
              </button>
              <button class="matter-btn matter-btn-inspect" title="Inspect">
              <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M11 4.07V2.05c-2.01.2-3.84 1-5.32 2.21L7.1 5.69c1.11-.86 2.44-1.44 3.9-1.62zm7.32.19C16.84 3.05 15.01 2.25 13 2.05v2.02c1.46.18 2.79.76 3.9 1.62l1.42-1.43zM19.93 11h2.02c-.2-2.01-1-3.84-2.21-5.32L18.31 7.1c.86 1.11 1.44 2.44 1.62 3.9zM5.69 7.1L4.26 5.68C3.05 7.16 2.25 8.99 2.05 11h2.02c.18-1.46.76-2.79 1.62-3.9zM4.07 13H2.05c.2 2.01 1 3.84 2.21 5.32l1.43-1.43c-.86-1.1-1.44-2.43-1.62-3.89zM15 12c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3zm3.31 4.9l1.43 1.43c1.21-1.48 2.01-3.32 2.21-5.32h-2.02c-.18 1.45-.76 2.78-1.62 3.89zM13 19.93v2.02c2.01-.2 3.84-1 5.32-2.21l-1.43-1.43c-1.1.86-2.43 1.44-3.89 1.62zm-7.32-.19C7.16 20.95 9 21.75 11 21.95v-2.02c-1.46-.18-2.79-.76-3.9-1.62l-1.42 1.43z"/>
              </svg>
              </button>
              <button class="matter-btn matter-btn-fullscreen" title="Fullscreen">
                <svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </button>
            </div>
            <a class="matter-link" href="${Demo._matterLink}" title="matter.js" target="_blank">
              <svg class="matter-logo" height="100" viewBox="0 952.04859 330 100" width="268" xmlns="http://www.w3.org/2000/svg">
                <path id="m-triangle" style="fill:#76f09b;" d="m 115.83215,1052.3622 -57.916072,0 -57.916078053812107,0 L 28.958038,1002.2054 57.916077,952.04859 86.874114,1002.2054 Z" />
                <path id="m-square" style="fill:#f55f5f" d="m 168.03172,952.36218 0,100.00002 100,0 0,-100.00002 -100,0 z" />
                <circle id="m-circle" style="fill:#f5b862" r="12.947398" cy="1039.4148" cx="140.28374" />
              </svg>
            </a>
          </div>
        </header>
      </div>
    </div>
  `;

  let dom = {
    root: root.firstElementChild,
    title: root.querySelector('.matter-demo-title'),
    header: root.querySelector('.matter-header'),
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