/**
* See [Demo.js](https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js) 
* and [DemoMobile.js](https://github.com/liabru/matter-js/blob/master/demo/js/DemoMobile.js) for usage examples.
*
* @class Gui
*/

var Gui = {};

(function() {

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
    Gui.create = function(engine, runner, render, options) {
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
    Gui.update = function(gui, datGui) {
        var i;
        datGui = datGui || gui.datGui;
        
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
     * Description
     * @method closeAll
     * @param {gui} gui
     */
    Gui.closeAll = function(gui) {
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
    Gui.saveState = function(serializer, engine, key) {
        if (localStorage && serializer)
            localStorage.setItem(key, Gui.serialise(serializer, engine.world));
    };

    /**
     * Loads world state from local storage
     * @method loadState
     * @param {object} serializer
     * @param {engine} engine
     * @param {string} key
     */
    Gui.loadState = function(serializer, engine, key) {
        var loadedWorld;

        if (localStorage && serializer)
            loadedWorld = serializer.parse(localStorage.getItem(key));

        if (loadedWorld)
            Engine.merge(engine, { world: loadedWorld });
    };

    /**
     * Serialises the object using the given serializer and a Matter-specific replacer
     * @method serialise
     * @param {object} serializer
     * @param {object} object
     * @param {number} indent
     * @return {string} The serialised object
     */
    Gui.serialise = function(serializer, object, indent) {
        indent = indent || 0;
        return serializer.stringify(object, function(key, value) {
            // limit precision of floats
            if (!/^#/.exec(key) && typeof value === 'number') {
                var fixed = parseFloat(value.toFixed(3));

                // do not limit if limiting will cause value to zero
                // TODO: this should ideally dynamically find the SF precision required
                if (fixed === 0 && value !== 0)
                    return value;

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
    Gui.clone = function(serializer, object) {
        var clone = serializer.parse(Gui.serialise(serializer, object));
        clone.id = Common.nextId();
        return clone;
    };

    var _initDatGui = function(gui) {
        var engine = gui.engine,
            runner = gui.runner,
            datGui = gui.datGui;

        var funcs = {
            addBody: function() { _addBody(gui); },
            clear: function() { _clear(gui); },
            save: function() { Gui.saveState(gui.serializer, engine, 'guiState'); Events.trigger(gui, 'save'); },
            load: function() { Gui.loadState(gui.serializer, engine, 'guiState'); Events.trigger(gui, 'load'); },
            inspect: function() { 
                if (!Inspector.instance)
                    gui.inspector = Inspector.create(gui.engine, gui.runner, gui.render); 
            },
            recordGif: function() {
                if (!gui.isRecording) {
                    gui.gif = new GIF({
                        workers: 5,
                        quality: 100,
                        width: 800,
                        height: 600
                    });

                    gui.gif.on('finished', function(blob) {
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

                setTimeout(function() {
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
        var engine = gui.engine;

        World.clear(engine.world, true);
        Engine.clear(engine);

        // clear scene graph (if defined in controller)
        var renderController = gui.render.controller;
        if (renderController.clear)
            renderController.clear(gui.render);

        Events.trigger(gui, 'clear');
    };

    var _initGif = function(gui) {
        if (!window.GIF) {
            return;
        }

        var engine = gui.engine,
            skipFrame = false;

        Matter.Events.on(gui.runner, 'beforeTick', function(event) {
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

})();