function MatterBasic() {
  // install plugins
  Matter.use(
    'matter-wrap'
  );

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
  var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: Math.min(document.body.clientWidth, 1024),
      height: Math.min(document.body.clientHeight, 1024),
      showAngleIndicator: true,
      wireframeBackground: '#0f0f13'
    }
  });

  Render.run(render);

  // create runner
  var runner = Runner.create();
  Runner.run(runner, engine);

  // create demo scene
  var world = engine.world;
  world.gravity.scale = 0;

  // add some random bodies
  for (var i = 0; i < 150; i += 1) {
    var body = Bodies.polygon(
      Common.random(0, render.options.width), 
      Common.random(0, render.options.height),
      Common.random(1, 5),
      Common.random() > 0.9 ? Common.random(15, 25) : Common.random(5, 10),
      {
        friction: 0,
        frictionAir: 0,
        wrap: {
          min: {
            x: 0,
            y: 0
          },
          max: {
            x: render.canvas.width,
            y: render.canvas.height
          }
        }
      }
    );

    Body.setVelocity(body, {
      x: Common.random(-3, 3) + 3, 
      y: Common.random(-3, 3) + 3
    });

    World.add(world, body);
  }

  // add mouse control
  var mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas)
  });

  World.add(world, mouseConstraint);

  // context for MatterTools.Demo
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