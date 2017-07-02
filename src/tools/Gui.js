"use strict";

/**
 * A tool for modifying the properties of an engine and renderer.
 * @module Gui
 */

var Gui = module.exports = {};

const dat = require('../../node_modules/dat.gui/build/dat.gui.min');
const ToolsCommon = require('./Common');
const Serializer = require('matter-tools').Serializer;
const Matter = require('matter-js');
const Engine = Matter.Engine;
const Detector = Matter.Detector;
const Grid = Matter.Grid;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;
const Composite = Matter.Composite;

/**
 * Creates a Gui
 * @function Gui.create
 * @param {engine} [engine]
 * @param {runner} [runner]
 * @param {render} [render]
 * @return {gui} The created gui instance
 */
Gui.create = function(engine, runner, render) {
  dat.GUI.TEXT_CLOSED = '▲';
  dat.GUI.TEXT_OPEN = '▼';

  var datGui = new dat.GUI({ autoPlace: false });

  var gui = {
    engine: engine,
    runner: runner,
    render: render,
    datGui: datGui,
    broadphase: 'grid',
    broadphaseCache: {
      grid: (engine.broadphase.controller === Grid) ? engine.broadphase : Grid.create(),
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
  
  if (Serializer) {
    gui.serializer = Serializer.create();
  }

  let styles = require('../styles/gui.css');
  ToolsCommon.injectStyles(styles, 'matter-gui-style');

  _initDatGui(gui);

  return gui;
};

/**
 * Updates the Gui
 * @function Gui.update
 * @param {gui} gui
 */
Gui.update = function(gui) {
  var i;
  var datGui = gui.datGui;
  
  for (i in datGui.__folders) {
    Gui.update(gui, datGui.__folders[i]);
  }
  
  for (i in datGui.__controllers) {
    var controller = datGui.__controllers[i];
    if (controller.updateDisplay)
      controller.updateDisplay();
  }
};

/**
 * Closes all sections of the Gui
 * @function Gui.closeAll
 * @param {gui} gui
 */
Gui.closeAll = function(gui) {
  var datGui = gui.datGui;
  
  for (var i in datGui.__folders) {
    datGui.__folders[i].close();
  }
};

/**
 * Destroys the GUI
 * @function Gui.destroy
 * @param {gui} gui
 */
Gui.destroy = function(gui) {
  gui.datGui.domElement.parentElement.removeChild(gui.datGui.domElement);
  gui.datGui.destroy();
};

var _initDatGui = function(gui) {
  var engine = gui.engine,
    runner = gui.runner,
    datGui = gui.datGui;

  var funcs = {
    addBody: function() { _addBody(gui); },
    clear: function() { _clear(gui); },
    save: function() { Serializer.saveState(gui.serializer, engine, 'guiState'); Events.trigger(gui, 'save'); },
    load: function() { Serializer.loadState(gui.serializer, engine, 'guiState'); Events.trigger(gui, 'load'); }
  };

  var metrics = datGui.addFolder('Metrics');

  if (runner) {
    metrics.add(runner, 'fps').listen();
  }

  if (engine.metrics.extended) {
    if (runner) {
      metrics.add(runner, 'delta').listen();
      metrics.add(runner, 'correction').listen();
    }

    if (engine) {
      metrics.add(engine.metrics, 'bodies').listen();
      metrics.add(engine.metrics, 'collisions').listen();
      metrics.add(engine.metrics, 'pairs').listen();
      metrics.add(engine.metrics, 'broadEff').listen();
      metrics.add(engine.metrics, 'midEff').listen();
      metrics.add(engine.metrics, 'narrowEff').listen();
      metrics.add(engine.metrics, 'narrowReuse').listen();
    }
    metrics.close();
  } else {
    metrics.open();
  }

  if (engine) {
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

    if (gui.serializer) {
      worldGui.add(funcs, 'load');
      worldGui.add(funcs, 'save');
    }

    worldGui.add(funcs, 'clear');
    worldGui.open();
    
    var gravity = worldGui.addFolder('Gravity');
    gravity.add(engine.world.gravity, 'scale', 0, 0.001).step(0.0001);
    gravity.add(engine.world.gravity, 'x', -1, 1).step(0.01);
    gravity.add(engine.world.gravity, 'y', -1, 1).step(0.01);
    gravity.open();

    var physics = datGui.addFolder('Engine');
    physics.add(engine, 'enableSleeping');

    physics.add(engine.timing, 'timeScale', 0, 1.2).step(0.05).listen();
    physics.add(engine, 'velocityIterations', 1, 10).step(1);
    physics.add(engine, 'positionIterations', 1, 10).step(1);
    physics.add(engine, 'constraintIterations', 1, 10).step(1);

    if (runner) {
      physics.add(runner, 'enabled');
    }

    physics.open();
  }

  if (gui.render) {
    var render = datGui.addFolder('Render');

    render
      .add(gui.render.options, 'wireframes')
      .onFinishChange(function(value) {
        if (!value) {
          angleIndicatorWidget.setValue(false);
          axesWidget.setValue(false);
        }
      });

    render.add(gui.render.options, 'showDebug');
    render.add(gui.render.options, 'showPositions');
    render.add(gui.render.options, 'showBroadphase');
    render.add(gui.render.options, 'showBounds');
    render.add(gui.render.options, 'showVelocity');
    render.add(gui.render.options, 'showCollisions');
    render.add(gui.render.options, 'showSeparations');
    var axesWidget = render.add(gui.render.options, 'showAxes');
    var angleIndicatorWidget = render.add(gui.render.options, 'showAngleIndicator');
    render.add(gui.render.options, 'showSleeping');
    render.add(gui.render.options, 'showIds');
    render.add(gui.render.options, 'showVertexNumbers');
    render.add(gui.render.options, 'showConvexHulls');
    render.add(gui.render.options, 'showInternalEdges');
    render.add(gui.render.options, 'enabled');
    render.open();
  }

  document.body.appendChild(gui.datGui.domElement);
};

var _addBody = function(gui) {
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

var _clear = function(gui) {
  var engine = gui.engine,
    constraints = Composite.allConstraints(engine.world),
    mouseConstraint = null;

  // find mouse constraints
  for (var i = 0; i < constraints.length; i += 1) {
    var constraint = constraints[i];

    // TODO: need a better way than this
    if (constraint.label === 'Mouse Constraint') {
      mouseConstraint = constraint;
      break;
    }
  }
  
  World.clear(engine.world, true);
  Engine.clear(engine);

  // add mouse constraint back in
  if (mouseConstraint) {
    Composite.add(engine.world, mouseConstraint);
  }

  // clear scene graph (if defined in controller)
  if (gui.render) {
    var renderController = gui.render.controller;
    if (renderController.clear)
      renderController.clear(gui.render);
  }

  Events.trigger(gui, 'clear');
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