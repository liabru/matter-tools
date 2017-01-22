

<!-- Start index.js -->

## exports

<!-- End index.js -->

<!-- Start webpack.config.js -->

<!-- End webpack.config.js -->

<!-- Start src/tools/Common.js -->

## Common

<!-- End src/tools/Common.js -->

<!-- Start src/tools/Demo.js -->

## Matter

A tool for for running and testing example scenes.

## Demo.create({})

Creates a new demo instance.
See example for options and usage.

### Params:

* *{}* options

## Demo.start(demo, [initalExampleId])

Starts a new demo instance by running the first or given example.
See example for options and usage.

### Params:

* **demo** *demo* 
* **string** *[initalExampleId]* example to start (defaults to first)

## Demo.stop(demo)

Stops the currently running example in the demo.
This requires that the `example.init` function returned 
an object specifiying a `stop` function.

### Params:

* **demo** *demo* 

## Demo.reset(demo)

Stops and restarts the currently running example.

### Params:

* **demo** *demo* 

## Demo.setExampleById(demo, exampleId)

Starts the given example by its id. 
Any running example will be stopped.

### Params:

* **demo** *demo* 
* **string** *exampleId* 

## Demo.setExample(demo, example)

Starts the given example.
Any running example will be stopped.

### Params:

* **demo** *demo* 
* **example** *example* 

## Demo.setInspector(demo, enabled)

Enables or disables the inspector tool.
If `enabled` a new `Inspector` instance will be created and the old one destroyed.

### Params:

* **demo** *demo* 
* **bool** *enabled* 

## Demo.setGui(demo, enabled)

Enables or disables the Gui tool.
If `enabled` a new `Gui` instance will be created and the old one destroyed.

### Params:

* **demo** *demo* 
* **bool** *enabled* 

<!-- End src/tools/Demo.js -->

<!-- Start src/tools/Gui.js -->

## Gui

A tool for modifying the properties of an engine and renderer.

## Gui.create([engine], [runner], [render])

Creates a Gui

### Params:

* **engine** *[engine]* 
* **runner** *[runner]* 
* **render** *[render]* 

### Return:

* **gui** The created gui instance

## Gui.update(gui)

Updates the Gui

### Params:

* **gui** *gui* 

## Gui.closeAll(gui)

Closes all sections of the Gui

### Params:

* **gui** *gui* 

## Gui.destroy(gui)

Destroys the GUI

### Params:

* **gui** *gui* 

Events Documentation

Fired after the gui's clear button pressed

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the gui's save button pressed

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the gui's load button pressed

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

<!-- End src/tools/Gui.js -->

<!-- Start src/tools/Inspector.js -->

## Inspector

A tool for inspecting worlds.

## Gui.create(engine, [render], options)

Creates an inspector

### Params:

* **engine** *engine* 
* **render** *[render]* 
* **object** *options* 

### Return:

* **inspector** The created inspector instance.

## Gui.destroy(inspector)

Destroys the inspector

### Params:

* **Inspector** *inspector* 

Events Documentation

Fired after the inspector's import button pressed

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the inspector's export button pressed

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the inspector user starts making a selection

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the inspector user ends making a selection

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the inspector is paused

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

Fired after the inspector is played

### Params:

* *{}* event An event object
* *{}* event.source The source object of the event
* *{}* event.name The name of the event

<!-- End src/tools/Inspector.js -->

<!-- Start src/tools/Serializer.js -->

## Serializer

An (experimental) tool for serializing matter.js worlds.

## Serializer.create()

Creates a serializer.

### Return:

* {} A serializer

## Serializer.clone(serializer, object)

Clones an object using a serializer and assigns it a new id

### Params:

* **object** *serializer* 
* **object** *object* 

### Return:

* {} The clone

## Serializer.saveState(serializer, engine, key)

Saves world state to local storage

### Params:

* **object** *serializer* 
* **engine** *engine* 
* **string** *key* 

## Serializer.loadState(serializer, engine, key)

Loads world state from local storage

### Params:

* **object** *serializer* 
* **engine** *engine* 
* **string** *key* 

## Serializer.serialise(serializer, object, indent)

Serialises the object using the given serializer and a Matter-specific replacer

### Params:

* **object** *serializer* 
* **object** *object* 
* **number** *indent* 

### Return:

* **string** The serialised object

<!-- End src/tools/Serializer.js -->

