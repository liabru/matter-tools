function MatterBasic(demo) {
  // module aliases
  var Engine = Matter.Engine,
      Runner = Matter.Runner,
      Render = Matter.Render,
      World = Matter.World,
      Body = Matter.Body,
      Mouse = Matter.Mouse,
      Common = Matter.Common,
      Bodies = Matter.Bodies;

  // create engine
  var engine = Engine.create();

  // create renderer
  var root = demo.dom.root, // this could be e.g. document.body
      element = root.querySelector('.matter-render');

  var render = Render.create({
    element: element,
    engine: engine,
    options: {
      width: Math.min(root.clientWidth, 1024),
      height: Math.min(root.clientHeight, 1024) - 58,
      showAngleIndicator: true,
      wireframeBackground: '#0f0f13'
    }
  });

  // create runner
  var runner = Runner.create();
  
  Runner.run(runner, engine);
  Render.run(render);

  // create demo scene
  var world = engine.world;
  world.gravity.scale = 0;

  // create a body with an attractor
  var attractiveBody = Bodies.circle(
    render.options.width / 2,
    render.options.height / 2,
    50, 
    {
    isStatic: true,

    // example of an attractor function that 
    // returns a force vector that applies to bodyB
    attractors: [
      function(bodyA, bodyB) {
        return {
          x: (bodyA.position.x - bodyB.position.x) * 1e-6,
          y: (bodyA.position.y - bodyB.position.y) * 1e-6,
        };
      }
    ]
  });

  World.add(world, attractiveBody);

  // add some bodies that to be attracted
  for (var i = 0; i < 150; i += 1) {
    var body = Bodies.polygon(
      Common.random(0, render.options.width), 
      Common.random(0, render.options.height),
      Common.random(1, 5),
      Common.random() > 0.9 ? Common.random(15, 25) : Common.random(5, 10)
    );

    World.add(world, body);
  }

  // add mouse control
  var mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas)
  });

  World.add(world, mouseConstraint);

  // return a context for MatterDemo to control
  return {
    engine: engine,
    runner: runner,
    render: render,
    canvas: render.canvas,
    stop: function() {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
    }
  };
}