/*!
 * matter-tools 0.5.0 by Liam Brummitt 2016-11-12
 * https://github.com/liabru/matter-tools
 * License MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("GIF"), require("dat"), require("jQuery"), require("Resurrect"), require("Matter"));
	else if(typeof define === 'function' && define.amd)
		define(["GIF", "dat", "jQuery", "Resurrect", "Matter"], factory);
	else if(typeof exports === 'object')
		exports["MatterTools"] = factory(require("GIF"), require("dat"), require("jQuery"), require("Resurrect"), require("Matter"));
	else
		root["MatterTools"] = factory(root["GIF"], root["dat"], root["jQuery"], root["Resurrect"], root["Matter"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_9__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/demo";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  name: 'matter-tools',
	  version: '0.5.0',
	  for: 'matter-js@^0.11.0',
	  install: () => {},
	  Demo: __webpack_require__(1),
	  Gui: __webpack_require__(3),
	  Inspector: __webpack_require__(7)
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	const Demo = module.exports = {};

	Demo._style = __webpack_require__(2);

	const Gui = __webpack_require__(3);
	const Inspector = __webpack_require__(7);

	const Matter = __webpack_require__(9),
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
	Demo._matterToolsJsUrl = '//cdn.rawgit.com/liabru/matter-tools/master/build/matter-tools.js';
	Demo._matterToolsCssUrl = '//cdn.rawgit.com/liabru/matter-tools/master/build/matter-tools.css';

	Demo.create = function (options) {
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

	Demo.start = function (demo, initalExampleId) {
	  initalExampleId = initalExampleId || demo.examples[0].id;

	  if (window.location.hash.length > 0) {
	    initalExampleId = window.location.hash.slice(1);
	  }

	  Demo.setExampleById(demo, initalExampleId);
	};

	Demo.stop = function (demo) {
	  if (demo.example && demo.example.instance) {
	    demo.example.instance.stop();
	  }
	};

	Demo.setExampleById = function (demo, exampleId) {
	  let example = demo.examples.filter(example => {
	    return example.id === exampleId;
	  })[0];

	  Demo.setExample(demo, example);
	};

	Demo.setExample = function (demo, example) {
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

	Demo.setInspector = function (demo, enabled) {
	  if (!enabled) {
	    Demo._destroyTools(demo, true, false);
	    demo.dom.root.classList.toggle('matter-inspect-active', false);
	    return;
	  }

	  let instance = demo.example.instance;

	  if (!instance.engine || !instance.runner || !instance.render) {
	    Matter.Common.warn('matter-demo: example does not expose a Matter.Engine, Matter.Runner or Matter.Render so Inspector can not run.');
	  } else {
	    Demo._loadTools(() => {
	      Demo._destroyTools(demo, true, false);

	      demo.dom.root.classList.toggle('matter-inspect-active', true);

	      demo.tools.inspector = Inspector.create(instance.engine, instance.runner, instance.render);
	    });
	  }
	};

	Demo.setGui = function (demo, enabled) {
	  if (!enabled) {
	    Demo._destroyTools(demo, false, true);
	    demo.dom.root.classList.toggle('matter-gui-active', false);
	    return;
	  }

	  let instance = demo.example.instance;

	  if (!instance.engine || !instance.runner || !instance.render) {
	    Matter.Common.warn('matter-demo: example does not expose a Matter.Engine, Matter.Runner or Matter.Render so Inspector can not run.');
	  } else {
	    Demo._loadTools(() => {
	      Demo._destroyTools(demo, false, true);

	      demo.dom.root.classList.toggle('matter-gui-active', true);

	      demo.tools.gui = Gui.create(instance.engine, instance.runner, instance.render);
	    });
	  }
	};

	Demo._loadTools = function (callback) {
	  let count = 0;

	  let checkReady = () => {
	    count += 1;

	    if (count === 3) {
	      callback();
	    }
	  };

	  let next;

	  if (!window.MatterTools) {
	    next = () => {
	      var matterToolsScript = document.createElement('script');
	      matterToolsScript.src = Demo._matterToolsJsUrl;
	      matterToolsScript.onload = checkReady;
	      document.body.appendChild(matterToolsScript);

	      var matterToolsStyle = document.createElement('link');
	      matterToolsStyle.media = 'all';
	      matterToolsStyle.rel = 'stylesheet';
	      matterToolsStyle.href = Demo._matterToolsCssUrl;
	      matterToolsStyle.onload = checkReady;
	      document.head.appendChild(matterToolsStyle);
	    };
	  } else {
	    next = callback;
	  }

	  if (!window.jQuery) {
	    var jQueryScript = document.createElement('script');
	    jQueryScript.src = Demo._jqueryJsUrl;
	    jQueryScript.onload = () => {
	      count += 1;
	      next();
	    };
	    document.body.appendChild(jQueryScript);
	  } else {
	    next();
	  }
	};

	Demo._destroyTools = function (demo, destroyInspector, destroyGui) {
	  let inspector = demo.tools.inspector,
	      gui = demo.tools.gui;

	  if (destroyInspector && inspector && inspector !== true) {
	    let inspector = demo.tools.inspector;
	    inspector.controls.worldTree.data('jstree').destroy();

	    var inspectorElements = [].slice.call(document.body.querySelectorAll('.ins-container', '.vakata-context', '.jstree-marker'));

	    inspectorElements.forEach(Demo._domRemove);
	    demo.tools.inspector = null;
	  }

	  if (destroyGui && gui && gui !== true) {
	    demo.tools.gui.datGui.destroy();
	    demo.tools.gui = null;
	  }
	};

	Demo.toggleFullscreen = function (demo) {
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

	Demo._domRemove = function (element) {
	  element.parentElement.removeChild(element);
	};

	Demo._bindDom = function (demo) {
	  var dom = demo.dom;

	  if (dom.exampleSelect) {
	    dom.exampleSelect.addEventListener('change', function (event) {
	      let exampleId = this.options[this.selectedIndex].value;
	      Demo.setExampleById(demo, exampleId);
	    });
	  }

	  if (dom.buttonReset) {
	    dom.buttonReset.addEventListener('click', function (event) {
	      Demo.setExample(demo, demo.example);
	    });
	  }

	  if (dom.buttonInspect) {
	    dom.buttonInspect.addEventListener('click', function (event) {
	      var showInspector = !demo.tools.inspector;
	      Demo.setInspector(demo, showInspector);
	    });
	  }

	  if (dom.buttonTools) {
	    dom.buttonTools.addEventListener('click', function (event) {
	      var showGui = !demo.tools.gui;
	      Demo.setGui(demo, showGui);
	    });
	  }

	  if (dom.buttonFullscreen) {
	    dom.buttonFullscreen.addEventListener('click', function (event) {
	      Demo.toggleFullscreen(demo);
	    });

	    var fullscreenChange = function (event) {
	      var isFullscreen = document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
	      document.body.classList.toggle('matter-is-fullscreen', isFullscreen);

	      setTimeout(function () {
	        Demo.setExample(demo, demo.example);
	      }, 500);
	    };

	    document.addEventListener('webkitfullscreenchange', fullscreenChange);
	    document.addEventListener('mozfullscreenchange', fullscreenChange);
	    document.addEventListener('fullscreenchange', fullscreenChange);
	  }
	};

	Demo._createDom = function (options) {
	  let root = document.createElement('div');

	  let exampleOptions = options.examples.map(example => {
	    return `<option value="${ example.id }">${ example.name }</option>`;
	  }).join(' ');

	  root.innerHTML = `
	    <div class="matter-demo ${ options.toolbar.title }">
	      <header class="matter-header">
	        <div class="matter-header-inner">
	          <h1 class="matter-demo-title">
	            <a href="${ options.toolbar.url }" target="_blank">${ options.toolbar.title } ↗</a>
	          </h1>
	          <div class="matter-toolbar">
	            <div class="matter-select-wrapper">
	              <select class="matter-example-select matter-select">
	                ${ exampleOptions }
	              </select>
	            </div>
	            <button class="matter-btn matter-btn-reset" title="Reset">↻&#xFE0E;</button>
	            <a href="#" class="matter-btn matter-btn-source" title="Source" target="_blank">{ }</a>
	            <button class="matter-btn matter-btn-tools" title="Tools">&#x1f527;&#xFE0E;</button>
	            <button class="matter-btn matter-btn-inspect" title="Inspect">&#8857;&#xFE0E;</button>
	            <button class="matter-btn matter-btn-fullscreen" title="Fullscreen">&#9633;&#xFE0E;</button>
	          </div>
	          <a class="matter-link" href="${ Demo._matterLink }" title="matter.js" target="_blank">
	            <i>▲</i><i>●</i><i>■</i>
	          </a>
	        </div>
	      </header>
	      <div class="matter-render"></div>
	      <style type="text/css">${ Demo._style }</style>
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
	    Demo._domRemove(dom.title);
	  }

	  if (!options.toolbar.exampleSelect) {
	    Demo._domRemove(dom.exampleSelect.parentElement);
	  }

	  if (!options.toolbar.reset) {
	    Demo._domRemove(dom.buttonReset);
	  }

	  if (!options.toolbar.source) {
	    Demo._domRemove(dom.buttonSource);
	  }

	  if (!options.toolbar.inspector) {
	    Demo._domRemove(dom.buttonInspect);
	  }

	  if (!options.toolbar.tools) {
	    Demo._domRemove(dom.buttonTools);
	  }

	  if (!options.toolbar.fullscreen) {
	    Demo._domRemove(dom.buttonFullscreen);
	  }

	  return dom;
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = "module.exports = \"/*\\n*\\tMatterTools.Demo\\n*/\\n\\n.matter-demo {\\n  display: flex;\\n  background: #14151f;\\n  align-items: center;\\n  justify-content: center;\\n  flex-direction: column;\\n  height: 100vh;\\n}\\n\\n.matter-demo canvas {\\n  border-radius: 8px;\\n  width: 100%;\\n}\\n\\n.matter-is-fullscreen .matter-demo {\\n  width: 100%;\\n}\\n\\n.matter-is-fullscreen .dg.ac,\\n.matter-is-fullscreen .ins-container {\\n  display: none;\\n}\\n\\n.matter-header {\\n  width: 100%;\\n  padding: 10px 10px;\\n  display: flex;\\n  align-items: center;\\n  justify-content: center;\\n}\\n\\n@media screen and (min-width: 500px) {\\n  .matter-header {\\n    padding: 10px 30px;\\n  }\\n}\\n\\n.matter-header-inner {\\n  display: flex;\\n  align-items: center;\\n  justify-content: space-between;\\n  max-width: 960px;\\n  width: 100%;\\n}\\n\\n.matter-header h1 {\\n  display: none;\\n  margin: 0;\\n  width: 18px;\\n  overflow: hidden;\\n}\\n\\n.matter-header h1 a {\\n  color: #f2f2f5;\\n  font-size: 15px;\\n  font-weight: 400;\\n  font-family: Helvetica, Arial, sans-serif;\\n  display: block;\\n  text-decoration: none;\\n  margin: 7px 0 0 0;\\n  padding: 0 0 2px 0;\\n  border-bottom: 2px solid transparent;\\n  white-space: nowrap;\\n  float: right;\\n}\\n\\n@media screen and (min-width: 300px) {\\n  .matter-header h1 {\\n    display: inline;\\n  }\\n}\\n\\n@media screen and (min-width: 600px) {\\n  .matter-header h1 {\\n    width: auto;\\n    overflow: visible;\\n  }\\n}\\n\\n.btn-home {\\n  display: none;\\n}\\n\\n.matter-header h1 a:hover {\\n  border-bottom: 2px solid #F5B862;\\n}\\n\\n.matter-link {\\n  font-family: Helvetica, Arial, sans-serif;\\n  text-decoration: none;\\n  line-height: 13px;\\n  transform: translate(0, 3px) scale(0.8);\\n}\\n\\n@media screen and (min-width: 500px) {\\n  .matter-link {\\n    transform: none;\\n  }\\n}\\n\\n.matter-link i {\\n  transition: transform 400ms ease;\\n}\\n\\n.matter-link:hover i {\\n  transition: transform 400ms ease;\\n}\\n\\n.matter-link:hover i:nth-child(1) {\\n  transform: rotate(-26deg) translate3d(-4px, -7px, 0);\\n}\\n\\n.matter-link i:nth-child(2) {\\n  transform: translate3d(0, 1px, 0);\\n}\\n\\n.matter-link:hover i:nth-child(2) {\\n  transition-delay: 80ms;\\n  transform: translate3d(3px, -5px, 0);\\n}\\n\\n.matter-link:hover i:nth-child(3) {\\n  transition-delay: 180ms;\\n  transform: translate3d(9px, 0, 0);\\n}\\n\\n.matter-link i:nth-child(1) {\\n  display: inline-block;\\n  color: #76F09B;\\n  font-size: 30px;\\n}\\n\\n.matter-link i:nth-child(2) {\\n  color: #F5B862;\\n  font-size: 16px;\\n  padding: 0 2px 0 0;\\n  display: inline-block;\\n}\\n\\n.matter-link i:nth-child(3) {\\n  display: inline-block;\\n  color: #F55F5F; \\n  font-size: 46px;\\n}\\n\\n.matter-toolbar {\\n  flex-grow: 1;\\n  display: flex;\\n  align-items: center;\\n  justify-content: center;\\n  margin: -6px 0 0 0;\\n}\\n\\n.matter-select {\\n  background: transparent;\\n  color: #fff;\\n  font-size: 14px;\\n  height: 30px;\\n  width: 100%;\\n  outline: none;\\n  padding: 0 7px;\\n  margin: 0 0 -6px 0;\\n  border: 0;\\n  border-bottom: 2px solid #3a3a3a;\\n  border-radius: 0;\\n  appearance: none;\\n  -webkit-appearance: none;\\n}\\n\\n.matter-select:hover {\\n  border-bottom-color: #F5B862;\\n}\\n\\n.matter-select-wrapper {\\n  width: 20%;\\n  min-width: 100px;\\n  max-width: 200px;\\n  position: relative;\\n  display: inline-block;\\n  margin: 0 6% 0 0;\\n}\\n\\n.matter-select-wrapper:hover:after {\\n  color: #fff;\\n}\\n\\n.matter-select-wrapper:after {\\n  content: '▾';\\n  display: block;\\n  pointer-events: none;\\n  color: #cecece;\\n  font-size: 14px;\\n  position: absolute;\\n  top: 6px;\\n  right: 5px;\\n}\\n\\n.matter-btn {\\n  border: 0;\\n  background: #0f0f13;\\n  color: transparent;\\n  padding: 0;\\n  width: 40px;\\n  height: 33px;\\n  border-radius: 2px;\\n  margin: 0 0 -6px 0;\\n  display: inline-block;\\n  font-size: 16px;\\n  line-height: 1;\\n  text-shadow: 0 0 0 #c2cad4;\\n  text-decoration: none;\\n}\\n\\n.matter-btn:focus {\\n  outline: 0;\\n}\\n\\n.matter-btn:hover {\\n  transform: translate(0px, -1px);\\n}\\n\\n.matter-btn:active {\\n  transform: translate(0px, 1px);\\n}\\n\\n.matter-btn:hover {\\n  background: #212a3a;\\n}\\n\\n.matter-btn-reset:active {\\n  text-shadow: 0 0 0 #76F09B;\\n}\\n\\n.matter-btn-tools {\\n  display: none;\\n  font-size: 11px;\\n  padding: 7px 13px 8px 10px;\\n}\\n\\n.matter-gui-active .matter-btn-tools {\\n  text-shadow: 0 0 0 #F55F5F;\\n}\\n\\n.matter-btn-inspect {\\n  display: none;\\n}\\n\\n.matter-inspect-active .matter-btn-inspect {\\n  text-shadow: 0 0 0 #fff036;\\n}\\n\\n.matter-btn-source {\\n  display: none;\\n  font-size: 13px;\\n  text-align: center;\\n  line-height: 33px;\\n}\\n\\n.matter-btn-source:active {\\n  color: #F5B862;\\n}\\n\\n.matter-btn-fullscreen {\\n  font-size: 27px;\\n}\\n\\n.matter-btn-source:active {\\n  color: #F5B862;\\n}\\n\\n.matter-is-fullscreen .matter-btn-tools,\\n.matter-is-fullscreen .matter-btn-inspect {\\n  display: none;\\n}\\n\\n.matter-is-fullscreen .matter-btn-fullscreen {\\n  color: #76F09B;\\n}\\n\\n@media screen and (min-width: 500px) {\\n  .matter-btn-tools,\\n  .matter-btn-inspect,\\n  .matter-btn-source {\\n    display: block;\\n  }\\n}\\n\\n/* \\n  MatterTools tweaks \\n  TODO: update MatterTools and remove\\n*/\\n\\n.gui-transitions .dg.a {\\n  margin-right: 0;\\n}\\n\\nbody.gui-auto-hide .dg.ac {\\n    right: -233px;\\n}\\n\\nbody .dg.ac:hover,\\nbody.gui-show .dg.ac {\\n    right: 0px;\\n}\\n\\nbody.gui-auto-hide.gui-transitions .dg.ac {\\n  -webkit-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n      -moz-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n        -o-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n          transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415);\\n\\n  -webkit-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n      -moz-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n        -o-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n          transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415);\\n  \\n  transition-delay: 3s;\\n  -webkit-transition-delay: 3s;\\n}\\n\\nbody.gui-transitions .dg.ac:hover,\\nbody.gui-show.gui-transitions .dg.ac {\\n  -webkit-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n      -moz-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n        -o-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n          transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835);\\n\\n  -webkit-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n      -moz-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n        -o-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n          transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835);\\n\\n  transition-delay: 0;\\n  -webkit-transition-delay: 0;\\n}\\n\\n.ins-auto-hide .ins-container {\\n    left: -245px;\\n    border-right: 1px dotted #888;\\n}\\n\\n.ins-container:hover,\\n.ins-show .ins-container {\\n    left: 0px;\\n    border-right: 0px dotted #888;\\n}\\n\\n.ins-transitions .ins-container {\\n    -webkit-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n        -moz-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n          -o-transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n            transition: all 500ms cubic-bezier(0.965, 0.025, 0.735, 0.415);\\n\\n    -webkit-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n        -moz-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n          -o-transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415); \\n            transition-timing-function: cubic-bezier(0.965, 0.025, 0.735, 0.415);\\n\\n    transition-delay: 3s;\\n    -webkit-transition-delay: 3s;\\n}\\n\\n.ins-transitions .ins-container:hover,\\n.ins-transitions.ins-show .ins-container {\\n    -webkit-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n        -moz-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n          -o-transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n            transition: all 500ms cubic-bezier(0.095, 0.665, 0.400, 0.835);\\n\\n    -webkit-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n        -moz-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n          -o-transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835); \\n            transition-timing-function: cubic-bezier(0.095, 0.665, 0.400, 0.835);\\n\\n    transition-delay: 0;\\n    -webkit-transition-delay: 0;\\n}\""

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	* See [Demo.js](https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js) 
	* and [DemoMobile.js](https://github.com/liabru/matter-js/blob/master/demo/js/DemoMobile.js) for usage examples.
	*
	* @class Gui
	*/

	var Gui = module.exports = {};

	const GIF = __webpack_require__(4);
	const dat = __webpack_require__(5);
	const jQuery = __webpack_require__(6);
	const $ = jQuery;
	const Inspector = __webpack_require__(7);
	const Resurrect = __webpack_require__(8);

	const Matter = __webpack_require__(9),
	      Body = Matter.Body,
	      Bounds = Matter.Bounds,
	      Example = Matter.Example,
	      Engine = Matter.Engine,
	      Detector = Matter.Detector,
	      Grid = Matter.Grid,
	      World = Matter.World,
	      Composite = Matter.Composite,
	      Common = Matter.Common,
	      Bodies = Matter.Bodies,
	      Events = Matter.Events,
	      Mouse = Matter.Mouse,
	      Query = Matter.Query,
	      Vertices = Matter.Vertices,
	      Vector = Matter.Vector,
	      MouseConstraint = Matter.MouseConstraint,
	      Runner = Matter.Runner,
	      Render = Matter.Render;

	var _isWebkit = 'WebkitAppearance' in document.documentElement.style;

	/**
	 * Description
	 * @method create
	 * @param {engine} engine
	 * @param {runner} runner
	 * @param {render} render
	 * @param {object} options
	 * @return {gui} A container for a configured dat.gui
	 */
	Gui.create = function (engine, runner, render, options) {
	  var _datGuiSupported = window.dat && window.localStorage;

	  if (!_datGuiSupported) {
	    console.log("Could not create GUI. Check dat.gui library is loaded first.");
	    return;
	  }

	  var datGui = new dat.GUI(options);

	  var gui = {
	    engine: engine,
	    runner: runner,
	    render: render,
	    datGui: datGui,
	    broadphase: 'grid',
	    broadphaseCache: {
	      grid: engine.broadphase.controller === Grid ? engine.broadphase : Grid.create(),
	      bruteForce: {
	        detector: Detector.bruteForce
	      }
	    },
	    amount: 1,
	    size: 40,
	    sides: 4,
	    density: 0.001,
	    restitution: 0,
	    friction: 0.1,
	    frictionStatic: 0.5,
	    frictionAir: 0.01,
	    offset: { x: 0, y: 0 },
	    renderer: 'canvas',
	    chamfer: 0,
	    isRecording: false
	  };

	  if (Resurrect) {
	    gui.serializer = new Resurrect({ prefix: '$', cleanup: true });
	    gui.serializer.parse = gui.serializer.resurrect;
	  }

	  _initDatGui(gui);
	  _initGif(gui);

	  return gui;
	};

	/**
	 * Description
	 * @method update
	 * @param {gui} gui
	 * @param {datGui} datGui
	 */
	Gui.update = function (gui, datGui) {
	  var i;
	  datGui = datGui || gui.datGui;

	  for (i in datGui.__folders) {
	    Gui.update(gui, datGui.__folders[i]);
	  }

	  for (i in datGui.__controllers) {
	    var controller = datGui.__controllers[i];
	    if (controller.updateDisplay) controller.updateDisplay();
	  }
	};

	/**
	 * Description
	 * @method closeAll
	 * @param {gui} gui
	 */
	Gui.closeAll = function (gui) {
	  var datGui = gui.datGui;

	  for (var i in datGui.__folders) {
	    datGui.__folders[i].close();
	  }
	};

	/**
	 * Saves world state to local storage
	 * @method saveState
	 * @param {object} serializer
	 * @param {engine} engine
	 * @param {string} key
	 */
	Gui.saveState = function (serializer, engine, key) {
	  if (localStorage && serializer) localStorage.setItem(key, Gui.serialise(serializer, engine.world));
	};

	/**
	 * Loads world state from local storage
	 * @method loadState
	 * @param {object} serializer
	 * @param {engine} engine
	 * @param {string} key
	 */
	Gui.loadState = function (serializer, engine, key) {
	  var loadedWorld;

	  if (localStorage && serializer) loadedWorld = serializer.parse(localStorage.getItem(key));

	  if (loadedWorld) Engine.merge(engine, { world: loadedWorld });
	};

	/**
	 * Serialises the object using the given serializer and a Matter-specific replacer
	 * @method serialise
	 * @param {object} serializer
	 * @param {object} object
	 * @param {number} indent
	 * @return {string} The serialised object
	 */
	Gui.serialise = function (serializer, object, indent) {
	  indent = indent || 0;
	  return serializer.stringify(object, function (key, value) {
	    // limit precision of floats
	    if (!/^#/.exec(key) && typeof value === 'number') {
	      var fixed = parseFloat(value.toFixed(3));

	      // do not limit if limiting will cause value to zero
	      // TODO: this should ideally dynamically find the SF precision required
	      if (fixed === 0 && value !== 0) return value;

	      return fixed;
	    }

	    return value;
	  }, indent);
	};

	/**
	 * Clones an object using a serializer and assigns it a new id
	 * @method serialise
	 * @param {object} serializer
	 * @param {object} object
	 * @param {number} indent
	 * @return {string} The serialised object
	 */
	Gui.clone = function (serializer, object) {
	  var clone = serializer.parse(Gui.serialise(serializer, object));
	  clone.id = Common.nextId();
	  return clone;
	};

	var _initDatGui = function (gui) {
	  var engine = gui.engine,
	      runner = gui.runner,
	      datGui = gui.datGui;

	  var funcs = {
	    addBody: function () {
	      _addBody(gui);
	    },
	    clear: function () {
	      _clear(gui);
	    },
	    save: function () {
	      Gui.saveState(gui.serializer, engine, 'guiState');Events.trigger(gui, 'save');
	    },
	    load: function () {
	      Gui.loadState(gui.serializer, engine, 'guiState');Events.trigger(gui, 'load');
	    },
	    inspect: function () {
	      if (!Inspector.instance) gui.inspector = Inspector.create(gui.engine, gui.runner, gui.render);
	    },
	    recordGif: function () {
	      if (!gui.isRecording) {
	        gui.gif = new GIF({
	          workers: 5,
	          quality: 100,
	          width: 800,
	          height: 600
	        });

	        gui.gif.on('finished', function (blob) {
	          if (_isWebkit) {
	            var anchor = document.createElement('a');
	            anchor.download = 'matter-tools-gif.gif';
	            anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
	            anchor.dataset.downloadurl = ['image/gif', anchor.download, anchor.href].join(':');
	            anchor.click();
	          } else {
	            window.open(URL.createObjectURL(blob));
	          }
	        });

	        gui.isRecording = true;
	      } else {
	        if (!gui.gif.running) {
	          gui.isRecording = false;
	          gui.gif.render();
	        }
	      }

	      setTimeout(function () {
	        if (gui.isRecording && !gui.gif.running) {
	          gui.gif.render();
	        }

	        gui.isRecording = false;
	      }, 5000);
	    }
	  };

	  var metrics = datGui.addFolder('Metrics');
	  metrics.add(runner, 'fps').listen();

	  if (engine.metrics.extended) {
	    metrics.add(runner, 'delta').listen();
	    metrics.add(runner, 'correction').listen();
	    metrics.add(engine.metrics, 'bodies').listen();
	    metrics.add(engine.metrics, 'collisions').listen();
	    metrics.add(engine.metrics, 'pairs').listen();
	    metrics.add(engine.metrics, 'broadEff').listen();
	    metrics.add(engine.metrics, 'midEff').listen();
	    metrics.add(engine.metrics, 'narrowEff').listen();
	    metrics.add(engine.metrics, 'narrowReuse').listen();
	    metrics.close();
	  } else {
	    metrics.open();
	  }

	  var controls = datGui.addFolder('Add Body');
	  controls.add(gui, 'amount', 1, 5).step(1);
	  controls.add(gui, 'size', 5, 150).step(1);
	  controls.add(gui, 'sides', 1, 8).step(1);
	  controls.add(gui, 'density', 0.0001, 0.01).step(0.001);
	  controls.add(gui, 'friction', 0, 1).step(0.05);
	  controls.add(gui, 'frictionStatic', 0, 10).step(0.1);
	  controls.add(gui, 'frictionAir', 0, gui.frictionAir * 10).step(gui.frictionAir / 10);
	  controls.add(gui, 'restitution', 0, 1).step(0.1);
	  controls.add(gui, 'chamfer', 0, 30).step(2);
	  controls.add(funcs, 'addBody');
	  controls.open();

	  var worldGui = datGui.addFolder('World');
	  worldGui.add(funcs, 'load');
	  worldGui.add(funcs, 'save');
	  worldGui.add(funcs, 'clear');
	  worldGui.open();

	  var toolsGui = datGui.addFolder('Tools');
	  toolsGui.add(funcs, 'inspect');
	  if (window.GIF) toolsGui.add(funcs, 'recordGif');
	  toolsGui.open();

	  var gravity = worldGui.addFolder('Gravity');
	  gravity.add(engine.world.gravity, 'x', -1, 1).step(0.01);
	  gravity.add(engine.world.gravity, 'y', -1, 1).step(0.01);
	  gravity.open();

	  var physics = datGui.addFolder('Engine');
	  physics.add(engine, 'enableSleeping');

	  physics.add(engine.timing, 'timeScale', 0, 1.2).step(0.05).listen();
	  physics.add(engine, 'velocityIterations', 1, 10).step(1);
	  physics.add(engine, 'positionIterations', 1, 10).step(1);
	  physics.add(runner, 'enabled');
	  physics.open();

	  var render = datGui.addFolder('Render');
	  render.add(gui.render.options, 'wireframes');
	  render.add(gui.render.options, 'showDebug');
	  render.add(gui.render.options, 'showPositions');
	  render.add(gui.render.options, 'showBroadphase');
	  render.add(gui.render.options, 'showBounds');
	  render.add(gui.render.options, 'showVelocity');
	  render.add(gui.render.options, 'showCollisions');
	  render.add(gui.render.options, 'showSeparations');
	  render.add(gui.render.options, 'showAxes');
	  render.add(gui.render.options, 'showAngleIndicator');
	  render.add(gui.render.options, 'showSleeping');
	  render.add(gui.render.options, 'showIds');
	  render.add(gui.render.options, 'showVertexNumbers');
	  render.add(gui.render.options, 'showConvexHulls');
	  render.add(gui.render.options, 'showInternalEdges');
	  render.add(gui.render.options, 'enabled');
	  render.open();
	};

	var _addBody = function (gui) {
	  var engine = gui.engine;

	  var options = {
	    density: gui.density,
	    friction: gui.friction,
	    frictionStatic: gui.frictionStatic,
	    frictionAir: gui.frictionAir,
	    restitution: gui.restitution
	  };

	  if (gui.chamfer && gui.sides > 2) {
	    options.chamfer = {
	      radius: gui.chamfer
	    };
	  }

	  for (var i = 0; i < gui.amount; i++) {
	    World.add(engine.world, Bodies.polygon(gui.offset.x + 120 + i * gui.size + i * 50, gui.offset.y + 200, gui.sides, gui.size, options));
	  }
	};

	var _clear = function (gui) {
	  var engine = gui.engine;

	  World.clear(engine.world, true);
	  Engine.clear(engine);

	  // clear scene graph (if defined in controller)
	  var renderController = gui.render.controller;
	  if (renderController.clear) renderController.clear(gui.render);

	  Events.trigger(gui, 'clear');
	};

	var _initGif = function (gui) {
	  if (!window.GIF) {
	    return;
	  }

	  var engine = gui.engine,
	      skipFrame = false;

	  Matter.Events.on(gui.runner, 'beforeTick', function (event) {
	    if (gui.isRecording && !skipFrame) {
	      gui.gif.addFrame(gui.render.context, { copy: true, delay: 25 });
	    }
	    skipFrame = !skipFrame;
	  });
	};

	/*
	*
	*  Events Documentation
	*
	*/

	/**
	* Fired after the gui's clear button pressed
	*
	* @event clear
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the gui's save button pressed
	*
	* @event save
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the gui's load button pressed
	*
	* @event load
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	* See [Demo.js](https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js) 
	* and [DemoMobile.js](https://github.com/liabru/matter-js/blob/master/demo/js/DemoMobile.js) for usage examples.
	*
	* @class Inspector
	*/

	var Inspector = module.exports = {};

	const Gui = __webpack_require__(3);
	const jQuery = __webpack_require__(6);
	const $ = jQuery;
	const Resurrect = __webpack_require__(8);

	const Matter = __webpack_require__(9),
	      Body = Matter.Body,
	      Bounds = Matter.Bounds,
	      Example = Matter.Example,
	      Engine = Matter.Engine,
	      World = Matter.World,
	      Composite = Matter.Composite,
	      Common = Matter.Common,
	      Bodies = Matter.Bodies,
	      Events = Matter.Events,
	      Mouse = Matter.Mouse,
	      Query = Matter.Query,
	      Vertices = Matter.Vertices,
	      Vector = Matter.Vector,
	      MouseConstraint = Matter.MouseConstraint,
	      Runner = Matter.Runner,
	      Render = Matter.Render;

	var _key,
	    _isWebkit = 'WebkitAppearance' in document.documentElement.style,
	    $body;

	/**
	 * Creates a new inspector tool and inserts it into the page. Requires keymaster, jQuery, jsTree libraries.
	 * @method create
	 * @param {engine} engine
	 * @param {runner} runner
	 * @param {render} render
	 * @param {object} options
	 * @return {inspector} An inspector
	 */
	Inspector.create = function (engine, runner, render, options) {
	  if (!jQuery || !$.fn.jstree || !window.key) {
	    console.log('Could not create inspector. Check keymaster, jQuery, jsTree libraries are loaded first.');
	    return;
	  }

	  var inspector = {
	    engine: null,
	    runner: null,
	    render: null,
	    isPaused: false,
	    selected: [],
	    selectStart: null,
	    selectEnd: null,
	    selectBounds: Bounds.create(),
	    mousePrevPosition: { x: 0, y: 0 },
	    offset: { x: 0, y: 0 },
	    autoHide: true,
	    autoRewind: true,
	    hasTransitions: _isWebkit ? true : false,
	    bodyClass: '',
	    exportIndent: 0,
	    clipboard: [],
	    controls: {
	      container: null,
	      worldTree: null
	    },
	    root: Composite.create({
	      label: 'Root'
	    })
	  };

	  inspector = Common.extend(inspector, options);
	  Inspector.instance = inspector;

	  inspector.engine = engine;
	  inspector.runner = runner;
	  inspector.render = render;

	  inspector.mouse = Mouse.create(inspector.render.canvas);
	  inspector.mouseConstraint = MouseConstraint.create(engine, { mouse: inspector.mouse });

	  inspector.serializer = new Resurrect({ prefix: '$', cleanup: true });
	  inspector.serializer.parse = inspector.serializer.resurrect;
	  localStorage.removeItem('pauseState');

	  $body = $('body');
	  $body.toggleClass('ins-auto-hide gui-auto-hide', inspector.autoHide);
	  $body.toggleClass('ins-transitions gui-transitions', inspector.hasTransitions);

	  Composite.add(inspector.root, engine.world);
	  engine.world.isModified = true;
	  engine.world.parent = null;
	  _key = window.key;

	  _initControls(inspector);
	  _initEngineEvents(inspector);
	  _initTree(inspector);
	  _initKeybinds(inspector);

	  return inspector;
	};

	var _initControls = function (inspector) {
	  var engine = inspector.engine,
	      controls = inspector.controls;

	  var $inspectorContainer = $('<div class="ins-container">'),
	      $buttonGroup = $('<div class="ins-control-group">'),
	      $searchBox = $('<input class="ins-search-box" type="search" placeholder="search">'),
	      $importButton = $('<button class="ins-import-button ins-button">Import</button>'),
	      $exportButton = $('<button class="ins-export-button ins-button">Export</button>'),
	      $pauseButton = $('<button class="ins-pause-button ins-button">Pause</button>'),
	      $helpButton = $('<button class="ins-help-button ins-button">Help</button>'),
	      $addCompositeButton = $('<button class="ins-add-button ins-button">+</button>');

	  $buttonGroup.append($pauseButton, $importButton, $exportButton, $helpButton);
	  $inspectorContainer.prepend($buttonGroup, $searchBox, $addCompositeButton);
	  $body.prepend($inspectorContainer);

	  controls.pauseButton = $pauseButton;
	  controls.importButton = $importButton;
	  controls.exportButton = $exportButton;
	  controls.helpButton = $helpButton;
	  controls.searchBox = $searchBox;
	  controls.container = $inspectorContainer;
	  controls.addCompositeButton = $addCompositeButton;

	  controls.pauseButton.click(function () {
	    _setPaused(inspector, !inspector.isPaused);
	  });

	  controls.exportButton.click(function () {
	    _exportFile(inspector);
	  });

	  controls.importButton.click(function () {
	    _importFile(inspector);
	  });

	  controls.helpButton.click(function () {
	    _showHelp(inspector);
	  });

	  controls.addCompositeButton.click(function () {
	    _addNewComposite(inspector);
	  });

	  var searchTimeout;
	  controls.searchBox.keyup(function () {
	    clearTimeout(searchTimeout);
	    searchTimeout = setTimeout(function () {
	      var value = controls.searchBox.val(),
	          worldTree = controls.worldTree.data('jstree');
	      worldTree.search(value);
	    }, 250);
	  });
	};

	var _showHelp = function (inspector) {
	  var help = "Matter Tools\n\n";

	  help += "Drag nodes in the tree to move them between composites.\n";
	  help += "Use browser's developer console to inspect selected objects.\n";
	  help += "Note: selections only render if renderer supports it.\n\n";

	  help += "[shift + space] pause or play simulation.\n";
	  help += "[right click] and drag on empty space to select a region.\n";
	  help += "[right click] and drag on an object to move it.\n";
	  help += "[right click + shift] and drag to move whole selection.\n\n";

	  help += "[ctrl-c] to copy selected world objects.\n";
	  help += "[ctrl-v] to paste copied world objects to mouse position.\n";
	  help += "[del] or [backspace] delete selected objects.\n\n";

	  help += "[shift + s] scale-xy selected objects with mouse or arrows.\n";
	  help += "[shift + s + d] scale-x selected objects with mouse or arrows.\n";
	  help += "[shift + s + f] scale-y selected objects with mouse or arrows.\n";
	  help += "[shift + r] rotate selected objects with mouse or arrows.\n\n";

	  help += "[shift + q] set selected objects as static (can't be undone).\n";
	  help += "[shift + i] import objects.\n";
	  help += "[shift + o] export selected objects.\n";
	  help += "[shift + h] toggle Matter.Gui.\n";
	  help += "[shift + y] toggle auto-hide.\n";
	  help += "[shift + r] toggle auto-rewind on play/pause.\n\n";

	  help += "[shift + j] show this help message.";

	  alert(help);
	};

	var _initKeybinds = function (inspector) {
	  var engine = inspector.engine,
	      controls = inspector.controls;

	  _key('shift+space', function () {
	    _setPaused(inspector, !inspector.isPaused);
	  });

	  _key('shift+o', function () {
	    _exportFile(inspector);
	  });

	  _key('shift+i', function () {
	    _importFile(inspector);
	  });

	  _key('shift+j', function () {
	    _showHelp(inspector);
	  });

	  _key('shift+y', function () {
	    inspector.autoHide = !inspector.autoHide;
	    $body.toggleClass('ins-auto-hide gui-auto-hide', inspector.autoHide);
	  });

	  _key('shift+r', function () {
	    inspector.autoRewind = !inspector.autoRewind;
	    if (!inspector.autoRewind) localStorage.removeItem('pauseState');
	  });

	  _key('shift+q', function () {
	    var worldTree = inspector.controls.worldTree.data('jstree');
	    for (var i = 0; i < inspector.selected.length; i++) {
	      var object = inspector.selected[i].data;
	      if (object.type === 'body' && !object.isStatic) Body.setStatic(object, true);
	    }
	  });

	  _key('del', function () {
	    _deleteSelectedObjects(inspector);
	  });

	  _key('backspace', function () {
	    _deleteSelectedObjects(inspector);
	  });

	  _key('ctrl+c', function () {
	    _copySelectedObjects(inspector);
	  });

	  _key('ctrl+v', function () {
	    _pasteSelectedObjects(inspector);
	  });

	  // prevent the backspace key from navigating back
	  // http://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back
	  $(document).unbind('keydown').bind('keydown', function (event) {
	    var doPrevent = false;
	    if (event.keyCode === 8) {
	      var d = event.srcElement || event.target;
	      if (d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT' || d.type.toUpperCase() === 'PASSWORD' || d.type.toUpperCase() === 'FILE' || d.type.toUpperCase() === 'EMAIL' || d.type.toUpperCase() === 'SEARCH') || d.tagName.toUpperCase() === 'TEXTAREA') {
	        doPrevent = d.readOnly || d.disabled;
	      } else {
	        doPrevent = true;
	      }
	    }

	    if (doPrevent) {
	      event.preventDefault();
	    }
	  });
	};

	var _initTree = function (inspector) {
	  var engine = inspector.engine,
	      controls = inspector.controls,
	      deferTimeout;

	  var worldTreeOptions = {
	    'core': {
	      'check_callback': true
	    },
	    'dnd': {
	      'copy': false
	    },
	    'search': {
	      'show_only_matches': true,
	      'fuzzy': false
	    },
	    'types': {
	      '#': {
	        'valid_children': []
	      },
	      'body': {
	        'valid_children': []
	      },
	      'constraint': {
	        'valid_children': []
	      },
	      'composite': {
	        'valid_children': []
	      },
	      'bodies': {
	        'valid_children': ['body']
	      },
	      'constraints': {
	        'valid_children': ['constraint']
	      },
	      'composites': {
	        'valid_children': ['composite']
	      }
	    },
	    'plugins': ['dnd', 'types', 'unique', 'search']
	  };

	  controls.worldTree = $('<div class="ins-world-tree">').jstree(worldTreeOptions);
	  controls.container.prepend(controls.worldTree);

	  controls.worldTree.on('changed.jstree', function (event, data) {
	    var selected = [],
	        worldTree = controls.worldTree.data('jstree');

	    if (data.action !== 'select_node') return;

	    // defer selection update until selection has finished propagating
	    clearTimeout(deferTimeout);
	    deferTimeout = setTimeout(function () {
	      data.selected = worldTree.get_selected();

	      for (var i = 0; i < data.selected.length; i++) {
	        var nodeId = data.selected[i],
	            objectType = nodeId.split('_')[0],
	            objectId = nodeId.split('_')[1],
	            worldObject = Composite.get(engine.world, objectId, objectType);

	        switch (objectType) {
	          case 'body':
	          case 'constraint':
	          case 'composite':
	            selected.push(worldObject);
	            break;
	        }
	      }

	      _setSelectedObjects(inspector, selected);
	    }, 1);
	  });

	  $(document).on('dnd_stop.vakata', function (event, data) {
	    var worldTree = controls.worldTree.data('jstree'),
	        nodes = data.data.nodes;

	    // handle drag and drop
	    // move items between composites
	    for (var i = 0; i < nodes.length; i++) {
	      var node = worldTree.get_node(nodes[i]),
	          parentNode = worldTree.get_node(worldTree.get_parent(nodes[i])),
	          prevCompositeId = node.data.compositeId,
	          newCompositeId = parentNode.data.compositeId;

	      if (prevCompositeId === newCompositeId) continue;

	      var nodeId = nodes[i],
	          objectType = nodeId.split('_')[0],
	          objectId = nodeId.split('_')[1],
	          worldObject = Composite.get(inspector.root, objectId, objectType),
	          prevComposite = Composite.get(inspector.root, prevCompositeId, 'composite'),
	          newComposite = Composite.get(inspector.root, newCompositeId, 'composite');

	      Composite.move(prevComposite, worldObject, newComposite);
	    }
	  });

	  controls.worldTree.on('dblclick.jstree', function (event, data) {
	    var worldTree = controls.worldTree.data('jstree'),
	        selected = worldTree.get_selected();

	    // select all children of double clicked node
	    for (var i = 0; i < selected.length; i++) {
	      var nodeId = selected[i],
	          objectType = nodeId.split('_')[0],
	          objectId = nodeId.split('_')[1],
	          worldObject = Composite.get(engine.world, objectId, objectType);

	      switch (objectType) {
	        case 'composite':
	        case 'composites':
	        case 'bodies':
	        case 'constraints':
	          var node = worldTree.get_node(nodeId),
	              children = worldTree.get_node(nodeId).children;

	          for (var j = 0; j < children.length; j++) worldTree.select_node(children[j], false);

	          break;
	      }
	    }
	  });
	};

	var _addBodyClass = function (inspector, classNames) {
	  // only apply changes to prevent DOM lag
	  if (inspector.bodyClass.indexOf(' ' + classNames) === -1) {
	    $body.addClass(classNames);
	    inspector.bodyClass = ' ' + $body.attr('class');
	  }
	};

	var _removeBodyClass = function (inspector, classNames) {
	  // only apply changes to prevent DOM lag
	  var updateRequired = false,
	      classes = classNames.split(' ');

	  for (var i = 0; i < classes.length; i++) {
	    updateRequired = inspector.bodyClass.indexOf(' ' + classes[i]) !== -1;
	    if (updateRequired) break;
	  }

	  if (updateRequired) {
	    $body.removeClass(classNames);
	    inspector.bodyClass = ' ' + $body.attr('class');
	  }
	};

	var _getMousePosition = function (inspector) {
	  return Vector.add(inspector.mouse.position, inspector.offset);
	};

	var _initEngineEvents = function (inspector) {
	  var engine = inspector.engine,
	      mouse = inspector.mouse,
	      mousePosition = _getMousePosition(inspector),
	      controls = inspector.controls;

	  Events.on(inspector.engine, 'beforeUpdate', function () {
	    // update mouse position reference
	    mousePosition = _getMousePosition(inspector);

	    var mouseDelta = mousePosition.x - inspector.mousePrevPosition.x,
	        keyDelta = _key.isPressed('up') + _key.isPressed('right') - _key.isPressed('down') - _key.isPressed('left'),
	        delta = mouseDelta + keyDelta;

	    // update interface when world changes
	    if (engine.world.isModified) {
	      var data = _generateCompositeTreeNode(inspector.root, null, true);
	      _updateTree(controls.worldTree.data('jstree'), data);
	      _setSelectedObjects(inspector, []);
	    }

	    // update region selection
	    if (inspector.selectStart !== null) {
	      inspector.selectEnd.x = mousePosition.x;
	      inspector.selectEnd.y = mousePosition.y;
	      Bounds.update(inspector.selectBounds, [inspector.selectStart, inspector.selectEnd]);
	    }

	    // rotate mode
	    if (_key.shift && _key.isPressed('r')) {
	      var rotateSpeed = 0.03,
	          angle = Math.max(-2, Math.min(2, delta)) * rotateSpeed;

	      _addBodyClass(inspector, 'ins-cursor-rotate');
	      _rotateSelectedObjects(inspector, angle);
	    } else {
	      _removeBodyClass(inspector, 'ins-cursor-rotate');
	    }

	    // scale mode
	    if (_key.shift && _key.isPressed('s')) {
	      var scaleSpeed = 0.02,
	          scale = 1 + Math.max(-2, Math.min(2, delta)) * scaleSpeed;

	      _addBodyClass(inspector, 'ins-cursor-scale');

	      var scaleX, scaleY;

	      if (_key.isPressed('d')) {
	        scaleX = scale;
	        scaleY = 1;
	      } else if (_key.isPressed('f')) {
	        scaleX = 1;
	        scaleY = scale;
	      } else {
	        scaleX = scaleY = scale;
	      }

	      _scaleSelectedObjects(inspector, scaleX, scaleY);
	    } else {
	      _removeBodyClass(inspector, 'ins-cursor-scale');
	    }

	    // translate mode
	    if (mouse.button === 2) {
	      _addBodyClass(inspector, 'ins-cursor-move');
	      _moveSelectedObjects(inspector, mousePosition.x, mousePosition.y);
	    } else {
	      _removeBodyClass(inspector, 'ins-cursor-move');
	    }

	    inspector.mousePrevPosition = Common.clone(mousePosition);
	  });

	  Events.on(inspector.mouseConstraint, 'mouseup', function (event) {
	    // select objects in region if making a region selection
	    if (inspector.selectStart !== null) {
	      var selected = Query.region(Composite.allBodies(engine.world), inspector.selectBounds);
	      _setSelectedObjects(inspector, selected);
	    }

	    // clear selection region
	    inspector.selectStart = null;
	    inspector.selectEnd = null;
	    Events.trigger(inspector, 'selectEnd');
	  });

	  Events.on(inspector.mouseConstraint, 'mousedown', function (event) {
	    var bodies = Composite.allBodies(engine.world),
	        constraints = Composite.allConstraints(engine.world),
	        isUnionSelect = _key.shift || _key.control,
	        worldTree = inspector.controls.worldTree.data('jstree'),
	        i;

	    if (mouse.button === 2) {
	      var hasSelected = false;

	      for (i = 0; i < bodies.length; i++) {
	        var body = bodies[i];

	        if (Bounds.contains(body.bounds, mousePosition) && Vertices.contains(body.vertices, mousePosition)) {

	          if (isUnionSelect) {
	            _addSelectedObject(inspector, body);
	          } else {
	            _setSelectedObjects(inspector, [body]);
	          }

	          hasSelected = true;
	          break;
	        }
	      }

	      if (!hasSelected) {
	        for (i = 0; i < constraints.length; i++) {
	          var constraint = constraints[i],
	              bodyA = constraint.bodyA,
	              bodyB = constraint.bodyB;

	          if (constraint.label.indexOf('Mouse Constraint') !== -1) continue;

	          var pointAWorld = constraint.pointA,
	              pointBWorld = constraint.pointB;

	          if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
	          if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

	          if (!pointAWorld || !pointBWorld) continue;

	          var distA = Vector.magnitudeSquared(Vector.sub(mousePosition, pointAWorld)),
	              distB = Vector.magnitudeSquared(Vector.sub(mousePosition, pointBWorld));

	          if (distA < 100 || distB < 100) {
	            if (isUnionSelect) {
	              _addSelectedObject(inspector, constraint);
	            } else {
	              _setSelectedObjects(inspector, [constraint]);
	            }

	            hasSelected = true;
	            break;
	          }
	        }

	        if (!hasSelected) {
	          worldTree.deselect_all(true);
	          _setSelectedObjects(inspector, []);

	          inspector.selectStart = Common.clone(mousePosition);
	          inspector.selectEnd = Common.clone(mousePosition);
	          Bounds.update(inspector.selectBounds, [inspector.selectStart, inspector.selectEnd]);

	          Events.trigger(inspector, 'selectStart');
	        } else {
	          inspector.selectStart = null;
	          inspector.selectEnd = null;
	        }
	      }
	    }

	    if (mouse.button === 2 && inspector.selected.length > 0) {
	      _addBodyClass(inspector, 'ins-cursor-move');

	      _updateSelectedMouseDownOffset(inspector);
	    }
	  });

	  // render hook
	  Events.on(inspector.render, 'afterRender', function () {
	    var renderController = inspector.render.controller,
	        context = inspector.render.context;
	    if (renderController.inspector) renderController.inspector(inspector, context);
	  });
	};

	var _deleteSelectedObjects = function (inspector) {
	  var objects = [],
	      object,
	      worldTree = inspector.controls.worldTree.data('jstree'),
	      i;

	  // delete objects in world
	  for (i = 0; i < inspector.selected.length; i++) {
	    object = inspector.selected[i].data;
	    if (object !== inspector.engine.world) objects.push(object);
	  }

	  // also delete non-world composites (selected only in the UI tree)
	  var selectedNodes = worldTree.get_selected();
	  for (i = 0; i < selectedNodes.length; i++) {
	    var node = worldTree.get_node(selectedNodes[i]);
	    if (node.type === 'composite') {
	      node = worldTree.get_node(node.children[0]);
	      if (node.data) {
	        var compositeId = node.data.compositeId;
	        object = Composite.get(inspector.root, compositeId, 'composite');
	        if (object && object !== inspector.engine.world) {
	          objects.push(object);
	          worldTree.delete_node(selectedNodes[i]);
	        }
	      }
	    }
	  }

	  Composite.remove(inspector.root, objects, true);
	  _setSelectedObjects(inspector, []);
	};

	var _copySelectedObjects = function (inspector) {
	  inspector.clipboard.length = 0;

	  // put selected objects into clipboard
	  for (var i = 0; i < inspector.selected.length; i++) {
	    var object = inspector.selected[i].data;

	    if (object.type !== 'body') continue;

	    inspector.clipboard.push(object);
	  }
	};

	var _pasteSelectedObjects = function (inspector) {
	  var objects = [],
	      worldTree = inspector.controls.worldTree.data('jstree');

	  // copy objects in world
	  for (var i = 0; i < inspector.clipboard.length; i++) {
	    var object = inspector.clipboard[i],
	        clone = Gui.clone(inspector.serializer, object);
	    Body.translate(clone, { x: 50, y: 50 });

	    // add the clone to the same composite as original
	    var node = worldTree.get_node(object.type + '_' + object.id, false),
	        compositeId = node.data.compositeId,
	        composite = Composite.get(inspector.engine.world, compositeId, 'composite');

	    Composite.add(composite, clone);

	    objects.push(clone);
	  }

	  // select clones after waiting for tree to update
	  setTimeout(function () {
	    _setSelectedObjects(inspector, objects);
	  }, 200);
	};

	var _updateSelectedMouseDownOffset = function (inspector) {
	  var selected = inspector.selected,
	      mouse = inspector.mouse,
	      mousePosition = _getMousePosition(inspector),
	      item,
	      data;

	  for (var i = 0; i < selected.length; i++) {
	    item = selected[i];
	    data = item.data;

	    if (data.position) {
	      item.mousedownOffset = {
	        x: mousePosition.x - data.position.x,
	        y: mousePosition.y - data.position.y
	      };
	    } else if (data.pointA && !data.bodyA) {
	      item.mousedownOffset = {
	        x: mousePosition.x - data.pointA.x,
	        y: mousePosition.y - data.pointA.y
	      };
	    } else if (data.pointB && !data.bodyB) {
	      item.mousedownOffset = {
	        x: mousePosition.x - data.pointB.x,
	        y: mousePosition.y - data.pointB.y
	      };
	    }
	  }
	};

	var _moveSelectedObjects = function (inspector, x, y) {
	  var selected = inspector.selected,
	      mouse = inspector.mouse,
	      mousePosition = _getMousePosition(inspector),
	      item,
	      data;

	  for (var i = 0; i < selected.length; i++) {
	    item = selected[i];
	    data = item.data;

	    if (!item.mousedownOffset) continue;

	    switch (data.type) {

	      case 'body':
	        var delta = {
	          x: x - data.position.x - item.mousedownOffset.x,
	          y: y - data.position.y - item.mousedownOffset.y
	        };

	        Body.translate(data, delta);
	        data.positionPrev.x = data.position.x;
	        data.positionPrev.y = data.position.y;

	        break;

	      case 'constraint':
	        var point = data.pointA;
	        if (data.bodyA) point = data.pointB;

	        point.x = x - item.mousedownOffset.x;
	        point.y = y - item.mousedownOffset.y;

	        var initialPointA = data.bodyA ? Vector.add(data.bodyA.position, data.pointA) : data.pointA,
	            initialPointB = data.bodyB ? Vector.add(data.bodyB.position, data.pointB) : data.pointB;

	        data.length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));

	        break;

	    }
	  }
	};

	var _scaleSelectedObjects = function (inspector, scaleX, scaleY) {
	  var selected = inspector.selected,
	      item,
	      data;

	  for (var i = 0; i < selected.length; i++) {
	    item = selected[i];
	    data = item.data;

	    switch (data.type) {
	      case 'body':
	        Body.scale(data, scaleX, scaleY, data.position);

	        if (data.circleRadius) data.circleRadius *= scaleX;

	        break;
	    }
	  }
	};

	var _rotateSelectedObjects = function (inspector, angle) {
	  var selected = inspector.selected,
	      item,
	      data;

	  for (var i = 0; i < selected.length; i++) {
	    item = selected[i];
	    data = item.data;

	    switch (data.type) {
	      case 'body':
	        Body.rotate(data, angle);
	        break;
	    }
	  }
	};

	var _setPaused = function (inspector, isPaused) {
	  if (isPaused) {
	    if (inspector.autoRewind) {
	      _setSelectedObjects(inspector, []);
	      Gui.loadState(inspector.serializer, inspector.engine, 'pauseState');
	    }

	    inspector.engine.timing.timeScale = 0;
	    inspector.isPaused = true;
	    inspector.controls.pauseButton.text('Play');

	    Events.trigger(inspector, 'paused');
	  } else {
	    if (inspector.autoRewind) {
	      Gui.saveState(inspector.serializer, inspector.engine, 'pauseState');
	    }

	    inspector.engine.timing.timeScale = 1;
	    inspector.isPaused = false;
	    inspector.controls.pauseButton.text('Pause');

	    Events.trigger(inspector, 'play');
	  }
	};

	var _setSelectedObjects = function (inspector, objects) {
	  var worldTree = inspector.controls.worldTree.data('jstree'),
	      selectedItems = [],
	      data,
	      i;

	  for (i = 0; i < inspector.selected.length; i++) {
	    data = inspector.selected[i].data;
	    worldTree.deselect_node(data.type + '_' + data.id, true);
	  }

	  inspector.selected = [];
	  console.clear();

	  for (i = 0; i < objects.length; i++) {
	    data = objects[i];

	    if (data) {
	      // add the object to the selection
	      _addSelectedObject(inspector, data);

	      // log selected objects to console for property inspection
	      if (i < 5) {
	        console.log(data.label + ' ' + data.id + ': %O', data);
	      } else if (i === 6) {
	        console.warn('Omitted inspecting ' + (objects.length - 5) + ' more objects');
	      }
	    }
	  }
	};

	var _addSelectedObject = function (inspector, object) {
	  if (!object) return;

	  var worldTree = inspector.controls.worldTree.data('jstree');
	  inspector.selected.push({ data: object });
	  worldTree.select_node(object.type + '_' + object.id, true);
	};

	var _updateTree = function (tree, data) {
	  data[0].state = data[0].state || { opened: true };
	  tree.settings.core.data = data;
	  tree.refresh(-1);
	};

	var _generateCompositeTreeNode = function (composite, compositeId, isRoot) {
	  var children = [],
	      node = {
	    id: 'composite_' + composite.id,
	    data: {
	      compositeId: compositeId
	    },
	    type: 'composite',
	    text: (composite.label ? composite.label : 'Composite') + ' ' + composite.id,
	    'li_attr': {
	      'class': 'jstree-node-type-composite'
	    }
	  };

	  var childNode = _generateCompositesTreeNode(composite.composites, composite.id);
	  childNode.id = 'composites_' + composite.id;
	  children.push(childNode);

	  if (isRoot) return childNode.children;

	  childNode = _generateBodiesTreeNode(composite.bodies, composite.id);
	  childNode.id = 'bodies_' + composite.id;
	  children.push(childNode);

	  childNode = _generateConstraintsTreeNode(composite.constraints, composite.id);
	  childNode.id = 'constraints_' + composite.id;
	  children.push(childNode);

	  node.children = children;

	  return node;
	};

	var _generateCompositesTreeNode = function (composites, compositeId) {
	  var node = {
	    type: 'composites',
	    text: 'Composites',
	    data: {
	      compositeId: compositeId
	    },
	    children: [],
	    'li_attr': {
	      'class': 'jstree-node-type-composites'
	    }
	  };

	  for (var i = 0; i < composites.length; i++) {
	    var composite = composites[i];
	    node.children.push(_generateCompositeTreeNode(composite, compositeId));
	  }

	  return node;
	};

	var _generateBodiesTreeNode = function (bodies, compositeId) {
	  var node = {
	    type: 'bodies',
	    text: 'Bodies',
	    data: {
	      compositeId: compositeId
	    },
	    children: [],
	    'li_attr': {
	      'class': 'jstree-node-type-bodies'
	    }
	  };

	  for (var i = 0; i < bodies.length; i++) {
	    var body = bodies[i];
	    node.children.push({
	      type: 'body',
	      id: 'body_' + body.id,
	      data: {
	        compositeId: compositeId
	      },
	      text: (body.label ? body.label : 'Body') + ' ' + body.id,
	      'li_attr': {
	        'class': 'jstree-node-type-body'
	      }
	    });
	  }

	  return node;
	};

	var _generateConstraintsTreeNode = function (constraints, compositeId) {
	  var node = {
	    type: 'constraints',
	    text: 'Constraints',
	    data: {
	      compositeId: compositeId
	    },
	    children: [],
	    'li_attr': {
	      'class': 'jstree-node-type-constraints'
	    }
	  };

	  for (var i = 0; i < constraints.length; i++) {
	    var constraint = constraints[i];
	    node.children.push({
	      type: 'constraint',
	      id: 'constraint_' + constraint.id,
	      data: {
	        compositeId: compositeId
	      },
	      text: (constraint.label ? constraint.label : 'Constraint') + ' ' + constraint.id,
	      'li_attr': {
	        'class': 'jstree-node-type-constraint'
	      }
	    });
	  }

	  return node;
	};

	var _addNewComposite = function (inspector) {
	  var newComposite = Composite.create();

	  Composite.add(inspector.root, newComposite);

	  // move new composite to the start so that it appears top of tree
	  inspector.root.composites.splice(inspector.root.composites.length - 1, 1);
	  inspector.root.composites.unshift(newComposite);

	  Composite.setModified(inspector.engine.world, true, true, false);
	};

	var _exportFile = function (inspector) {
	  var engine = inspector.engine,
	      toExport = [];

	  if (inspector.selected.length === 0) {
	    alert('No objects were selected, so export could not be created. Can only export objects that are in the World composite.');
	    return;
	  }

	  var fileName = 'export-objects',
	      exportComposite = Composite.create({
	    label: 'Exported Objects'
	  });

	  // add everything else, must be in top-down order
	  for (var i = 0; i < inspector.selected.length; i++) {
	    var object = inspector.selected[i].data;

	    // skip if it's already in the composite tree
	    // this means orphans will be added in the root
	    if (Composite.get(exportComposite, object.id, object.type)) continue;

	    Composite.add(exportComposite, object);

	    // better filename for small exports
	    if (inspector.selected.length === 1) fileName = 'export-' + object.label + '-' + object.id;
	  }

	  // santise filename
	  fileName = fileName.toLowerCase().replace(/[^\w\-]/g, '') + '.json';

	  // serialise
	  var json = Gui.serialise(inspector.serializer, exportComposite, inspector.exportIndent);

	  // launch export download
	  if (_isWebkit) {
	    var blob = new Blob([json], { type: 'application/json' }),
	        anchor = document.createElement('a');
	    anchor.download = fileName;
	    anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
	    anchor.dataset.downloadurl = ['application/json', anchor.download, anchor.href].join(':');
	    anchor.click();
	  } else {
	    window.open('data:application/json;charset=utf-8,' + escape(json));
	  }

	  Events.trigger(inspector, 'export');
	};

	var _importFile = function (inspector) {
	  var engine = inspector.engine,
	      element = document.createElement('div'),
	      fileInput;

	  element.innerHTML = '<input type="file">';
	  fileInput = element.firstChild;

	  fileInput.addEventListener('change', function (e) {
	    var file = fileInput.files[0];

	    if (file.name.match(/\.(txt|json)$/)) {
	      var reader = new FileReader();

	      reader.onload = function (e) {
	        var importedComposite = inspector.serializer.parse(reader.result);

	        if (importedComposite) {
	          importedComposite.label = 'Imported Objects';

	          Composite.rebase(importedComposite);
	          Composite.add(inspector.root, importedComposite);

	          // move imported composite to the start so that it appears top of tree
	          inspector.root.composites.splice(inspector.root.composites.length - 1, 1);
	          inspector.root.composites.unshift(importedComposite);

	          var worldTree = inspector.controls.worldTree.data('jstree'),
	              data = _generateCompositeTreeNode(inspector.root, null, true);
	          _updateTree(worldTree, data);
	        }
	      };

	      reader.readAsText(file);
	    } else {
	      alert('File not supported, .json or .txt JSON files only');
	    }
	  });

	  fileInput.click();
	};

	/*
	*
	*  Events Documentation
	*
	*/

	/**
	* Fired after the inspector's import button pressed
	*
	* @event export
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the inspector's export button pressed
	*
	* @event import
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the inspector user starts making a selection
	*
	* @event selectStart
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the inspector user ends making a selection
	*
	* @event selectEnd
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the inspector is paused
	*
	* @event pause
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

	/**
	* Fired after the inspector is played
	*
	* @event play
	* @param {} event An event object
	* @param {} event.source The source object of the event
	* @param {} event.name The name of the event
	*/

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_8__;

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ }
/******/ ])
});
;