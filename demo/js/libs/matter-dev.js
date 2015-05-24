/**
* matter-dev.min.js 0.8.0-dev 2015-05-24
* http://brm.io/matter-js/
* License: MIT
*/

(function() {
  var Matter = {};
  var Body = {};
  (function() {
    Body._inertiaScale = 4;
    var _nextCollidingGroupId = 1, _nextNonCollidingGroupId = -1, _nextCategory = 1;
    Body.create = function(options) {
      var defaults = {
        id:Common.nextId(),
        type:"body",
        label:"Body",
        parts:[],
        angle:0,
        vertices:Vertices.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
        position:{
          x:0,
          y:0
        },
        force:{
          x:0,
          y:0
        },
        torque:0,
        positionImpulse:{
          x:0,
          y:0
        },
        constraintImpulse:{
          x:0,
          y:0,
          angle:0
        },
        totalContacts:0,
        speed:0,
        angularSpeed:0,
        velocity:{
          x:0,
          y:0
        },
        angularVelocity:0,
        isStatic:false,
        isSleeping:false,
        motion:0,
        sleepThreshold:60,
        density:.001,
        restitution:0,
        friction:.1,
        frictionStatic:.5,
        frictionAir:.01,
        collisionFilter:{
          category:1,
          mask:4294967295,
          group:0
        },
        slop:.05,
        timeScale:1,
        render:{
          visible:true,
          sprite:{
            xScale:1,
            yScale:1
          },
          lineWidth:1.5
        }
      };
      var body = Common.extend(defaults, options);
      _initProperties(body, options);
      return body;
    };
    Body.nextGroup = function(isNonColliding) {
      if (isNonColliding) return _nextNonCollidingGroupId--;
      return _nextCollidingGroupId++;
    };
    Body.nextCategory = function() {
      _nextCategory = _nextCategory << 1;
      return _nextCategory;
    };
    var _initProperties = function(body, options) {
      Body.set(body, {
        bounds:body.bounds || Bounds.create(body.vertices),
        positionPrev:body.positionPrev || Vector.clone(body.position),
        anglePrev:body.anglePrev || body.angle,
        vertices:body.vertices,
        parts:body.parts || [ body ],
        isStatic:body.isStatic,
        isSleeping:body.isSleeping,
        parent:body.parent || body
      });
      Vertices.rotate(body.vertices, body.angle, body.position);
      Axes.rotate(body.axes, body.angle);
      Bounds.update(body.bounds, body.vertices, body.velocity);
      Body.set(body, {
        axes:options.axes || body.axes,
        area:options.area || body.area,
        mass:options.mass || body.mass,
        inertia:options.inertia || body.inertia
      });
      var defaultFillStyle = body.isStatic ? "#eeeeee" :Common.choose([ "#556270", "#4ECDC4", "#C7F464", "#FF6B6B", "#C44D58" ]), defaultStrokeStyle = Common.shadeColor(defaultFillStyle, -20);
      body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
      body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
    };
    Body.set = function(body, settings, value) {
      var property;
      if (typeof settings === "string") {
        property = settings;
        settings = {};
        settings[property] = value;
      }
      for (property in settings) {
        value = settings[property];
        if (!settings.hasOwnProperty(property)) continue;
        switch (property) {
         case "isStatic":
          Body.setStatic(body, value);
          break;

         case "isSleeping":
          Sleeping.set(body, value);
          break;

         case "mass":
          Body.setMass(body, value);
          break;

         case "density":
          Body.setDensity(body, value);
          break;

         case "inertia":
          Body.setInertia(body, value);
          break;

         case "vertices":
          Body.setVertices(body, value);
          break;

         case "position":
          Body.setPosition(body, value);
          break;

         case "angle":
          Body.setAngle(body, value);
          break;

         case "velocity":
          Body.setVelocity(body, value);
          break;

         case "angularVelocity":
          Body.setAngularVelocity(body, value);
          break;

         case "parts":
          Body.setParts(body, value);
          break;

         default:
          body[property] = value;
        }
      }
    };
    Body.setStatic = function(body, isStatic) {
      for (var i = 0; i < body.parts.length; i++) {
        var part = body.parts[i];
        part.isStatic = isStatic;
        if (isStatic) {
          part.restitution = 0;
          part.friction = 1;
          part.mass = part.inertia = part.density = Infinity;
          part.inverseMass = part.inverseInertia = 0;
          part.positionPrev.x = part.position.x;
          part.positionPrev.y = part.position.y;
          part.anglePrev = part.angle;
          part.angularVelocity = 0;
          part.speed = 0;
          part.angularSpeed = 0;
          part.motion = 0;
        }
      }
    };
    Body.setMass = function(body, mass) {
      body.mass = mass;
      body.inverseMass = 1 / body.mass;
      body.density = body.mass / body.area;
    };
    Body.setDensity = function(body, density) {
      Body.setMass(body, density * body.area);
      body.density = density;
    };
    Body.setInertia = function(body, inertia) {
      body.inertia = inertia;
      body.inverseInertia = 1 / body.inertia;
    };
    Body.setVertices = function(body, vertices) {
      if (vertices[0].body === body) {
        body.vertices = vertices;
      } else {
        body.vertices = Vertices.create(vertices, body);
      }
      body.axes = Axes.fromVertices(body.vertices);
      body.area = Vertices.area(body.vertices);
      Body.setMass(body, body.density * body.area);
      var centre = Vertices.centre(body.vertices);
      Vertices.translate(body.vertices, centre, -1);
      Body.setInertia(body, Body._inertiaScale * Vertices.inertia(body.vertices, body.mass));
      Vertices.translate(body.vertices, body.position);
      Bounds.update(body.bounds, body.vertices, body.velocity);
    };
    Body.setParts = function(body, parts, autoHull) {
      var i;
      parts = parts.slice(0);
      body.parts.length = 0;
      body.parts.push(body);
      body.parent = body;
      for (i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part !== body) {
          part.parent = body;
          body.parts.push(part);
        }
      }
      if (body.parts.length === 1) return;
      autoHull = typeof autoHull !== "undefined" ? autoHull :true;
      if (autoHull) {
        var vertices = [];
        for (i = 0; i < parts.length; i++) {
          vertices = vertices.concat(parts[i].vertices);
        }
        Vertices.clockwiseSort(vertices);
        var hull = Vertices.hull(vertices), hullCentre = Vertices.centre(hull);
        Body.setVertices(body, hull);
        Vertices.translate(body.vertices, hullCentre);
      }
      var total = _totalProperties(body);
      body.area = total.area;
      body.parent = body;
      body.position.x = total.centre.x;
      body.position.y = total.centre.y;
      body.positionPrev.x = total.centre.x;
      body.positionPrev.y = total.centre.y;
      Body.setMass(body, total.mass);
      Body.setInertia(body, total.inertia);
      Body.setPosition(body, total.centre);
    };
    Body.setPosition = function(body, position) {
      var delta = Vector.sub(position, body.position);
      body.positionPrev.x += delta.x;
      body.positionPrev.y += delta.y;
      for (var i = 0; i < body.parts.length; i++) {
        var part = body.parts[i];
        part.position.x += delta.x;
        part.position.y += delta.y;
        Vertices.translate(part.vertices, delta);
        Bounds.update(part.bounds, part.vertices, body.velocity);
      }
    };
    Body.setAngle = function(body, angle) {
      var delta = angle - body.angle;
      body.anglePrev += delta;
      for (var i = 0; i < body.parts.length; i++) {
        var part = body.parts[i];
        part.angle += delta;
        Vertices.rotate(part.vertices, delta, body.position);
        Axes.rotate(part.axes, delta);
        Bounds.update(part.bounds, part.vertices, body.velocity);
        if (i > 0) {
          Vector.rotateAbout(part.position, delta, body.position, part.position);
        }
      }
    };
    Body.setVelocity = function(body, velocity) {
      body.positionPrev.x = body.position.x - velocity.x;
      body.positionPrev.y = body.position.y - velocity.y;
      body.velocity.x = velocity.x;
      body.velocity.y = velocity.y;
      body.speed = Vector.magnitude(body.velocity);
    };
    Body.setAngularVelocity = function(body, velocity) {
      body.anglePrev = body.angle - velocity;
      body.angularVelocity = velocity;
      body.angularSpeed = Math.abs(body.angularVelocity);
    };
    Body.translate = function(body, translation) {
      Body.setPosition(body, Vector.add(body.position, translation));
    };
    Body.rotate = function(body, rotation) {
      Body.setAngle(body, body.angle + rotation);
    };
    Body.scale = function(body, scaleX, scaleY, point) {
      for (var i = 0; i < body.parts.length; i++) {
        var part = body.parts[i];
        Vertices.scale(part.vertices, scaleX, scaleY, body.position);
        part.axes = Axes.fromVertices(part.vertices);
        if (!body.isStatic) {
          part.area = Vertices.area(part.vertices);
          Body.setMass(part, body.density * part.area);
          Vertices.translate(part.vertices, {
            x:-part.position.x,
            y:-part.position.y
          });
          Body.setInertia(part, Vertices.inertia(part.vertices, part.mass));
          Vertices.translate(part.vertices, {
            x:part.position.x,
            y:part.position.y
          });
        }
        Bounds.update(part.bounds, part.vertices, body.velocity);
      }
      if (!body.isStatic) {
        var total = _totalProperties(body);
        body.area = total.area;
        Body.setMass(body, total.mass);
        Body.setInertia(body, total.inertia);
      }
    };
    Body.update = function(body, deltaTime, timeScale, correction) {
      var deltaTimeSquared = Math.pow(deltaTime * timeScale * body.timeScale, 2);
      var frictionAir = 1 - body.frictionAir * timeScale * body.timeScale, velocityPrevX = body.position.x - body.positionPrev.x, velocityPrevY = body.position.y - body.positionPrev.y;
      body.velocity.x = velocityPrevX * frictionAir * correction + body.force.x / body.mass * deltaTimeSquared;
      body.velocity.y = velocityPrevY * frictionAir * correction + body.force.y / body.mass * deltaTimeSquared;
      body.positionPrev.x = body.position.x;
      body.positionPrev.y = body.position.y;
      body.position.x += body.velocity.x;
      body.position.y += body.velocity.y;
      body.angularVelocity = (body.angle - body.anglePrev) * frictionAir * correction + body.torque / body.inertia * deltaTimeSquared;
      body.anglePrev = body.angle;
      body.angle += body.angularVelocity;
      body.speed = Vector.magnitude(body.velocity);
      body.angularSpeed = Math.abs(body.angularVelocity);
      for (var i = 0; i < body.parts.length; i++) {
        var part = body.parts[i];
        Vertices.translate(part.vertices, body.velocity);
        if (i > 0) {
          part.position.x += body.velocity.x;
          part.position.y += body.velocity.y;
        }
        if (body.angularVelocity !== 0) {
          Vertices.rotate(part.vertices, body.angularVelocity, body.position);
          Axes.rotate(part.axes, body.angularVelocity);
          if (i > 0) {
            Vector.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
          }
        }
        Bounds.update(part.bounds, part.vertices, body.velocity);
      }
    };
    Body.applyForce = function(body, position, force) {
      body.force.x += force.x;
      body.force.y += force.y;
      var offset = {
        x:position.x - body.position.x,
        y:position.y - body.position.y
      };
      body.torque += (offset.x * force.y - offset.y * force.x) * body.inverseInertia;
    };
    var _totalProperties = function(body) {
      var properties = {
        mass:0,
        area:0,
        inertia:0,
        centre:{
          x:0,
          y:0
        }
      };
      for (var i = body.parts.length === 1 ? 0 :1; i < body.parts.length; i++) {
        var part = body.parts[i];
        properties.mass += part.mass;
        properties.area += part.area;
        properties.inertia += part.inertia;
        properties.centre = Vector.add(properties.centre, Vector.mult(part.position, part.mass !== Infinity ? part.mass :1));
      }
      properties.centre = Vector.div(properties.centre, properties.mass !== Infinity ? properties.mass :body.parts.length);
      return properties;
    };
  })();
  var Composite = {};
  (function() {
    Composite.create = function(options) {
      return Common.extend({
        id:Common.nextId(),
        type:"composite",
        parent:null,
        isModified:false,
        bodies:[],
        constraints:[],
        composites:[],
        label:"Composite"
      }, options);
    };
    Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
      composite.isModified = isModified;
      if (updateParents && composite.parent) {
        Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
      }
      if (updateChildren) {
        for (var i = 0; i < composite.composites.length; i++) {
          var childComposite = composite.composites[i];
          Composite.setModified(childComposite, isModified, updateParents, updateChildren);
        }
      }
    };
    Composite.add = function(composite, object) {
      var objects = [].concat(object);
      Events.trigger(composite, "beforeAdd", {
        object:object
      });
      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        switch (obj.type) {
         case "body":
          if (obj.parent !== obj) {
            Common.log("Composite.add: skipped adding a compound body part (you must add its parent instead)", "warn");
            break;
          }
          Composite.addBody(composite, obj);
          break;

         case "constraint":
          Composite.addConstraint(composite, obj);
          break;

         case "composite":
          Composite.addComposite(composite, obj);
          break;

         case "mouseConstraint":
          Composite.addConstraint(composite, obj.constraint);
          break;
        }
      }
      Events.trigger(composite, "afterAdd", {
        object:object
      });
      return composite;
    };
    Composite.remove = function(composite, object, deep) {
      var objects = [].concat(object);
      Events.trigger(composite, "beforeRemove", {
        object:object
      });
      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        switch (obj.type) {
         case "body":
          Composite.removeBody(composite, obj, deep);
          break;

         case "constraint":
          Composite.removeConstraint(composite, obj, deep);
          break;

         case "composite":
          Composite.removeComposite(composite, obj, deep);
          break;

         case "mouseConstraint":
          Composite.removeConstraint(composite, obj.constraint);
          break;
        }
      }
      Events.trigger(composite, "afterRemove", {
        object:object
      });
      return composite;
    };
    Composite.addComposite = function(compositeA, compositeB) {
      compositeA.composites.push(compositeB);
      compositeB.parent = compositeA;
      Composite.setModified(compositeA, true, true, false);
      return compositeA;
    };
    Composite.removeComposite = function(compositeA, compositeB, deep) {
      var position = Common.indexOf(compositeA.composites, compositeB);
      if (position !== -1) {
        Composite.removeCompositeAt(compositeA, position);
        Composite.setModified(compositeA, true, true, false);
      }
      if (deep) {
        for (var i = 0; i < compositeA.composites.length; i++) {
          Composite.removeComposite(compositeA.composites[i], compositeB, true);
        }
      }
      return compositeA;
    };
    Composite.removeCompositeAt = function(composite, position) {
      composite.composites.splice(position, 1);
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.addBody = function(composite, body) {
      composite.bodies.push(body);
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.removeBody = function(composite, body, deep) {
      var position = Common.indexOf(composite.bodies, body);
      if (position !== -1) {
        Composite.removeBodyAt(composite, position);
        Composite.setModified(composite, true, true, false);
      }
      if (deep) {
        for (var i = 0; i < composite.composites.length; i++) {
          Composite.removeBody(composite.composites[i], body, true);
        }
      }
      return composite;
    };
    Composite.removeBodyAt = function(composite, position) {
      composite.bodies.splice(position, 1);
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.addConstraint = function(composite, constraint) {
      composite.constraints.push(constraint);
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.removeConstraint = function(composite, constraint, deep) {
      var position = Common.indexOf(composite.constraints, constraint);
      if (position !== -1) {
        Composite.removeConstraintAt(composite, position);
      }
      if (deep) {
        for (var i = 0; i < composite.composites.length; i++) {
          Composite.removeConstraint(composite.composites[i], constraint, true);
        }
      }
      return composite;
    };
    Composite.removeConstraintAt = function(composite, position) {
      composite.constraints.splice(position, 1);
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.clear = function(composite, keepStatic, deep) {
      if (deep) {
        for (var i = 0; i < composite.composites.length; i++) {
          Composite.clear(composite.composites[i], keepStatic, true);
        }
      }
      if (keepStatic) {
        composite.bodies = composite.bodies.filter(function(body) {
          return body.isStatic;
        });
      } else {
        composite.bodies.length = 0;
      }
      composite.constraints.length = 0;
      composite.composites.length = 0;
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.allBodies = function(composite) {
      var bodies = [].concat(composite.bodies);
      for (var i = 0; i < composite.composites.length; i++) bodies = bodies.concat(Composite.allBodies(composite.composites[i]));
      return bodies;
    };
    Composite.allConstraints = function(composite) {
      var constraints = [].concat(composite.constraints);
      for (var i = 0; i < composite.composites.length; i++) constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));
      return constraints;
    };
    Composite.allComposites = function(composite) {
      var composites = [].concat(composite.composites);
      for (var i = 0; i < composite.composites.length; i++) composites = composites.concat(Composite.allComposites(composite.composites[i]));
      return composites;
    };
    Composite.get = function(composite, id, type) {
      var objects, object;
      switch (type) {
       case "body":
        objects = Composite.allBodies(composite);
        break;

       case "constraint":
        objects = Composite.allConstraints(composite);
        break;

       case "composite":
        objects = Composite.allComposites(composite).concat(composite);
        break;
      }
      if (!objects) return null;
      object = objects.filter(function(object) {
        return object.id.toString() === id.toString();
      });
      return object.length === 0 ? null :object[0];
    };
    Composite.move = function(compositeA, objects, compositeB) {
      Composite.remove(compositeA, objects);
      Composite.add(compositeB, objects);
      return compositeA;
    };
    Composite.rebase = function(composite) {
      var objects = Composite.allBodies(composite).concat(Composite.allConstraints(composite)).concat(Composite.allComposites(composite));
      for (var i = 0; i < objects.length; i++) {
        objects[i].id = Common.nextId();
      }
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.translate = function(composite, translation, recursive) {
      var bodies = recursive ? Composite.allBodies(composite) :composite.bodies;
      for (var i = 0; i < bodies.length; i++) {
        Body.translate(bodies[i], translation);
      }
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.rotate = function(composite, rotation, point, recursive) {
      var cos = Math.cos(rotation), sin = Math.sin(rotation), bodies = recursive ? Composite.allBodies(composite) :composite.bodies;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
        Body.setPosition(body, {
          x:point.x + (dx * cos - dy * sin),
          y:point.y + (dx * sin + dy * cos)
        });
        Body.rotate(body, rotation);
      }
      Composite.setModified(composite, true, true, false);
      return composite;
    };
    Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
      var bodies = recursive ? Composite.allBodies(composite) :composite.bodies;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], dx = body.position.x - point.x, dy = body.position.y - point.y;
        Body.setPosition(body, {
          x:point.x + dx * scaleX,
          y:point.y + dy * scaleY
        });
        Body.scale(body, scaleX, scaleY);
      }
      Composite.setModified(composite, true, true, false);
      return composite;
    };
  })();
  var World = {};
  (function() {
    World.create = function(options) {
      var composite = Composite.create();
      var defaults = {
        label:"World",
        gravity:{
          x:0,
          y:1
        },
        bounds:{
          min:{
            x:-Infinity,
            y:-Infinity
          },
          max:{
            x:Infinity,
            y:Infinity
          }
        }
      };
      return Common.extend(composite, defaults, options);
    };
  })();
  var Contact = {};
  (function() {
    Contact.create = function(vertex) {
      return {
        id:Contact.id(vertex),
        vertex:vertex,
        normalImpulse:0,
        tangentImpulse:0
      };
    };
    Contact.id = function(vertex) {
      return vertex.body.id + "_" + vertex.index;
    };
  })();
  var Detector = {};
  (function() {
    Detector.collisions = function(broadphasePairs, engine) {
      var collisions = [], pairsTable = engine.pairs.table;
      var metrics = engine.metrics;
      for (var i = 0; i < broadphasePairs.length; i++) {
        var bodyA = broadphasePairs[i][0], bodyB = broadphasePairs[i][1];
        if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping)) continue;
        if (!Detector.canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) continue;
        metrics.midphaseTests += 1;
        if (Bounds.overlaps(bodyA.bounds, bodyB.bounds)) {
          for (var j = bodyA.parts.length > 1 ? 1 :0; j < bodyA.parts.length; j++) {
            var partA = bodyA.parts[j];
            for (var k = bodyB.parts.length > 1 ? 1 :0; k < bodyB.parts.length; k++) {
              var partB = bodyB.parts[k];
              if (partA === bodyA && partB === bodyB || Bounds.overlaps(partA.bounds, partB.bounds)) {
                var pairId = Pair.id(partA, partB), pair = pairsTable[pairId], previousCollision;
                if (pair && pair.isActive) {
                  previousCollision = pair.collision;
                } else {
                  previousCollision = null;
                }
                var collision = SAT.collides(partA, partB, previousCollision);
                metrics.narrowphaseTests += 1;
                if (collision.reused) metrics.narrowReuseCount += 1;
                if (collision.collided) {
                  collisions.push(collision);
                  metrics.narrowDetections += 1;
                }
              }
            }
          }
        }
      }
      return collisions;
    };
    Detector.bruteForce = function(bodies, engine) {
      var collisions = [], pairsTable = engine.pairs.table;
      var metrics = engine.metrics;
      for (var i = 0; i < bodies.length; i++) {
        for (var j = i + 1; j < bodies.length; j++) {
          var bodyA = bodies[i], bodyB = bodies[j];
          if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping)) continue;
          if (!Detector.canCollide(bodyA.collisionFilter, bodyB.collisionFilter)) continue;
          metrics.midphaseTests += 1;
          if (Bounds.overlaps(bodyA.bounds, bodyB.bounds)) {
            var pairId = Pair.id(bodyA, bodyB), pair = pairsTable[pairId], previousCollision;
            if (pair && pair.isActive) {
              previousCollision = pair.collision;
            } else {
              previousCollision = null;
            }
            var collision = SAT.collides(bodyA, bodyB, previousCollision);
            metrics.narrowphaseTests += 1;
            if (collision.reused) metrics.narrowReuseCount += 1;
            if (collision.collided) {
              collisions.push(collision);
              metrics.narrowDetections += 1;
            }
          }
        }
      }
      return collisions;
    };
    Detector.canCollide = function(filterA, filterB) {
      if (filterA.group === filterB.group && filterA.group !== 0) return filterA.group > 0;
      return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    };
  })();
  var Grid = {};
  (function() {
    Grid.create = function(options) {
      var defaults = {
        controller:Grid,
        detector:Detector.collisions,
        buckets:{},
        pairs:{},
        pairsList:[],
        bucketWidth:48,
        bucketHeight:48
      };
      return Common.extend(defaults, options);
    };
    Grid.update = function(grid, bodies, engine, forceUpdate) {
      var i, col, row, world = engine.world, buckets = grid.buckets, bucket, bucketId, gridChanged = false;
      var metrics = engine.metrics;
      metrics.broadphaseTests = 0;
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.isSleeping && !forceUpdate) continue;
        if (body.bounds.max.x < 0 || body.bounds.min.x > world.bounds.width || body.bounds.max.y < 0 || body.bounds.min.y > world.bounds.height) continue;
        var newRegion = _getRegion(grid, body);
        if (!body.region || newRegion.id !== body.region.id || forceUpdate) {
          metrics.broadphaseTests += 1;
          if (!body.region || forceUpdate) body.region = newRegion;
          var union = _regionUnion(newRegion, body.region);
          for (col = union.startCol; col <= union.endCol; col++) {
            for (row = union.startRow; row <= union.endRow; row++) {
              bucketId = _getBucketId(col, row);
              bucket = buckets[bucketId];
              var isInsideNewRegion = col >= newRegion.startCol && col <= newRegion.endCol && row >= newRegion.startRow && row <= newRegion.endRow;
              var isInsideOldRegion = col >= body.region.startCol && col <= body.region.endCol && row >= body.region.startRow && row <= body.region.endRow;
              if (!isInsideNewRegion && isInsideOldRegion) {
                if (isInsideOldRegion) {
                  if (bucket) _bucketRemoveBody(grid, bucket, body);
                }
              }
              if (body.region === newRegion || isInsideNewRegion && !isInsideOldRegion || forceUpdate) {
                if (!bucket) bucket = _createBucket(buckets, bucketId);
                _bucketAddBody(grid, bucket, body);
              }
            }
          }
          body.region = newRegion;
          gridChanged = true;
        }
      }
      if (gridChanged) grid.pairsList = _createActivePairsList(grid);
    };
    Grid.clear = function(grid) {
      grid.buckets = {};
      grid.pairs = {};
      grid.pairsList = [];
    };
    var _regionUnion = function(regionA, regionB) {
      var startCol = Math.min(regionA.startCol, regionB.startCol), endCol = Math.max(regionA.endCol, regionB.endCol), startRow = Math.min(regionA.startRow, regionB.startRow), endRow = Math.max(regionA.endRow, regionB.endRow);
      return _createRegion(startCol, endCol, startRow, endRow);
    };
    var _getRegion = function(grid, body) {
      var bounds = body.bounds, startCol = Math.floor(bounds.min.x / grid.bucketWidth), endCol = Math.floor(bounds.max.x / grid.bucketWidth), startRow = Math.floor(bounds.min.y / grid.bucketHeight), endRow = Math.floor(bounds.max.y / grid.bucketHeight);
      return _createRegion(startCol, endCol, startRow, endRow);
    };
    var _createRegion = function(startCol, endCol, startRow, endRow) {
      return {
        id:startCol + "," + endCol + "," + startRow + "," + endRow,
        startCol:startCol,
        endCol:endCol,
        startRow:startRow,
        endRow:endRow
      };
    };
    var _getBucketId = function(column, row) {
      return column + "," + row;
    };
    var _createBucket = function(buckets, bucketId) {
      var bucket = buckets[bucketId] = [];
      return bucket;
    };
    var _bucketAddBody = function(grid, bucket, body) {
      for (var i = 0; i < bucket.length; i++) {
        var bodyB = bucket[i];
        if (body.id === bodyB.id || body.isStatic && bodyB.isStatic) continue;
        var pairId = Pair.id(body, bodyB), pair = grid.pairs[pairId];
        if (pair) {
          pair[2] += 1;
        } else {
          grid.pairs[pairId] = [ body, bodyB, 1 ];
        }
      }
      bucket.push(body);
    };
    var _bucketRemoveBody = function(grid, bucket, body) {
      bucket.splice(Common.indexOf(bucket, body), 1);
      for (var i = 0; i < bucket.length; i++) {
        var bodyB = bucket[i], pairId = Pair.id(body, bodyB), pair = grid.pairs[pairId];
        if (pair) pair[2] -= 1;
      }
    };
    var _createActivePairsList = function(grid) {
      var pairKeys, pair, pairs = [];
      pairKeys = Common.keys(grid.pairs);
      for (var k = 0; k < pairKeys.length; k++) {
        pair = grid.pairs[pairKeys[k]];
        if (pair[2] > 0) {
          pairs.push(pair);
        } else {
          delete grid.pairs[pairKeys[k]];
        }
      }
      return pairs;
    };
  })();
  var Pair = {};
  (function() {
    Pair.create = function(collision, timestamp) {
      var bodyA = collision.bodyA, bodyB = collision.bodyB, parentA = collision.parentA, parentB = collision.parentB;
      var pair = {
        id:Pair.id(bodyA, bodyB),
        bodyA:bodyA,
        bodyB:bodyB,
        contacts:{},
        activeContacts:[],
        separation:0,
        isActive:true,
        timeCreated:timestamp,
        timeUpdated:timestamp,
        inverseMass:parentA.inverseMass + parentB.inverseMass,
        friction:Math.min(parentA.friction, parentB.friction),
        frictionStatic:Math.max(parentA.frictionStatic, parentB.frictionStatic),
        restitution:Math.max(parentA.restitution, parentB.restitution),
        slop:Math.max(parentA.slop, parentB.slop)
      };
      Pair.update(pair, collision, timestamp);
      return pair;
    };
    Pair.update = function(pair, collision, timestamp) {
      var contacts = pair.contacts, supports = collision.supports, activeContacts = pair.activeContacts, parentA = collision.parentA, parentB = collision.parentB;
      pair.collision = collision;
      pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
      pair.friction = Math.min(parentA.friction, parentB.friction);
      pair.frictionStatic = Math.max(parentA.frictionStatic, parentB.frictionStatic);
      pair.restitution = Math.max(parentA.restitution, parentB.restitution);
      pair.slop = Math.max(parentA.slop, parentB.slop);
      activeContacts.length = 0;
      if (collision.collided) {
        for (var i = 0; i < supports.length; i++) {
          var support = supports[i], contactId = Contact.id(support), contact = contacts[contactId];
          if (contact) {
            activeContacts.push(contact);
          } else {
            activeContacts.push(contacts[contactId] = Contact.create(support));
          }
        }
        pair.separation = collision.depth;
        Pair.setActive(pair, true, timestamp);
      } else {
        if (pair.isActive === true) Pair.setActive(pair, false, timestamp);
      }
    };
    Pair.setActive = function(pair, isActive, timestamp) {
      if (isActive) {
        pair.isActive = true;
        pair.timeUpdated = timestamp;
      } else {
        pair.isActive = false;
        pair.activeContacts.length = 0;
      }
    };
    Pair.id = function(bodyA, bodyB) {
      if (bodyA.id < bodyB.id) {
        return bodyA.id + "_" + bodyB.id;
      } else {
        return bodyB.id + "_" + bodyA.id;
      }
    };
  })();
  var Pairs = {};
  (function() {
    var _pairMaxIdleLife = 1e3;
    Pairs.create = function(options) {
      return Common.extend({
        table:{},
        list:[],
        collisionStart:[],
        collisionActive:[],
        collisionEnd:[]
      }, options);
    };
    Pairs.update = function(pairs, collisions, timestamp) {
      var pairsList = pairs.list, pairsTable = pairs.table, collisionStart = pairs.collisionStart, collisionEnd = pairs.collisionEnd, collisionActive = pairs.collisionActive, activePairIds = [], collision, pairId, pair, i;
      collisionStart.length = 0;
      collisionEnd.length = 0;
      collisionActive.length = 0;
      for (i = 0; i < collisions.length; i++) {
        collision = collisions[i];
        if (collision.collided) {
          pairId = Pair.id(collision.bodyA, collision.bodyB);
          activePairIds.push(pairId);
          pair = pairsTable[pairId];
          if (pair) {
            if (pair.isActive) {
              collisionActive.push(pair);
            } else {
              collisionStart.push(pair);
            }
            Pair.update(pair, collision, timestamp);
          } else {
            pair = Pair.create(collision, timestamp);
            pairsTable[pairId] = pair;
            collisionStart.push(pair);
            pairsList.push(pair);
          }
        }
      }
      for (i = 0; i < pairsList.length; i++) {
        pair = pairsList[i];
        if (pair.isActive && Common.indexOf(activePairIds, pair.id) === -1) {
          Pair.setActive(pair, false, timestamp);
          collisionEnd.push(pair);
        }
      }
    };
    Pairs.removeOld = function(pairs, timestamp) {
      var pairsList = pairs.list, pairsTable = pairs.table, indexesToRemove = [], pair, collision, pairIndex, i;
      for (i = 0; i < pairsList.length; i++) {
        pair = pairsList[i];
        collision = pair.collision;
        if (collision.bodyA.isSleeping || collision.bodyB.isSleeping) {
          pair.timeUpdated = timestamp;
          continue;
        }
        if (timestamp - pair.timeUpdated > _pairMaxIdleLife) {
          indexesToRemove.push(i);
        }
      }
      for (i = 0; i < indexesToRemove.length; i++) {
        pairIndex = indexesToRemove[i] - i;
        pair = pairsList[pairIndex];
        delete pairsTable[pair.id];
        pairsList.splice(pairIndex, 1);
      }
    };
    Pairs.clear = function(pairs) {
      pairs.table = {};
      pairs.list.length = 0;
      pairs.collisionStart.length = 0;
      pairs.collisionActive.length = 0;
      pairs.collisionEnd.length = 0;
      return pairs;
    };
  })();
  var Query = {};
  (function() {
    Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
      rayWidth = rayWidth || 1e-100;
      var rayAngle = Vector.angle(startPoint, endPoint), rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)), rayX = (endPoint.x + startPoint.x) * .5, rayY = (endPoint.y + startPoint.y) * .5, ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, {
        angle:rayAngle
      }), collisions = [];
      for (var i = 0; i < bodies.length; i++) {
        var bodyA = bodies[i];
        if (Bounds.overlaps(bodyA.bounds, ray.bounds)) {
          for (var j = bodyA.parts.length === 1 ? 0 :1; j < bodyA.parts.length; j++) {
            var part = bodyA.parts[j];
            if (Bounds.overlaps(part.bounds, ray.bounds)) {
              var collision = SAT.collides(part, ray);
              if (collision.collided) {
                collision.body = collision.bodyA = collision.bodyB = bodyA;
                collisions.push(collision);
                break;
              }
            }
          }
        }
      }
      return collisions;
    };
    Query.region = function(bodies, bounds, outside) {
      var result = [];
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], overlaps = Bounds.overlaps(body.bounds, bounds);
        if (overlaps && !outside || !overlaps && outside) result.push(body);
      }
      return result;
    };
    Query.point = function(bodies, point) {
      var result = [];
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (Bounds.contains(body.bounds, point)) {
          for (var j = body.parts.length === 1 ? 0 :1; j < body.parts.length; j++) {
            var part = body.parts[j];
            if (Bounds.contains(part.bounds, point) && Vertices.contains(part.vertices, point)) {
              result.push(body);
              break;
            }
          }
        }
      }
      return result;
    };
  })();
  var Resolver = {};
  (function() {
    Resolver._restingThresh = 4;
    Resolver._positionDampen = .9;
    Resolver._positionWarming = .8;
    Resolver._frictionNormalMultiplier = 5;
    Resolver.preSolvePosition = function(pairs) {
      var i, pair, activeCount;
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        activeCount = pair.activeContacts.length;
        pair.collision.parentA.totalContacts += activeCount;
        pair.collision.parentB.totalContacts += activeCount;
      }
    };
    Resolver.solvePosition = function(pairs, timeScale) {
      var i, pair, collision, bodyA, bodyB, normal, bodyBtoA, contactShare, contactCount = {}, tempA = Vector._temp[0], tempB = Vector._temp[1], tempC = Vector._temp[2], tempD = Vector._temp[3];
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        bodyA = collision.parentA;
        bodyB = collision.parentB;
        normal = collision.normal;
        bodyBtoA = Vector.sub(Vector.add(bodyB.positionImpulse, bodyB.position, tempA), Vector.add(bodyA.positionImpulse, Vector.sub(bodyB.position, collision.penetration, tempB), tempC), tempD);
        pair.separation = Vector.dot(normal, bodyBtoA);
      }
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive || pair.separation < 0) continue;
        collision = pair.collision;
        bodyA = collision.parentA;
        bodyB = collision.parentB;
        normal = collision.normal;
        positionImpulse = (pair.separation - pair.slop) * timeScale;
        if (bodyA.isStatic || bodyB.isStatic) positionImpulse *= 2;
        if (!(bodyA.isStatic || bodyA.isSleeping)) {
          contactShare = Resolver._positionDampen / bodyA.totalContacts;
          bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
          bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
        }
        if (!(bodyB.isStatic || bodyB.isSleeping)) {
          contactShare = Resolver._positionDampen / bodyB.totalContacts;
          bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
          bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
        }
      }
    };
    Resolver.postSolvePosition = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        body.totalContacts = 0;
        if (body.positionImpulse.x !== 0 || body.positionImpulse.y !== 0) {
          for (var j = 0; j < body.parts.length; j++) {
            var part = body.parts[j];
            Vertices.translate(part.vertices, body.positionImpulse);
            Bounds.update(part.bounds, part.vertices, body.velocity);
            part.position.x += body.positionImpulse.x;
            part.position.y += body.positionImpulse.y;
          }
          body.positionPrev.x += body.positionImpulse.x;
          body.positionPrev.y += body.positionImpulse.y;
          if (Vector.dot(body.positionImpulse, body.velocity) < 0) {
            body.positionImpulse.x = 0;
            body.positionImpulse.y = 0;
          } else {
            body.positionImpulse.x *= Resolver._positionWarming;
            body.positionImpulse.y *= Resolver._positionWarming;
          }
        }
      }
    };
    Resolver.preSolveVelocity = function(pairs) {
      var i, j, pair, contacts, collision, bodyA, bodyB, normal, tangent, contact, contactVertex, normalImpulse, tangentImpulse, offset, impulse = Vector._temp[0], tempA = Vector._temp[1];
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        contacts = pair.activeContacts;
        collision = pair.collision;
        bodyA = collision.parentA;
        bodyB = collision.parentB;
        normal = collision.normal;
        tangent = collision.tangent;
        for (j = 0; j < contacts.length; j++) {
          contact = contacts[j];
          contactVertex = contact.vertex;
          normalImpulse = contact.normalImpulse;
          tangentImpulse = contact.tangentImpulse;
          if (normalImpulse !== 0 || tangentImpulse !== 0) {
            impulse.x = normal.x * normalImpulse + tangent.x * tangentImpulse;
            impulse.y = normal.y * normalImpulse + tangent.y * tangentImpulse;
            if (!(bodyA.isStatic || bodyA.isSleeping)) {
              offset = Vector.sub(contactVertex, bodyA.position, tempA);
              bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
              bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
              bodyA.anglePrev += Vector.cross(offset, impulse) * bodyA.inverseInertia;
            }
            if (!(bodyB.isStatic || bodyB.isSleeping)) {
              offset = Vector.sub(contactVertex, bodyB.position, tempA);
              bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
              bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
              bodyB.anglePrev -= Vector.cross(offset, impulse) * bodyB.inverseInertia;
            }
          }
        }
      }
    };
    Resolver.solveVelocity = function(pairs, timeScale) {
      var timeScaleSquared = timeScale * timeScale, impulse = Vector._temp[0], tempA = Vector._temp[1], tempB = Vector._temp[2], tempC = Vector._temp[3], tempD = Vector._temp[4], tempE = Vector._temp[5];
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (!pair.isActive) continue;
        var collision = pair.collision, bodyA = collision.parentA, bodyB = collision.parentB, normal = collision.normal, tangent = collision.tangent, contacts = pair.activeContacts, contactShare = 1 / contacts.length;
        bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
        bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
        bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
        bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
        bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
        bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;
        for (var j = 0; j < contacts.length; j++) {
          var contact = contacts[j], contactVertex = contact.vertex, offsetA = Vector.sub(contactVertex, bodyA.position, tempA), offsetB = Vector.sub(contactVertex, bodyB.position, tempB), velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity), tempC), velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity), tempD), relativeVelocity = Vector.sub(velocityPointA, velocityPointB, tempE), normalVelocity = Vector.dot(normal, relativeVelocity);
          var tangentVelocity = Vector.dot(tangent, relativeVelocity), tangentSpeed = Math.abs(tangentVelocity), tangentVelocityDirection = Common.sign(tangentVelocity);
          var normalImpulse = (1 + pair.restitution) * normalVelocity, normalForce = Common.clamp(pair.separation + normalVelocity, 0, 1) * Resolver._frictionNormalMultiplier;
          var tangentImpulse = tangentVelocity, maxFriction = Infinity;
          if (tangentSpeed > pair.friction * pair.frictionStatic * normalForce * timeScaleSquared) {
            tangentImpulse = pair.friction * tangentVelocityDirection * timeScaleSquared;
            maxFriction = tangentSpeed;
          }
          var oAcN = Vector.cross(offsetA, normal), oBcN = Vector.cross(offsetB, normal), denom = bodyA.inverseMass + bodyB.inverseMass + bodyA.inverseInertia * oAcN * oAcN + bodyB.inverseInertia * oBcN * oBcN;
          normalImpulse *= contactShare / denom;
          tangentImpulse *= contactShare / (1 + denom);
          if (normalVelocity < 0 && normalVelocity * normalVelocity > Resolver._restingThresh * timeScaleSquared) {
            contact.normalImpulse = 0;
            contact.tangentImpulse = 0;
          } else {
            var contactNormalImpulse = contact.normalImpulse;
            contact.normalImpulse = Math.min(contact.normalImpulse + normalImpulse, 0);
            normalImpulse = contact.normalImpulse - contactNormalImpulse;
            var contactTangentImpulse = contact.tangentImpulse;
            contact.tangentImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
            tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
          }
          impulse.x = normal.x * normalImpulse + tangent.x * tangentImpulse;
          impulse.y = normal.y * normalImpulse + tangent.y * tangentImpulse;
          if (!(bodyA.isStatic || bodyA.isSleeping)) {
            bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
            bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
            bodyA.anglePrev += Vector.cross(offsetA, impulse) * bodyA.inverseInertia;
          }
          if (!(bodyB.isStatic || bodyB.isSleeping)) {
            bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
            bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
            bodyB.anglePrev -= Vector.cross(offsetB, impulse) * bodyB.inverseInertia;
          }
        }
      }
    };
  })();
  var SAT = {};
  (function() {
    SAT.collides = function(bodyA, bodyB, previousCollision) {
      var overlapAB, overlapBA, minOverlap, collision, prevCol = previousCollision, canReusePrevCol = false;
      if (prevCol) {
        var parentA = bodyA.parent, parentB = bodyB.parent, motion = parentA.speed * parentA.speed + parentA.angularSpeed * parentA.angularSpeed + parentB.speed * parentB.speed + parentB.angularSpeed * parentB.angularSpeed;
        canReusePrevCol = prevCol && prevCol.collided && motion < .2;
        collision = prevCol;
      } else {
        collision = {
          collided:false,
          bodyA:bodyA,
          bodyB:bodyB
        };
      }
      if (prevCol && canReusePrevCol) {
        var axisBodyA = collision.axisBody, axisBodyB = axisBodyA === bodyA ? bodyB :bodyA, axes = [ axisBodyA.axes[prevCol.axisNumber] ];
        minOverlap = _overlapAxes(axisBodyA.vertices, axisBodyB.vertices, axes);
        collision.reused = true;
        if (minOverlap.overlap <= 0) {
          collision.collided = false;
          return collision;
        }
      } else {
        overlapAB = _overlapAxes(bodyA.vertices, bodyB.vertices, bodyA.axes);
        if (overlapAB.overlap <= 0) {
          collision.collided = false;
          return collision;
        }
        overlapBA = _overlapAxes(bodyB.vertices, bodyA.vertices, bodyB.axes);
        if (overlapBA.overlap <= 0) {
          collision.collided = false;
          return collision;
        }
        if (overlapAB.overlap < overlapBA.overlap) {
          minOverlap = overlapAB;
          collision.axisBody = bodyA;
        } else {
          minOverlap = overlapBA;
          collision.axisBody = bodyB;
        }
        collision.axisNumber = minOverlap.axisNumber;
      }
      collision.bodyA = bodyA.id < bodyB.id ? bodyA :bodyB;
      collision.bodyB = bodyA.id < bodyB.id ? bodyB :bodyA;
      collision.collided = true;
      collision.normal = minOverlap.axis;
      collision.depth = minOverlap.overlap;
      collision.parentA = collision.bodyA.parent;
      collision.parentB = collision.bodyB.parent;
      bodyA = collision.bodyA;
      bodyB = collision.bodyB;
      if (Vector.dot(collision.normal, Vector.sub(bodyB.position, bodyA.position)) > 0) collision.normal = Vector.neg(collision.normal);
      collision.tangent = Vector.perp(collision.normal);
      collision.penetration = {
        x:collision.normal.x * collision.depth,
        y:collision.normal.y * collision.depth
      };
      var verticesB = _findSupports(bodyA, bodyB, collision.normal), supports = collision.supports || [];
      supports.length = 0;
      if (Vertices.contains(bodyA.vertices, verticesB[0])) supports.push(verticesB[0]);
      if (Vertices.contains(bodyA.vertices, verticesB[1])) supports.push(verticesB[1]);
      if (supports.length < 2) {
        var verticesA = _findSupports(bodyB, bodyA, Vector.neg(collision.normal));
        if (Vertices.contains(bodyB.vertices, verticesA[0])) supports.push(verticesA[0]);
        if (supports.length < 2 && Vertices.contains(bodyB.vertices, verticesA[1])) supports.push(verticesA[1]);
      }
      if (supports.length < 1) supports = [ verticesB[0] ];
      collision.supports = supports;
      return collision;
    };
    var _overlapAxes = function(verticesA, verticesB, axes) {
      var projectionA = Vector._temp[0], projectionB = Vector._temp[1], result = {
        overlap:Number.MAX_VALUE
      }, overlap, axis;
      for (var i = 0; i < axes.length; i++) {
        axis = axes[i];
        _projectToAxis(projectionA, verticesA, axis);
        _projectToAxis(projectionB, verticesB, axis);
        overlap = Math.min(projectionA.max - projectionB.min, projectionB.max - projectionA.min);
        if (overlap <= 0) {
          result.overlap = overlap;
          return result;
        }
        if (overlap < result.overlap) {
          result.overlap = overlap;
          result.axis = axis;
          result.axisNumber = i;
        }
      }
      return result;
    };
    var _projectToAxis = function(projection, vertices, axis) {
      var min = Vector.dot(vertices[0], axis), max = min;
      for (var i = 1; i < vertices.length; i += 1) {
        var dot = Vector.dot(vertices[i], axis);
        if (dot > max) {
          max = dot;
        } else if (dot < min) {
          min = dot;
        }
      }
      projection.min = min;
      projection.max = max;
    };
    var _findSupports = function(bodyA, bodyB, normal) {
      var nearestDistance = Number.MAX_VALUE, vertexToBody = Vector._temp[0], vertices = bodyB.vertices, bodyAPosition = bodyA.position, distance, vertex, vertexA, vertexB;
      for (var i = 0; i < vertices.length; i++) {
        vertex = vertices[i];
        vertexToBody.x = vertex.x - bodyAPosition.x;
        vertexToBody.y = vertex.y - bodyAPosition.y;
        distance = -Vector.dot(normal, vertexToBody);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          vertexA = vertex;
        }
      }
      var prevIndex = vertexA.index - 1 >= 0 ? vertexA.index - 1 :vertices.length - 1;
      vertex = vertices[prevIndex];
      vertexToBody.x = vertex.x - bodyAPosition.x;
      vertexToBody.y = vertex.y - bodyAPosition.y;
      nearestDistance = -Vector.dot(normal, vertexToBody);
      vertexB = vertex;
      var nextIndex = (vertexA.index + 1) % vertices.length;
      vertex = vertices[nextIndex];
      vertexToBody.x = vertex.x - bodyAPosition.x;
      vertexToBody.y = vertex.y - bodyAPosition.y;
      distance = -Vector.dot(normal, vertexToBody);
      if (distance < nearestDistance) {
        vertexB = vertex;
      }
      return [ vertexA, vertexB ];
    };
  })();
  var Constraint = {};
  (function() {
    var _minLength = 1e-6, _minDifference = .001;
    Constraint.create = function(options) {
      var constraint = options;
      if (constraint.bodyA && !constraint.pointA) constraint.pointA = {
        x:0,
        y:0
      };
      if (constraint.bodyB && !constraint.pointB) constraint.pointB = {
        x:0,
        y:0
      };
      var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) :constraint.pointA, initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) :constraint.pointB, length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
      constraint.length = constraint.length || length || _minLength;
      var render = {
        visible:true,
        lineWidth:2,
        strokeStyle:"#666"
      };
      constraint.render = Common.extend(render, constraint.render);
      constraint.id = constraint.id || Common.nextId();
      constraint.label = constraint.label || "Constraint";
      constraint.type = "constraint";
      constraint.stiffness = constraint.stiffness || 1;
      constraint.angularStiffness = constraint.angularStiffness || 0;
      constraint.angleA = constraint.bodyA ? constraint.bodyA.angle :constraint.angleA;
      constraint.angleB = constraint.bodyB ? constraint.bodyB.angle :constraint.angleB;
      return constraint;
    };
    Constraint.solveAll = function(constraints, timeScale) {
      for (var i = 0; i < constraints.length; i++) {
        Constraint.solve(constraints[i], timeScale);
      }
    };
    Constraint.solve = function(constraint, timeScale) {
      var bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB;
      if (bodyA && !bodyA.isStatic) {
        constraint.pointA = Vector.rotate(pointA, bodyA.angle - constraint.angleA);
        constraint.angleA = bodyA.angle;
      }
      if (bodyB && !bodyB.isStatic) {
        constraint.pointB = Vector.rotate(pointB, bodyB.angle - constraint.angleB);
        constraint.angleB = bodyB.angle;
      }
      var pointAWorld = pointA, pointBWorld = pointB;
      if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
      if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);
      if (!pointAWorld || !pointBWorld) return;
      var delta = Vector.sub(pointAWorld, pointBWorld), currentLength = Vector.magnitude(delta);
      if (currentLength === 0) currentLength = _minLength;
      var difference = (currentLength - constraint.length) / currentLength, normal = Vector.div(delta, currentLength), force = Vector.mult(delta, difference * .5 * constraint.stiffness * timeScale * timeScale);
      if (Math.abs(1 - currentLength / constraint.length) < _minDifference * timeScale) return;
      var velocityPointA, velocityPointB, offsetA, offsetB, oAn, oBn, bodyADenom, bodyBDenom;
      if (bodyA && !bodyA.isStatic) {
        offsetA = {
          x:pointAWorld.x - bodyA.position.x + force.x,
          y:pointAWorld.y - bodyA.position.y + force.y
        };
        bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
        bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
        bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
        velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity));
        oAn = Vector.dot(offsetA, normal);
        bodyADenom = bodyA.inverseMass + bodyA.inverseInertia * oAn * oAn;
      } else {
        velocityPointA = {
          x:0,
          y:0
        };
        bodyADenom = bodyA ? bodyA.inverseMass :0;
      }
      if (bodyB && !bodyB.isStatic) {
        offsetB = {
          x:pointBWorld.x - bodyB.position.x - force.x,
          y:pointBWorld.y - bodyB.position.y - force.y
        };
        bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
        bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
        bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;
        velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity));
        oBn = Vector.dot(offsetB, normal);
        bodyBDenom = bodyB.inverseMass + bodyB.inverseInertia * oBn * oBn;
      } else {
        velocityPointB = {
          x:0,
          y:0
        };
        bodyBDenom = bodyB ? bodyB.inverseMass :0;
      }
      var relativeVelocity = Vector.sub(velocityPointB, velocityPointA), normalImpulse = Vector.dot(normal, relativeVelocity) / (bodyADenom + bodyBDenom);
      if (normalImpulse > 0) normalImpulse = 0;
      var normalVelocity = {
        x:normal.x * normalImpulse,
        y:normal.y * normalImpulse
      };
      var torque;
      if (bodyA && !bodyA.isStatic) {
        torque = Vector.cross(offsetA, normalVelocity) * bodyA.inverseInertia * (1 - constraint.angularStiffness);
        Sleeping.set(bodyA, false);
        torque = Common.clamp(torque, -.01, .01);
        bodyA.constraintImpulse.x -= force.x;
        bodyA.constraintImpulse.y -= force.y;
        bodyA.constraintImpulse.angle += torque;
        bodyA.position.x -= force.x;
        bodyA.position.y -= force.y;
        bodyA.angle += torque;
      }
      if (bodyB && !bodyB.isStatic) {
        torque = Vector.cross(offsetB, normalVelocity) * bodyB.inverseInertia * (1 - constraint.angularStiffness);
        Sleeping.set(bodyB, false);
        torque = Common.clamp(torque, -.01, .01);
        bodyB.constraintImpulse.x += force.x;
        bodyB.constraintImpulse.y += force.y;
        bodyB.constraintImpulse.angle -= torque;
        bodyB.position.x += force.x;
        bodyB.position.y += force.y;
        bodyB.angle -= torque;
      }
    };
    Constraint.postSolveAll = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], impulse = body.constraintImpulse;
        for (var j = 0; j < body.parts.length; j++) {
          var part = body.parts[j];
          Vertices.translate(part.vertices, impulse);
          if (j > 0) {
            part.position.x += impulse.x;
            part.position.y += impulse.y;
          }
          if (impulse.angle !== 0) {
            Vertices.rotate(part.vertices, impulse.angle, body.position);
            Axes.rotate(part.axes, impulse.angle);
            if (j > 0) {
              Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
            }
          }
          Bounds.update(part.bounds, part.vertices);
        }
        impulse.angle = 0;
        impulse.x = 0;
        impulse.y = 0;
      }
    };
  })();
  var MouseConstraint = {};
  (function() {
    MouseConstraint.create = function(engine, options) {
      var mouse = (engine ? engine.mouse :null) || (options ? options.mouse :null);
      if (!mouse && engine && engine.render && engine.render.canvas) {
        mouse = Mouse.create(engine.render.canvas);
      } else {
        mouse = Mouse.create();
        Common.log("MouseConstraint.create: options.mouse was undefined, engine.render.canvas was undefined, may not function as expected", "warn");
      }
      var constraint = Constraint.create({
        label:"Mouse Constraint",
        pointA:mouse.position,
        pointB:{
          x:0,
          y:0
        },
        length:.01,
        stiffness:.1,
        angularStiffness:1,
        render:{
          strokeStyle:"#90EE90",
          lineWidth:3
        }
      });
      var defaults = {
        type:"mouseConstraint",
        mouse:mouse,
        body:null,
        constraint:constraint,
        collisionFilter:{
          category:1,
          mask:4294967295,
          group:0
        }
      };
      var mouseConstraint = Common.extend(defaults, options);
      Events.on(engine, "tick", function() {
        var allBodies = Composite.allBodies(engine.world);
        MouseConstraint.update(mouseConstraint, allBodies);
        _triggerEvents(mouseConstraint);
      });
      return mouseConstraint;
    };
    MouseConstraint.update = function(mouseConstraint, bodies) {
      var mouse = mouseConstraint.mouse, constraint = mouseConstraint.constraint, body = mouseConstraint.body;
      if (mouse.button === 0) {
        if (!constraint.bodyB) {
          for (var i = 0; i < bodies.length; i++) {
            body = bodies[i];
            if (Bounds.contains(body.bounds, mouse.position) && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
              for (var j = body.parts.length > 1 ? 1 :0; j < body.parts.length; j++) {
                var part = body.parts[j];
                if (Vertices.contains(part.vertices, mouse.position)) {
                  constraint.pointA = mouse.position;
                  constraint.bodyB = mouseConstraint.body = body;
                  constraint.pointB = {
                    x:mouse.position.x - body.position.x,
                    y:mouse.position.y - body.position.y
                  };
                  constraint.angleB = body.angle;
                  Sleeping.set(body, false);
                  Events.trigger(mouseConstraint, "startdrag", {
                    mouse:mouse,
                    body:body
                  });
                  break;
                }
              }
            }
          }
        } else {
          Sleeping.set(constraint.bodyB, false);
          constraint.pointA = mouse.position;
        }
      } else {
        constraint.bodyB = mouseConstraint.body = null;
        constraint.pointB = null;
        if (body) Events.trigger(mouseConstraint, "enddrag", {
          mouse:mouse,
          body:body
        });
      }
    };
    var _triggerEvents = function(mouseConstraint) {
      var mouse = mouseConstraint.mouse, mouseEvents = mouse.sourceEvents;
      if (mouseEvents.mousemove) Events.trigger(mouseConstraint, "mousemove", {
        mouse:mouse
      });
      if (mouseEvents.mousedown) Events.trigger(mouseConstraint, "mousedown", {
        mouse:mouse
      });
      if (mouseEvents.mouseup) Events.trigger(mouseConstraint, "mouseup", {
        mouse:mouse
      });
      Mouse.clearSourceEvents(mouse);
    };
  })();
  var Common = {};
  (function() {
    Common._nextId = 0;
    Common._seed = 0;
    Common.extend = function(obj, deep) {
      var argsStart, args, deepClone;
      if (typeof deep === "boolean") {
        argsStart = 2;
        deepClone = deep;
      } else {
        argsStart = 1;
        deepClone = true;
      }
      args = Array.prototype.slice.call(arguments, argsStart);
      for (var i = 0; i < args.length; i++) {
        var source = args[i];
        if (source) {
          for (var prop in source) {
            if (deepClone && source[prop] && source[prop].constructor === Object) {
              if (!obj[prop] || obj[prop].constructor === Object) {
                obj[prop] = obj[prop] || {};
                Common.extend(obj[prop], deepClone, source[prop]);
              } else {
                obj[prop] = source[prop];
              }
            } else {
              obj[prop] = source[prop];
            }
          }
        }
      }
      return obj;
    };
    Common.clone = function(obj, deep) {
      return Common.extend({}, deep, obj);
    };
    Common.keys = function(obj) {
      if (Object.keys) return Object.keys(obj);
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    };
    Common.values = function(obj) {
      var values = [];
      if (Object.keys) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
          values.push(obj[keys[i]]);
        }
        return values;
      }
      for (var key in obj) values.push(obj[key]);
      return values;
    };
    Common.shadeColor = function(color, percent) {
      var colorInteger = parseInt(color.slice(1), 16), amount = Math.round(2.55 * percent), R = (colorInteger >> 16) + amount, B = (colorInteger >> 8 & 255) + amount, G = (colorInteger & 255) + amount;
      return "#" + (16777216 + (R < 255 ? R < 1 ? 0 :R :255) * 65536 + (B < 255 ? B < 1 ? 0 :B :255) * 256 + (G < 255 ? G < 1 ? 0 :G :255)).toString(16).slice(1);
    };
    Common.shuffle = function(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Common.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    };
    Common.choose = function(choices) {
      return choices[Math.floor(Common.random() * choices.length)];
    };
    Common.isElement = function(obj) {
      try {
        return obj instanceof HTMLElement;
      } catch (e) {
        return typeof obj === "object" && obj.nodeType === 1 && typeof obj.style === "object" && typeof obj.ownerDocument === "object";
      }
    };
    Common.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === "[object Array]";
    };
    Common.clamp = function(value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    };
    Common.sign = function(value) {
      return value < 0 ? -1 :1;
    };
    Common.now = function() {
      var performance = window.performance || {};
      performance.now = function() {
        return performance.now || performance.webkitNow || performance.msNow || performance.oNow || performance.mozNow || function() {
          return +new Date();
        };
      }();
      return performance.now();
    };
    Common.random = function(min, max) {
      min = typeof min !== "undefined" ? min :0;
      max = typeof max !== "undefined" ? max :1;
      return min + _seededRandom() * (max - min);
    };
    Common.colorToNumber = function(colorString) {
      colorString = colorString.replace("#", "");
      if (colorString.length == 3) {
        colorString = colorString.charAt(0) + colorString.charAt(0) + colorString.charAt(1) + colorString.charAt(1) + colorString.charAt(2) + colorString.charAt(2);
      }
      return parseInt(colorString, 16);
    };
    Common.log = function(message, type) {
      if (!console || !console.log || !console.warn) return;
      switch (type) {
       case "warn":
        console.warn("Matter.js:", message);
        break;

       case "error":
        console.log("Matter.js:", message);
        break;
      }
    };
    Common.nextId = function() {
      return Common._nextId++;
    };
    Common.indexOf = function(haystack, needle) {
      if (haystack.indexOf) return haystack.indexOf(needle);
      for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) return i;
      }
      return -1;
    };
    var _seededRandom = function() {
      Common._seed = (Common._seed * 9301 + 49297) % 233280;
      return Common._seed / 233280;
    };
  })();
  var Engine = {};
  (function() {
    var _fps = 60, _delta = 1e3 / _fps;
    Engine.create = function(element, options) {
      options = Common.isElement(element) ? options :element;
      element = Common.isElement(element) ? element :null;
      var defaults = {
        enabled:true,
        positionIterations:6,
        velocityIterations:4,
        constraintIterations:2,
        enableSleeping:false,
        events:[],
        timing:{
          fps:_fps,
          timestamp:0,
          delta:_delta,
          correction:1,
          deltaMin:1e3 / _fps,
          deltaMax:1e3 / (_fps * .5),
          timeScale:1,
          isFixed:false,
          frameRequestId:0
        },
        render:{
          element:element,
          controller:Render
        },
        broadphase:{
          controller:Grid
        }
      };
      var engine = Common.extend(defaults, options);
      engine.render = engine.render.controller.create(engine.render);
      engine.world = World.create(engine.world);
      engine.pairs = Pairs.create();
      engine.broadphase = engine.broadphase.controller.create(engine.broadphase);
      engine.metrics = engine.metrics || {
        extended:false
      };
      engine.metrics = engine.metrics || Metrics.create();
      return engine;
    };
    Engine.update = function(engine, delta, correction) {
      correction = typeof correction !== "undefined" ? correction :1;
      var world = engine.world, timing = engine.timing, broadphase = engine.broadphase, broadphasePairs = [], i;
      timing.timestamp += delta * timing.timeScale;
      timing.correction = correction;
      var event = {
        timestamp:engine.timing.timestamp
      };
      Events.trigger(engine, "beforeUpdate", event);
      var allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world);
      Metrics.reset(engine.metrics);
      if (engine.enableSleeping) Sleeping.update(allBodies, timing.timeScale);
      _bodiesApplyGravity(allBodies, world.gravity);
      _bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);
      for (i = 0; i < engine.constraintIterations; i++) {
        Constraint.solveAll(allConstraints, timing.timeScale);
      }
      Constraint.postSolveAll(allBodies);
      if (broadphase.controller) {
        if (world.isModified) broadphase.controller.clear(broadphase);
        broadphase.controller.update(broadphase, allBodies, engine, world.isModified);
        broadphasePairs = broadphase.pairsList;
      } else {
        broadphasePairs = allBodies;
      }
      var collisions = broadphase.detector(broadphasePairs, engine);
      var pairs = engine.pairs, timestamp = timing.timestamp;
      Pairs.update(pairs, collisions, timestamp);
      Pairs.removeOld(pairs, timestamp);
      if (engine.enableSleeping) Sleeping.afterCollisions(pairs.list, timing.timeScale);
      if (pairs.collisionStart.length > 0) Events.trigger(engine, "collisionStart", {
        pairs:pairs.collisionStart
      });
      Resolver.preSolvePosition(pairs.list);
      for (i = 0; i < engine.positionIterations; i++) {
        Resolver.solvePosition(pairs.list, timing.timeScale);
      }
      Resolver.postSolvePosition(allBodies);
      Resolver.preSolveVelocity(pairs.list);
      for (i = 0; i < engine.velocityIterations; i++) {
        Resolver.solveVelocity(pairs.list, timing.timeScale);
      }
      if (pairs.collisionActive.length > 0) Events.trigger(engine, "collisionActive", {
        pairs:pairs.collisionActive
      });
      if (pairs.collisionEnd.length > 0) Events.trigger(engine, "collisionEnd", {
        pairs:pairs.collisionEnd
      });
      Metrics.update(engine.metrics, engine);
      _bodiesClearForces(allBodies);
      if (world.isModified) Composite.setModified(world, false, false, true);
      Events.trigger(engine, "afterUpdate", event);
      return engine;
    };
    Engine.render = function(engine) {
      var event = {
        timestamp:engine.timing.timestamp
      };
      Events.trigger(engine, "beforeRender", event);
      engine.render.controller.world(engine);
      Events.trigger(engine, "afterRender", event);
    };
    Engine.merge = function(engineA, engineB) {
      Common.extend(engineA, engineB);
      if (engineB.world) {
        engineA.world = engineB.world;
        Engine.clear(engineA);
        var bodies = Composite.allBodies(engineA.world);
        for (var i = 0; i < bodies.length; i++) {
          var body = bodies[i];
          Sleeping.set(body, false);
          body.id = Common.nextId();
        }
      }
    };
    Engine.clear = function(engine) {
      var world = engine.world;
      Pairs.clear(engine.pairs);
      var broadphase = engine.broadphase;
      if (broadphase.controller) {
        var bodies = Composite.allBodies(world);
        broadphase.controller.clear(broadphase);
        broadphase.controller.update(broadphase, bodies, engine, true);
      }
    };
    var _bodiesClearForces = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        body.force.x = 0;
        body.force.y = 0;
        body.torque = 0;
      }
    };
    var _bodiesApplyGravity = function(bodies, gravity) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.isStatic || body.isSleeping) continue;
        body.force.y += body.mass * gravity.y * .001;
        body.force.x += body.mass * gravity.x * .001;
      }
    };
    var _bodiesUpdate = function(bodies, deltaTime, timeScale, correction, worldBounds) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.isStatic || body.isSleeping) continue;
        Body.update(body, deltaTime, timeScale, correction);
      }
    };
  })();
  var Events = {};
  (function() {
    Events.on = function(object, eventNames, callback) {
      var names = eventNames.split(" "), name;
      for (var i = 0; i < names.length; i++) {
        name = names[i];
        object.events = object.events || {};
        object.events[name] = object.events[name] || [];
        object.events[name].push(callback);
      }
      return callback;
    };
    Events.off = function(object, eventNames, callback) {
      if (!eventNames) {
        object.events = {};
        return;
      }
      if (typeof eventNames === "function") {
        callback = eventNames;
        eventNames = Common.keys(object.events).join(" ");
      }
      var names = eventNames.split(" ");
      for (var i = 0; i < names.length; i++) {
        var callbacks = object.events[names[i]], newCallbacks = [];
        if (callback) {
          for (var j = 0; j < callbacks.length; j++) {
            if (callbacks[j] !== callback) newCallbacks.push(callbacks[j]);
          }
        }
        object.events[names[i]] = newCallbacks;
      }
    };
    Events.trigger = function(object, eventNames, event) {
      var names, name, callbacks, eventClone;
      if (object.events) {
        if (!event) event = {};
        names = eventNames.split(" ");
        for (var i = 0; i < names.length; i++) {
          name = names[i];
          callbacks = object.events[name];
          if (callbacks) {
            eventClone = Common.clone(event, false);
            eventClone.name = name;
            eventClone.source = object;
            for (var j = 0; j < callbacks.length; j++) {
              callbacks[j].apply(object, [ eventClone ]);
            }
          }
        }
      }
    };
  })();
  var Metrics = {};
  (function() {
    Metrics.create = function() {
      return {
        extended:false,
        narrowDetections:0,
        narrowphaseTests:0,
        narrowReuse:0,
        narrowReuseCount:0,
        midphaseTests:0,
        broadphaseTests:0,
        narrowEff:1e-4,
        midEff:1e-4,
        broadEff:1e-4,
        collisions:0,
        buckets:0,
        bodies:0,
        pairs:0
      };
    };
    Metrics.reset = function(metrics) {
      if (metrics.extended) {
        metrics.narrowDetections = 0;
        metrics.narrowphaseTests = 0;
        metrics.narrowReuse = 0;
        metrics.narrowReuseCount = 0;
        metrics.midphaseTests = 0;
        metrics.broadphaseTests = 0;
        metrics.narrowEff = 0;
        metrics.midEff = 0;
        metrics.broadEff = 0;
        metrics.collisions = 0;
        metrics.buckets = 0;
        metrics.pairs = 0;
        metrics.bodies = 0;
      }
    };
    Metrics.update = function(metrics, engine) {
      if (metrics.extended) {
        var world = engine.world, bodies = Composite.allBodies(world);
        metrics.collisions = metrics.narrowDetections;
        metrics.pairs = engine.pairs.list.length;
        metrics.bodies = bodies.length;
        metrics.midEff = (metrics.narrowDetections / (metrics.midphaseTests || 1)).toFixed(2);
        metrics.narrowEff = (metrics.narrowDetections / (metrics.narrowphaseTests || 1)).toFixed(2);
        metrics.broadEff = (1 - metrics.broadphaseTests / (bodies.length || 1)).toFixed(2);
        metrics.narrowReuse = (metrics.narrowReuseCount / (metrics.narrowphaseTests || 1)).toFixed(2);
      }
    };
  })();
  var Mouse = {};
  (function() {
    Mouse.create = function(element) {
      var mouse = {};
      if (!element) {
        Common.log("Mouse.create: element was undefined, defaulting to document.body", "warn");
      }
      mouse.element = element || document.body;
      mouse.absolute = {
        x:0,
        y:0
      };
      mouse.position = {
        x:0,
        y:0
      };
      mouse.mousedownPosition = {
        x:0,
        y:0
      };
      mouse.mouseupPosition = {
        x:0,
        y:0
      };
      mouse.offset = {
        x:0,
        y:0
      };
      mouse.scale = {
        x:1,
        y:1
      };
      mouse.wheelDelta = 0;
      mouse.button = -1;
      mouse.pixelRatio = mouse.element.getAttribute("data-pixel-ratio") || 1;
      mouse.sourceEvents = {
        mousemove:null,
        mousedown:null,
        mouseup:null,
        mousewheel:null
      };
      mouse.mousemove = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
        if (touches) {
          mouse.button = 0;
          event.preventDefault();
        }
        mouse.absolute.x = position.x;
        mouse.absolute.y = position.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
        mouse.sourceEvents.mousemove = event;
      };
      mouse.mousedown = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
        if (touches) {
          mouse.button = 0;
          event.preventDefault();
        } else {
          mouse.button = event.button;
        }
        mouse.absolute.x = position.x;
        mouse.absolute.y = position.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
        mouse.mousedownPosition.x = mouse.position.x;
        mouse.mousedownPosition.y = mouse.position.y;
        mouse.sourceEvents.mousedown = event;
      };
      mouse.mouseup = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio), touches = event.changedTouches;
        if (touches) {
          event.preventDefault();
        }
        mouse.button = -1;
        mouse.absolute.x = position.x;
        mouse.absolute.y = position.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
        mouse.mouseupPosition.x = mouse.position.x;
        mouse.mouseupPosition.y = mouse.position.y;
        mouse.sourceEvents.mouseup = event;
      };
      mouse.mousewheel = function(event) {
        mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
        event.preventDefault();
      };
      Mouse.setElement(mouse, mouse.element);
      return mouse;
    };
    Mouse.setElement = function(mouse, element) {
      mouse.element = element;
      element.addEventListener("mousemove", mouse.mousemove);
      element.addEventListener("mousedown", mouse.mousedown);
      element.addEventListener("mouseup", mouse.mouseup);
      element.addEventListener("mousewheel", mouse.mousewheel);
      element.addEventListener("DOMMouseScroll", mouse.mousewheel);
      element.addEventListener("touchmove", mouse.mousemove);
      element.addEventListener("touchstart", mouse.mousedown);
      element.addEventListener("touchend", mouse.mouseup);
    };
    Mouse.clearSourceEvents = function(mouse) {
      mouse.sourceEvents.mousemove = null;
      mouse.sourceEvents.mousedown = null;
      mouse.sourceEvents.mouseup = null;
      mouse.sourceEvents.mousewheel = null;
      mouse.wheelDelta = 0;
    };
    Mouse.setOffset = function(mouse, offset) {
      mouse.offset.x = offset.x;
      mouse.offset.y = offset.y;
      mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
      mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };
    Mouse.setScale = function(mouse, scale) {
      mouse.scale.x = scale.x;
      mouse.scale.y = scale.y;
      mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
      mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };
    var _getRelativeMousePosition = function(event, element, pixelRatio) {
      var elementBounds = element.getBoundingClientRect(), rootNode = document.documentElement || document.body.parentNode || document.body, scrollX = window.pageXOffset !== undefined ? window.pageXOffset :rootNode.scrollLeft, scrollY = window.pageYOffset !== undefined ? window.pageYOffset :rootNode.scrollTop, touches = event.changedTouches, x, y;
      if (touches) {
        x = touches[0].pageX - elementBounds.left - scrollX;
        y = touches[0].pageY - elementBounds.top - scrollY;
      } else {
        x = event.pageX - elementBounds.left - scrollX;
        y = event.pageY - elementBounds.top - scrollY;
      }
      return {
        x:x / (element.clientWidth / element.width * pixelRatio),
        y:y / (element.clientHeight / element.height * pixelRatio)
      };
    };
  })();
  var Runner = {};
  (function() {
    var _fps = 60, _deltaSampleSize = _fps, _delta = 1e3 / _fps;
    var _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      window.setTimeout(function() {
        callback(Common.now());
      }, _delta);
    };
    var _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    Runner.run = function(engine) {
      var counterTimestamp = 0, frameCounter = 0, deltaHistory = [], timePrev, timeScalePrev = 1;
      (function render(time) {
        var timing = engine.timing, delta, correction = 1;
        timing.frameRequestId = _requestAnimationFrame(render);
        if (!engine.enabled) return;
        var event = {
          timestamp:time
        };
        Events.trigger(engine, "beforeTick", event);
        if (timing.isFixed) {
          delta = timing.delta;
        } else {
          delta = time - timePrev || timing.delta;
          timePrev = time;
          deltaHistory.push(delta);
          deltaHistory = deltaHistory.slice(-_deltaSampleSize);
          delta = Math.min.apply(null, deltaHistory);
          delta = delta < timing.deltaMin ? timing.deltaMin :delta;
          delta = delta > timing.deltaMax ? timing.deltaMax :delta;
          correction = delta / timing.delta;
          timing.delta = delta;
        }
        if (timeScalePrev !== 0) correction *= timing.timeScale / timeScalePrev;
        if (timing.timeScale === 0) correction = 0;
        timeScalePrev = timing.timeScale;
        frameCounter += 1;
        if (time - counterTimestamp >= 1e3) {
          timing.fps = frameCounter * ((time - counterTimestamp) / 1e3);
          counterTimestamp = time;
          frameCounter = 0;
        }
        Events.trigger(engine, "tick", event);
        if (engine.world.isModified && engine.render.controller.clear) engine.render.controller.clear(engine.render);
        Engine.update(engine, delta, correction);
        Engine.render(engine);
        Events.trigger(engine, "afterTick", event);
      })();
    };
    Runner.stop = function(engine) {
      _cancelAnimationFrame(engine.timing.frameRequestId);
    };
  })();
  var Sleeping = {};
  (function() {
    Sleeping._motionWakeThreshold = .18;
    Sleeping._motionSleepThreshold = .08;
    Sleeping._minBias = .9;
    Sleeping.update = function(bodies, timeScale) {
      var timeFactor = timeScale * timeScale * timeScale;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;
        if (body.force.x !== 0 || body.force.y !== 0) {
          Sleeping.set(body, false);
          continue;
        }
        var minMotion = Math.min(body.motion, motion), maxMotion = Math.max(body.motion, motion);
        body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
        if (body.sleepThreshold > 0 && body.motion < Sleeping._motionSleepThreshold * timeFactor) {
          body.sleepCounter += 1;
          if (body.sleepCounter >= body.sleepThreshold) Sleeping.set(body, true);
        } else if (body.sleepCounter > 0) {
          body.sleepCounter -= 1;
        }
      }
    };
    Sleeping.afterCollisions = function(pairs, timeScale) {
      var timeFactor = timeScale * timeScale * timeScale;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (!pair.isActive) continue;
        var collision = pair.collision, bodyA = collision.bodyA.parent, bodyB = collision.bodyB.parent;
        if (bodyA.isSleeping && bodyB.isSleeping || bodyA.isStatic || bodyB.isStatic) continue;
        if (bodyA.isSleeping || bodyB.isSleeping) {
          var sleepingBody = bodyA.isSleeping && !bodyA.isStatic ? bodyA :bodyB, movingBody = sleepingBody === bodyA ? bodyB :bodyA;
          if (!sleepingBody.isStatic && movingBody.motion > Sleeping._motionWakeThreshold * timeFactor) {
            Sleeping.set(sleepingBody, false);
          }
        }
      }
    };
    Sleeping.set = function(body, isSleeping) {
      if (isSleeping) {
        body.isSleeping = true;
        body.sleepCounter = body.sleepThreshold;
        body.positionImpulse.x = 0;
        body.positionImpulse.y = 0;
        body.positionPrev.x = body.position.x;
        body.positionPrev.y = body.position.y;
        body.anglePrev = body.angle;
        body.speed = 0;
        body.angularSpeed = 0;
        body.motion = 0;
      } else {
        body.isSleeping = false;
        body.sleepCounter = 0;
      }
    };
  })();
  var Bodies = {};
  (function() {
    Bodies.rectangle = function(x, y, width, height, options) {
      options = options || {};
      var rectangle = {
        label:"Rectangle Body",
        position:{
          x:x,
          y:y
        },
        vertices:Vertices.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height)
      };
      if (options.chamfer) {
        var chamfer = options.chamfer;
        rectangle.vertices = Vertices.chamfer(rectangle.vertices, chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
        delete options.chamfer;
      }
      return Body.create(Common.extend({}, rectangle, options));
    };
    Bodies.trapezoid = function(x, y, width, height, slope, options) {
      options = options || {};
      slope *= .5;
      var roof = (1 - slope * 2) * width;
      var x1 = width * slope, x2 = x1 + roof, x3 = x2 + x1;
      var trapezoid = {
        label:"Trapezoid Body",
        position:{
          x:x,
          y:y
        },
        vertices:Vertices.fromPath("L 0 0 L " + x1 + " " + -height + " L " + x2 + " " + -height + " L " + x3 + " 0")
      };
      if (options.chamfer) {
        var chamfer = options.chamfer;
        trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
        delete options.chamfer;
      }
      return Body.create(Common.extend({}, trapezoid, options));
    };
    Bodies.circle = function(x, y, radius, options, maxSides) {
      options = options || {};
      options.label = "Circle Body";
      maxSides = maxSides || 25;
      var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));
      if (sides % 2 === 1) sides += 1;
      options.circleRadius = radius;
      return Bodies.polygon(x, y, sides, radius, options);
    };
    Bodies.polygon = function(x, y, sides, radius, options) {
      options = options || {};
      if (sides < 3) return Bodies.circle(x, y, radius, options);
      var theta = 2 * Math.PI / sides, path = "", offset = theta * .5;
      for (var i = 0; i < sides; i += 1) {
        var angle = offset + i * theta, xx = Math.cos(angle) * radius, yy = Math.sin(angle) * radius;
        path += "L " + xx.toFixed(3) + " " + yy.toFixed(3) + " ";
      }
      var polygon = {
        label:"Polygon Body",
        position:{
          x:x,
          y:y
        },
        vertices:Vertices.fromPath(path)
      };
      if (options.chamfer) {
        var chamfer = options.chamfer;
        polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
        delete options.chamfer;
      }
      return Body.create(Common.extend({}, polygon, options));
    };
    Bodies.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea) {
      var body, parts, isConvex, vertices, i, j, k, v, z;
      options = options || {};
      parts = [];
      flagInternal = typeof flagInternal !== "undefined" ? flagInternal :false;
      removeCollinear = typeof removeCollinear !== "undefined" ? removeCollinear :.01;
      minimumArea = typeof minimumArea !== "undefined" ? minimumArea :10;
      if (!window.decomp) {
        Common.log("Bodies.fromVertices: poly-decomp.js required. Could not decompose vertices. Fallback to convex hull.", "warn");
      }
      if (!Common.isArray(vertexSets[0])) {
        vertexSets = [ vertexSets ];
      }
      for (v = 0; v < vertexSets.length; v += 1) {
        vertices = vertexSets[v];
        isConvex = Vertices.isConvex(vertices);
        if (isConvex || !window.decomp) {
          if (isConvex) {
            vertices = Vertices.clockwiseSort(vertices);
          } else {
            vertices = Vertices.hull(vertices);
          }
          parts.push({
            position:{
              x:x,
              y:y
            },
            vertices:vertices
          });
        } else {
          var concave = new decomp.Polygon();
          for (i = 0; i < vertices.length; i++) {
            concave.vertices.push([ vertices[i].x, vertices[i].y ]);
          }
          concave.makeCCW();
          if (removeCollinear !== false) concave.removeCollinearPoints(removeCollinear);
          var decomposed = concave.quickDecomp();
          for (i = 0; i < decomposed.length; i++) {
            var chunk = decomposed[i], chunkVertices = [];
            for (j = 0; j < chunk.vertices.length; j++) {
              chunkVertices.push({
                x:chunk.vertices[j][0],
                y:chunk.vertices[j][1]
              });
            }
            if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea) continue;
            parts.push({
              position:Vertices.centre(chunkVertices),
              vertices:chunkVertices
            });
          }
        }
      }
      for (i = 0; i < parts.length; i++) {
        parts[i] = Body.create(Common.extend(parts[i], options));
      }
      if (flagInternal) {
        var coincident_max_dist = 5;
        for (i = 0; i < parts.length; i++) {
          var partA = parts[i];
          for (j = i + 1; j < parts.length; j++) {
            var partB = parts[j];
            if (Bounds.overlaps(partA.bounds, partB.bounds)) {
              var pav = partA.vertices, pbv = partB.vertices;
              for (k = 0; k < partA.vertices.length; k++) {
                for (z = 0; z < partB.vertices.length; z++) {
                  var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])), db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));
                  if (da < coincident_max_dist && db < coincident_max_dist) {
                    pav[k].isInternal = true;
                    pbv[z].isInternal = true;
                  }
                }
              }
            }
          }
        }
      }
      if (parts.length > 1) {
        body = Body.create(Common.extend({
          parts:parts.slice(0)
        }, options));
        Body.setPosition(body, {
          x:x,
          y:y
        });
        return body;
      } else {
        return parts[0];
      }
    };
  })();
  var Composites = {};
  (function() {
    Composites.stack = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
      var stack = Composite.create({
        label:"Stack"
      }), x = xx, y = yy, lastBody, i = 0;
      for (var row = 0; row < rows; row++) {
        var maxHeight = 0;
        for (var column = 0; column < columns; column++) {
          var body = callback(x, y, column, row, lastBody, i);
          if (body) {
            var bodyHeight = body.bounds.max.y - body.bounds.min.y, bodyWidth = body.bounds.max.x - body.bounds.min.x;
            if (bodyHeight > maxHeight) maxHeight = bodyHeight;
            Body.translate(body, {
              x:bodyWidth * .5,
              y:bodyHeight * .5
            });
            x = body.bounds.max.x + columnGap;
            Composite.addBody(stack, body);
            lastBody = body;
            i += 1;
          } else {
            x += columnGap;
          }
        }
        y += maxHeight + rowGap;
        x = xx;
      }
      return stack;
    };
    Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
      var bodies = composite.bodies;
      for (var i = 1; i < bodies.length; i++) {
        var bodyA = bodies[i - 1], bodyB = bodies[i], bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y, bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y, bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
        var defaults = {
          bodyA:bodyA,
          pointA:{
            x:bodyAWidth * xOffsetA,
            y:bodyAHeight * yOffsetA
          },
          bodyB:bodyB,
          pointB:{
            x:bodyBWidth * xOffsetB,
            y:bodyBHeight * yOffsetB
          }
        };
        var constraint = Common.extend(defaults, options);
        Composite.addConstraint(composite, Constraint.create(constraint));
      }
      composite.label += " Chain";
      return composite;
    };
    Composites.mesh = function(composite, columns, rows, crossBrace, options) {
      var bodies = composite.bodies, row, col, bodyA, bodyB, bodyC;
      for (row = 0; row < rows; row++) {
        for (col = 1; col < columns; col++) {
          bodyA = bodies[col - 1 + row * columns];
          bodyB = bodies[col + row * columns];
          Composite.addConstraint(composite, Constraint.create(Common.extend({
            bodyA:bodyA,
            bodyB:bodyB
          }, options)));
        }
        if (row > 0) {
          for (col = 0; col < columns; col++) {
            bodyA = bodies[col + (row - 1) * columns];
            bodyB = bodies[col + row * columns];
            Composite.addConstraint(composite, Constraint.create(Common.extend({
              bodyA:bodyA,
              bodyB:bodyB
            }, options)));
            if (crossBrace && col > 0) {
              bodyC = bodies[col - 1 + (row - 1) * columns];
              Composite.addConstraint(composite, Constraint.create(Common.extend({
                bodyA:bodyC,
                bodyB:bodyB
              }, options)));
            }
            if (crossBrace && col < columns - 1) {
              bodyC = bodies[col + 1 + (row - 1) * columns];
              Composite.addConstraint(composite, Constraint.create(Common.extend({
                bodyA:bodyC,
                bodyB:bodyB
              }, options)));
            }
          }
        }
      }
      composite.label += " Mesh";
      return composite;
    };
    Composites.pyramid = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
      return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
        var actualRows = Math.min(rows, Math.ceil(columns / 2)), lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x :0;
        if (row > actualRows) return;
        row = actualRows - row;
        var start = row, end = columns - 1 - row;
        if (column < start || column > end) return;
        if (i === 1) {
          Body.translate(lastBody, {
            x:(column + (columns % 2 === 1 ? 1 :-1)) * lastBodyWidth,
            y:0
          });
        }
        var xOffset = lastBody ? column * lastBodyWidth :0;
        return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
      });
    };
    Composites.newtonsCradle = function(xx, yy, number, size, length) {
      var newtonsCradle = Composite.create({
        label:"Newtons Cradle"
      });
      for (var i = 0; i < number; i++) {
        var separation = 1.9, circle = Bodies.circle(xx + i * (size * separation), yy + length, size, {
          inertia:99999,
          restitution:1,
          friction:0,
          frictionAir:1e-4,
          slop:.01
        }), constraint = Constraint.create({
          pointA:{
            x:xx + i * (size * separation),
            y:yy
          },
          bodyB:circle
        });
        Composite.addBody(newtonsCradle, circle);
        Composite.addConstraint(newtonsCradle, constraint);
      }
      return newtonsCradle;
    };
    Composites.car = function(xx, yy, width, height, wheelSize) {
      var group = Body.nextGroup(true), wheelBase = -20, wheelAOffset = -width * .5 + wheelBase, wheelBOffset = width * .5 - wheelBase, wheelYOffset = 0;
      var car = Composite.create({
        label:"Car"
      }), body = Bodies.trapezoid(xx, yy, width, height, .3, {
        collisionFilter:{
          group:group
        },
        friction:.01,
        chamfer:{
          radius:10
        }
      });
      var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
        collisionFilter:{
          group:group
        },
        restitution:.5,
        friction:.9,
        frictionStatic:10,
        slop:.5,
        density:.01
      });
      var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
        collisionFilter:{
          group:group
        },
        restitution:.5,
        friction:.9,
        frictionStatic:10,
        slop:.5,
        density:.01
      });
      var axelA = Constraint.create({
        bodyA:body,
        pointA:{
          x:wheelAOffset,
          y:wheelYOffset
        },
        bodyB:wheelA,
        stiffness:.5
      });
      var axelB = Constraint.create({
        bodyA:body,
        pointA:{
          x:wheelBOffset,
          y:wheelYOffset
        },
        bodyB:wheelB,
        stiffness:.5
      });
      Composite.addBody(car, body);
      Composite.addBody(car, wheelA);
      Composite.addBody(car, wheelB);
      Composite.addConstraint(car, axelA);
      Composite.addConstraint(car, axelB);
      return car;
    };
    Composites.softBody = function(xx, yy, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
      particleOptions = Common.extend({
        inertia:Infinity
      }, particleOptions);
      constraintOptions = Common.extend({
        stiffness:.4
      }, constraintOptions);
      var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y) {
        return Bodies.circle(x, y, particleRadius, particleOptions);
      });
      Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);
      softBody.label = "Soft Body";
      return softBody;
    };
  })();
  var Axes = {};
  (function() {
    Axes.fromVertices = function(vertices) {
      var axes = {};
      for (var i = 0; i < vertices.length; i++) {
        var j = (i + 1) % vertices.length, normal = Vector.normalise({
          x:vertices[j].y - vertices[i].y,
          y:vertices[i].x - vertices[j].x
        }), gradient = normal.y === 0 ? Infinity :normal.x / normal.y;
        gradient = gradient.toFixed(3).toString();
        axes[gradient] = normal;
      }
      return Common.values(axes);
    };
    Axes.rotate = function(axes, angle) {
      if (angle === 0) return;
      var cos = Math.cos(angle), sin = Math.sin(angle);
      for (var i = 0; i < axes.length; i++) {
        var axis = axes[i], xx;
        xx = axis.x * cos - axis.y * sin;
        axis.y = axis.x * sin + axis.y * cos;
        axis.x = xx;
      }
    };
  })();
  var Bounds = {};
  (function() {
    Bounds.create = function(vertices) {
      var bounds = {
        min:{
          x:0,
          y:0
        },
        max:{
          x:0,
          y:0
        }
      };
      if (vertices) Bounds.update(bounds, vertices);
      return bounds;
    };
    Bounds.update = function(bounds, vertices, velocity) {
      bounds.min.x = Number.MAX_VALUE;
      bounds.max.x = Number.MIN_VALUE;
      bounds.min.y = Number.MAX_VALUE;
      bounds.max.y = Number.MIN_VALUE;
      for (var i = 0; i < vertices.length; i++) {
        var vertex = vertices[i];
        if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
        if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
        if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
        if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
      }
      if (velocity) {
        if (velocity.x > 0) {
          bounds.max.x += velocity.x;
        } else {
          bounds.min.x += velocity.x;
        }
        if (velocity.y > 0) {
          bounds.max.y += velocity.y;
        } else {
          bounds.min.y += velocity.y;
        }
      }
    };
    Bounds.contains = function(bounds, point) {
      return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
    };
    Bounds.overlaps = function(boundsA, boundsB) {
      return boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y;
    };
    Bounds.translate = function(bounds, vector) {
      bounds.min.x += vector.x;
      bounds.max.x += vector.x;
      bounds.min.y += vector.y;
      bounds.max.y += vector.y;
    };
    Bounds.shift = function(bounds, position) {
      var deltaX = bounds.max.x - bounds.min.x, deltaY = bounds.max.y - bounds.min.y;
      bounds.min.x = position.x;
      bounds.max.x = position.x + deltaX;
      bounds.min.y = position.y;
      bounds.max.y = position.y + deltaY;
    };
  })();
  var Svg = {};
  (function() {
    Svg.pathToVertices = function(path, sampleLength) {
      var i, il, total, point, segment, segments, segmentsQueue, lastSegment, lastPoint, segmentIndex, points = [], length = 0, x = 0, y = 0;
      sampleLength = sampleLength || 15;
      var addPoint = function(px, py, pathSegType) {
        var isRelative = pathSegType % 2 === 1 && pathSegType > 1;
        if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
          if (lastPoint && isRelative) {
            lx = lastPoint.x;
            ly = lastPoint.y;
          } else {
            lx = 0;
            ly = 0;
          }
          var point = {
            x:lx + px,
            y:ly + py
          };
          if (isRelative || !lastPoint) {
            lastPoint = point;
          }
          points.push(point);
          x = lx + px;
          y = ly + py;
        }
      };
      var addSegmentPoint = function(segment) {
        var segType = segment.pathSegTypeAsLetter.toUpperCase();
        if (segType === "Z") return;
        switch (segType) {
         case "M":
         case "L":
         case "T":
         case "C":
         case "S":
         case "Q":
          x = segment.x;
          y = segment.y;
          break;

         case "H":
          x = segment.x;
          break;

         case "V":
          y = segment.y;
          break;
        }
        addPoint(x, y, segment.pathSegType);
      };
      _svgPathToAbsolute(path);
      total = path.getTotalLength();
      segments = [];
      for (i = 0; i < path.pathSegList.numberOfItems; i += 1) segments.push(path.pathSegList.getItem(i));
      segmentsQueue = segments.concat();
      while (length < total) {
        segmentIndex = path.getPathSegAtLength(length);
        segment = segments[segmentIndex];
        if (segment != lastSegment) {
          while (segmentsQueue.length && segmentsQueue[0] != segment) addSegmentPoint(segmentsQueue.shift());
          lastSegment = segment;
        }
        switch (segment.pathSegTypeAsLetter.toUpperCase()) {
         case "C":
         case "T":
         case "S":
         case "Q":
         case "A":
          point = path.getPointAtLength(length);
          addPoint(point.x, point.y, 0);
          break;
        }
        length += sampleLength;
      }
      for (i = 0, il = segmentsQueue.length; i < il; ++i) addSegmentPoint(segmentsQueue[i]);
      return points;
    };
    var _svgPathToAbsolute = function(path) {
      var x0, y0, x1, y1, x2, y2, segs = path.pathSegList, x = 0, y = 0, len = segs.numberOfItems;
      for (var i = 0; i < len; ++i) {
        var seg = segs.getItem(i), segType = seg.pathSegTypeAsLetter;
        if (/[MLHVCSQTA]/.test(segType)) {
          if ("x" in seg) x = seg.x;
          if ("y" in seg) y = seg.y;
        } else {
          if ("x1" in seg) x1 = x + seg.x1;
          if ("x2" in seg) x2 = x + seg.x2;
          if ("y1" in seg) y1 = y + seg.y1;
          if ("y2" in seg) y2 = y + seg.y2;
          if ("x" in seg) x += seg.x;
          if ("y" in seg) y += seg.y;
          switch (segType) {
           case "m":
            segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
            break;

           case "l":
            segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
            break;

           case "h":
            segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
            break;

           case "v":
            segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
            break;

           case "c":
            segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
            break;

           case "s":
            segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
            break;

           case "q":
            segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
            break;

           case "t":
            segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
            break;

           case "a":
            segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
            break;

           case "z":
           case "Z":
            x = x0;
            y = y0;
            break;
          }
        }
        if (segType == "M" || segType == "m") {
          x0 = x;
          y0 = y;
        }
      }
    };
  })();
  var Vector = {};
  (function() {
    Vector.create = function(x, y) {
      return {
        x:x || 0,
        y:y || 0
      };
    };
    Vector.clone = function(vector) {
      return {
        x:vector.x,
        y:vector.y
      };
    };
    Vector.magnitude = function(vector) {
      return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    };
    Vector.magnitudeSquared = function(vector) {
      return vector.x * vector.x + vector.y * vector.y;
    };
    Vector.rotate = function(vector, angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return {
        x:vector.x * cos - vector.y * sin,
        y:vector.x * sin + vector.y * cos
      };
    };
    Vector.rotateAbout = function(vector, angle, point, output) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      if (!output) output = {};
      var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
      output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
      output.x = x;
      return output;
    };
    Vector.normalise = function(vector) {
      var magnitude = Vector.magnitude(vector);
      if (magnitude === 0) return {
        x:0,
        y:0
      };
      return {
        x:vector.x / magnitude,
        y:vector.y / magnitude
      };
    };
    Vector.dot = function(vectorA, vectorB) {
      return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
    };
    Vector.cross = function(vectorA, vectorB) {
      return vectorA.x * vectorB.y - vectorA.y * vectorB.x;
    };
    Vector.cross3 = function(vectorA, vectorB, vectorC) {
      return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
    };
    Vector.add = function(vectorA, vectorB, output) {
      if (!output) output = {};
      output.x = vectorA.x + vectorB.x;
      output.y = vectorA.y + vectorB.y;
      return output;
    };
    Vector.sub = function(vectorA, vectorB, output) {
      if (!output) output = {};
      output.x = vectorA.x - vectorB.x;
      output.y = vectorA.y - vectorB.y;
      return output;
    };
    Vector.mult = function(vector, scalar) {
      return {
        x:vector.x * scalar,
        y:vector.y * scalar
      };
    };
    Vector.div = function(vector, scalar) {
      return {
        x:vector.x / scalar,
        y:vector.y / scalar
      };
    };
    Vector.perp = function(vector, negate) {
      negate = negate === true ? -1 :1;
      return {
        x:negate * -vector.y,
        y:negate * vector.x
      };
    };
    Vector.neg = function(vector) {
      return {
        x:-vector.x,
        y:-vector.y
      };
    };
    Vector.angle = function(vectorA, vectorB) {
      return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
    };
    Vector._temp = [ Vector.create(), Vector.create(), Vector.create(), Vector.create(), Vector.create(), Vector.create() ];
  })();
  var Vertices = {};
  (function() {
    Vertices.create = function(points, body) {
      var vertices = [];
      for (var i = 0; i < points.length; i++) {
        var point = points[i], vertex = {
          x:point.x,
          y:point.y,
          index:i,
          body:body,
          isInternal:false
        };
        vertices.push(vertex);
      }
      return vertices;
    };
    Vertices.fromPath = function(path, body) {
      var pathPattern = /L?\s*([\-\d\.e]+)[\s,]*([\-\d\.e]+)*/gi, points = [];
      path.replace(pathPattern, function(match, x, y) {
        points.push({
          x:parseFloat(x),
          y:parseFloat(y)
        });
      });
      return Vertices.create(points, body);
    };
    Vertices.centre = function(vertices) {
      var area = Vertices.area(vertices, true), centre = {
        x:0,
        y:0
      }, cross, temp, j;
      for (var i = 0; i < vertices.length; i++) {
        j = (i + 1) % vertices.length;
        cross = Vector.cross(vertices[i], vertices[j]);
        temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
        centre = Vector.add(centre, temp);
      }
      return Vector.div(centre, 6 * area);
    };
    Vertices.mean = function(vertices) {
      var average = {
        x:0,
        y:0
      };
      for (var i = 0; i < vertices.length; i++) {
        average.x += vertices[i].x;
        average.y += vertices[i].y;
      }
      return Vector.div(average, vertices.length);
    };
    Vertices.area = function(vertices, signed) {
      var area = 0, j = vertices.length - 1;
      for (var i = 0; i < vertices.length; i++) {
        area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
        j = i;
      }
      if (signed) return area / 2;
      return Math.abs(area) / 2;
    };
    Vertices.inertia = function(vertices, mass) {
      var numerator = 0, denominator = 0, v = vertices, cross, j;
      for (var n = 0; n < v.length; n++) {
        j = (n + 1) % v.length;
        cross = Math.abs(Vector.cross(v[j], v[n]));
        numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
        denominator += cross;
      }
      return mass / 6 * (numerator / denominator);
    };
    Vertices.translate = function(vertices, vector, scalar) {
      var i;
      if (scalar) {
        for (i = 0; i < vertices.length; i++) {
          vertices[i].x += vector.x * scalar;
          vertices[i].y += vector.y * scalar;
        }
      } else {
        for (i = 0; i < vertices.length; i++) {
          vertices[i].x += vector.x;
          vertices[i].y += vector.y;
        }
      }
      return vertices;
    };
    Vertices.rotate = function(vertices, angle, point) {
      if (angle === 0) return;
      var cos = Math.cos(angle), sin = Math.sin(angle);
      for (var i = 0; i < vertices.length; i++) {
        var vertice = vertices[i], dx = vertice.x - point.x, dy = vertice.y - point.y;
        vertice.x = point.x + (dx * cos - dy * sin);
        vertice.y = point.y + (dx * sin + dy * cos);
      }
      return vertices;
    };
    Vertices.contains = function(vertices, point) {
      for (var i = 0; i < vertices.length; i++) {
        var vertice = vertices[i], nextVertice = vertices[(i + 1) % vertices.length];
        if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
          return false;
        }
      }
      return true;
    };
    Vertices.scale = function(vertices, scaleX, scaleY, point) {
      if (scaleX === 1 && scaleY === 1) return vertices;
      point = point || Vertices.centre(vertices);
      var vertex, delta;
      for (var i = 0; i < vertices.length; i++) {
        vertex = vertices[i];
        delta = Vector.sub(vertex, point);
        vertices[i].x = point.x + delta.x * scaleX;
        vertices[i].y = point.y + delta.y * scaleY;
      }
      return vertices;
    };
    Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
      radius = radius || [ 8 ];
      if (!radius.length) radius = [ radius ];
      quality = typeof quality !== "undefined" ? quality :-1;
      qualityMin = qualityMin || 2;
      qualityMax = qualityMax || 14;
      var newVertices = [];
      for (var i = 0; i < vertices.length; i++) {
        var prevVertex = vertices[i - 1 >= 0 ? i - 1 :vertices.length - 1], vertex = vertices[i], nextVertex = vertices[(i + 1) % vertices.length], currentRadius = radius[i < radius.length ? i :radius.length - 1];
        if (currentRadius === 0) {
          newVertices.push(vertex);
          continue;
        }
        var prevNormal = Vector.normalise({
          x:vertex.y - prevVertex.y,
          y:prevVertex.x - vertex.x
        });
        var nextNormal = Vector.normalise({
          x:nextVertex.y - vertex.y,
          y:vertex.x - nextVertex.x
        });
        var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)), radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius), midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), .5)), scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));
        var precision = quality;
        if (quality === -1) {
          precision = Math.pow(currentRadius, .32) * 1.75;
        }
        precision = Common.clamp(precision, qualityMin, qualityMax);
        if (precision % 2 === 1) precision += 1;
        var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)), theta = alpha / precision;
        for (var j = 0; j < precision; j++) {
          newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
        }
      }
      return newVertices;
    };
    Vertices.clockwiseSort = function(vertices) {
      var centre = Vertices.mean(vertices);
      vertices.sort(function(vertexA, vertexB) {
        return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
      });
      return vertices;
    };
    Vertices.isConvex = function(vertices) {
      var flag = 0, n = vertices.length, i, j, k, z;
      if (n < 3) return null;
      for (i = 0; i < n; i++) {
        j = (i + 1) % n;
        k = (i + 2) % n;
        z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
        z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);
        if (z < 0) {
          flag |= 1;
        } else if (z > 0) {
          flag |= 2;
        }
        if (flag === 3) {
          return false;
        }
      }
      if (flag !== 0) {
        return true;
      } else {
        return null;
      }
    };
    Vertices.hull = function(vertices) {
      var upper = [], lower = [], vertex, i;
      vertices = vertices.slice(0);
      vertices.sort(function(vertexA, vertexB) {
        var dx = vertexA.x - vertexB.x;
        return dx !== 0 ? dx :vertexA.y - vertexB.y;
      });
      for (i = 0; i < vertices.length; i++) {
        vertex = vertices[i];
        while (lower.length >= 2 && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
          lower.pop();
        }
        lower.push(vertex);
      }
      for (i = vertices.length - 1; i >= 0; i--) {
        vertex = vertices[i];
        while (upper.length >= 2 && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
          upper.pop();
        }
        upper.push(vertex);
      }
      upper.pop();
      lower.pop();
      return upper.concat(lower);
    };
  })();
  var Render = {};
  (function() {
    Render.create = function(options) {
      var defaults = {
        controller:Render,
        element:null,
        canvas:null,
        options:{
          width:800,
          height:600,
          pixelRatio:1,
          background:"#fafafa",
          wireframeBackground:"#222",
          hasBounds:false,
          enabled:true,
          wireframes:true,
          showSleeping:true,
          showDebug:false,
          showBroadphase:false,
          showBounds:false,
          showVelocity:false,
          showCollisions:false,
          showSeparations:false,
          showAxes:false,
          showPositions:false,
          showAngleIndicator:false,
          showIds:false,
          showShadows:false,
          showVertexNumbers:false,
          showConvexHulls:false,
          showInternalEdges:false
        }
      };
      var render = Common.extend(defaults, options);
      render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
      render.context = render.canvas.getContext("2d");
      render.textures = {};
      render.bounds = render.bounds || {
        min:{
          x:0,
          y:0
        },
        max:{
          x:render.options.width,
          y:render.options.height
        }
      };
      if (render.options.pixelRatio !== 1) {
        Render.setPixelRatio(render, render.options.pixelRatio);
      }
      if (Common.isElement(render.element)) {
        render.element.appendChild(render.canvas);
      } else {
        Common.log("Render.create: options.element was undefined, render.canvas was created but not appended", "warn");
      }
      return render;
    };
    Render.setPixelRatio = function(render, pixelRatio) {
      var options = render.options, canvas = render.canvas;
      if (pixelRatio === "auto") {
        pixelRatio = _getPixelRatio(canvas);
      }
      options.pixelRatio = pixelRatio;
      canvas.setAttribute("data-pixel-ratio", pixelRatio);
      canvas.width = options.width * pixelRatio;
      canvas.height = options.height * pixelRatio;
      canvas.style.width = options.width + "px";
      canvas.style.height = options.height + "px";
      render.context.scale(pixelRatio, pixelRatio);
    };
    Render.world = function(engine) {
      var render = engine.render, world = engine.world, canvas = render.canvas, context = render.context, options = render.options, allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world), background = options.wireframes ? options.wireframeBackground :options.background, bodies = [], constraints = [], i;
      if (render.currentBackground !== background) _applyBackground(render, background);
      context.globalCompositeOperation = "source-in";
      context.fillStyle = "transparent";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      if (options.hasBounds) {
        var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / options.width, boundsScaleY = boundsHeight / options.height;
        for (i = 0; i < allBodies.length; i++) {
          var body = allBodies[i];
          if (Bounds.overlaps(body.bounds, render.bounds)) bodies.push(body);
        }
        for (i = 0; i < allConstraints.length; i++) {
          var constraint = allConstraints[i], bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointAWorld = constraint.pointA, pointBWorld = constraint.pointB;
          if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
          if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);
          if (!pointAWorld || !pointBWorld) continue;
          if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld)) constraints.push(constraint);
        }
        context.scale(1 / boundsScaleX, 1 / boundsScaleY);
        context.translate(-render.bounds.min.x, -render.bounds.min.y);
      } else {
        constraints = allConstraints;
        bodies = allBodies;
      }
      if (!options.wireframes || engine.enableSleeping && options.showSleeping) {
        Render.bodies(engine, bodies, context);
      } else {
        if (options.showConvexHulls) Render.bodyConvexHulls(engine, bodies, context);
        Render.bodyWireframes(engine, bodies, context);
      }
      if (options.showBounds) Render.bodyBounds(engine, bodies, context);
      if (options.showAxes || options.showAngleIndicator) Render.bodyAxes(engine, bodies, context);
      if (options.showPositions) Render.bodyPositions(engine, bodies, context);
      if (options.showVelocity) Render.bodyVelocity(engine, bodies, context);
      if (options.showIds) Render.bodyIds(engine, bodies, context);
      if (options.showSeparations) Render.separations(engine, engine.pairs.list, context);
      if (options.showCollisions) Render.collisions(engine, engine.pairs.list, context);
      if (options.showVertexNumbers) Render.vertexNumbers(engine, bodies, context);
      Render.constraints(constraints, context);
      if (options.showBroadphase && engine.broadphase.controller === Grid) Render.grid(engine, engine.broadphase, context);
      if (options.showDebug) Render.debug(engine, context);
      if (options.hasBounds) {
        context.setTransform(options.pixelRatio, 0, 0, options.pixelRatio, 0, 0);
      }
    };
    Render.debug = function(engine, context) {
      var c = context, world = engine.world, render = engine.render, options = render.options, bodies = Composite.allBodies(world), space = "    ";
      if (engine.timing.timestamp - (render.debugTimestamp || 0) >= 500) {
        var text = "";
        text += "fps: " + Math.round(engine.timing.fps) + space;
        if (engine.metrics.extended) {
          text += "delta: " + engine.timing.delta.toFixed(3) + space;
          text += "correction: " + engine.timing.correction.toFixed(3) + space;
          text += "bodies: " + bodies.length + space;
          if (engine.broadphase.controller === Grid) text += "buckets: " + engine.metrics.buckets + space;
          text += "\n";
          text += "collisions: " + engine.metrics.collisions + space;
          text += "pairs: " + engine.pairs.list.length + space;
          text += "broad: " + engine.metrics.broadEff + space;
          text += "mid: " + engine.metrics.midEff + space;
          text += "narrow: " + engine.metrics.narrowEff + space;
        }
        render.debugString = text;
        render.debugTimestamp = engine.timing.timestamp;
      }
      if (render.debugString) {
        c.font = "12px Arial";
        if (options.wireframes) {
          c.fillStyle = "rgba(255,255,255,0.5)";
        } else {
          c.fillStyle = "rgba(0,0,0,0.5)";
        }
        var split = render.debugString.split("\n");
        for (var i = 0; i < split.length; i++) {
          c.fillText(split[i], 50, 50 + i * 18);
        }
      }
    };
    Render.constraints = function(constraints, context) {
      var c = context;
      for (var i = 0; i < constraints.length; i++) {
        var constraint = constraints[i];
        if (!constraint.render.visible || !constraint.pointA || !constraint.pointB) continue;
        var bodyA = constraint.bodyA, bodyB = constraint.bodyB;
        if (bodyA) {
          c.beginPath();
          c.moveTo(bodyA.position.x + constraint.pointA.x, bodyA.position.y + constraint.pointA.y);
        } else {
          c.beginPath();
          c.moveTo(constraint.pointA.x, constraint.pointA.y);
        }
        if (bodyB) {
          c.lineTo(bodyB.position.x + constraint.pointB.x, bodyB.position.y + constraint.pointB.y);
        } else {
          c.lineTo(constraint.pointB.x, constraint.pointB.y);
        }
        c.lineWidth = constraint.render.lineWidth;
        c.strokeStyle = constraint.render.strokeStyle;
        c.stroke();
      }
    };
    Render.bodyShadows = function(engine, bodies, context) {
      var c = context, render = engine.render;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        if (body.circleRadius) {
          c.beginPath();
          c.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
          c.closePath();
        } else {
          c.beginPath();
          c.moveTo(body.vertices[0].x, body.vertices[0].y);
          for (var j = 1; j < body.vertices.length; j++) {
            c.lineTo(body.vertices[j].x, body.vertices[j].y);
          }
          c.closePath();
        }
        var distanceX = body.position.x - render.options.width * .5, distanceY = body.position.y - render.options.height * .2, distance = Math.abs(distanceX) + Math.abs(distanceY);
        c.shadowColor = "rgba(0,0,0,0.15)";
        c.shadowOffsetX = .05 * distanceX;
        c.shadowOffsetY = .05 * distanceY;
        c.shadowBlur = 1 + 12 * Math.min(1, distance / 1e3);
        c.fill();
        c.shadowColor = null;
        c.shadowOffsetX = null;
        c.shadowOffsetY = null;
        c.shadowBlur = null;
      }
    };
    Render.bodies = function(engine, bodies, context) {
      var c = context, render = engine.render, options = render.options, body, part, i;
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (!body.render.visible) continue;
        for (k = body.parts.length > 1 ? 1 :0; k < body.parts.length; k++) {
          part = body.parts[k];
          if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
            var sprite = part.render.sprite, texture = _getTexture(render, sprite.texture);
            if (options.showSleeping && body.isSleeping) c.globalAlpha = .5;
            c.translate(part.position.x, part.position.y);
            c.rotate(part.angle);
            c.drawImage(texture, texture.width * -.5 * sprite.xScale, texture.height * -.5 * sprite.yScale, texture.width * sprite.xScale, texture.height * sprite.yScale);
            c.rotate(-part.angle);
            c.translate(-part.position.x, -part.position.y);
            if (options.showSleeping && body.isSleeping) c.globalAlpha = 1;
          } else {
            if (part.circleRadius) {
              c.beginPath();
              c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
            } else {
              c.beginPath();
              c.moveTo(part.vertices[0].x, part.vertices[0].y);
              for (var j = 1; j < part.vertices.length; j++) {
                c.lineTo(part.vertices[j].x, part.vertices[j].y);
              }
              c.closePath();
            }
            if (!options.wireframes) {
              if (options.showSleeping && body.isSleeping) {
                c.fillStyle = Common.shadeColor(part.render.fillStyle, 50);
              } else {
                c.fillStyle = part.render.fillStyle;
              }
              c.lineWidth = part.render.lineWidth;
              c.strokeStyle = part.render.strokeStyle;
              c.fill();
              c.stroke();
            } else {
              c.lineWidth = 1;
              c.strokeStyle = "#bbb";
              if (options.showSleeping && body.isSleeping) c.strokeStyle = "rgba(255,255,255,0.2)";
              c.stroke();
            }
          }
        }
      }
    };
    Render.bodyWireframes = function(engine, bodies, context) {
      var c = context, showInternalEdges = engine.render.options.showInternalEdges, body, part, i, j, k;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (!body.render.visible) continue;
        for (k = body.parts.length > 1 ? 1 :0; k < body.parts.length; k++) {
          part = body.parts[k];
          c.moveTo(part.vertices[0].x, part.vertices[0].y);
          for (j = 1; j < part.vertices.length; j++) {
            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
              c.lineTo(part.vertices[j].x, part.vertices[j].y);
            } else {
              c.moveTo(part.vertices[j].x, part.vertices[j].y);
            }
            if (part.vertices[j].isInternal && !showInternalEdges) {
              c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
            }
          }
          c.lineTo(part.vertices[0].x, part.vertices[0].y);
        }
      }
      c.lineWidth = 1;
      c.strokeStyle = "#bbb";
      c.stroke();
    };
    Render.bodyConvexHulls = function(engine, bodies, context) {
      var c = context, body, part, i, j, k;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (!body.render.visible || body.parts.length === 1) continue;
        c.moveTo(body.vertices[0].x, body.vertices[0].y);
        for (j = 1; j < body.vertices.length; j++) {
          c.lineTo(body.vertices[j].x, body.vertices[j].y);
        }
        c.lineTo(body.vertices[0].x, body.vertices[0].y);
      }
      c.lineWidth = 1;
      c.strokeStyle = "rgba(255,255,255,0.2)";
      c.stroke();
    };
    Render.vertexNumbers = function(engine, bodies, context) {
      var c = context, i, j, k;
      for (i = 0; i < bodies.length; i++) {
        var parts = bodies[i].parts;
        for (k = parts.length > 1 ? 1 :0; k < parts.length; k++) {
          var part = parts[k];
          for (j = 0; j < part.vertices.length; j++) {
            c.fillStyle = "rgba(255,255,255,0.2)";
            c.fillText(i + "_" + j, part.position.x + (part.vertices[j].x - part.position.x) * .8, part.position.y + (part.vertices[j].y - part.position.y) * .8);
          }
        }
      }
    };
    Render.bodyBounds = function(engine, bodies, context) {
      var c = context, render = engine.render, options = render.options;
      c.beginPath();
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.render.visible) {
          var parts = bodies[i].parts;
          for (var j = parts.length > 1 ? 1 :0; j < parts.length; j++) {
            var part = parts[j];
            c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
          }
        }
      }
      if (options.wireframes) {
        c.strokeStyle = "rgba(255,255,255,0.08)";
      } else {
        c.strokeStyle = "rgba(0,0,0,0.1)";
      }
      c.lineWidth = 1;
      c.stroke();
    };
    Render.bodyAxes = function(engine, bodies, context) {
      var c = context, render = engine.render, options = render.options, part, i, j, k;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i], parts = body.parts;
        if (!body.render.visible) continue;
        if (options.showAxes) {
          for (j = parts.length > 1 ? 1 :0; j < parts.length; j++) {
            part = parts[j];
            for (k = 0; k < part.axes.length; k++) {
              var axis = part.axes[k];
              c.moveTo(part.position.x, part.position.y);
              c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
            }
          }
        } else {
          for (j = parts.length > 1 ? 1 :0; j < parts.length; j++) {
            part = parts[j];
            for (k = 0; k < part.axes.length; k++) {
              c.moveTo(part.position.x, part.position.y);
              c.lineTo((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2, (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2);
            }
          }
        }
      }
      if (options.wireframes) {
        c.strokeStyle = "indianred";
      } else {
        c.strokeStyle = "rgba(0,0,0,0.3)";
      }
      c.lineWidth = 1;
      c.stroke();
    };
    Render.bodyPositions = function(engine, bodies, context) {
      var c = context, render = engine.render, options = render.options, body, part, i;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (!body.render.visible) continue;
        for (k = 0; k < body.parts.length; k++) {
          part = body.parts[k];
          c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
          c.closePath();
        }
      }
      if (options.wireframes) {
        c.fillStyle = "indianred";
      } else {
        c.fillStyle = "rgba(0,0,0,0.5)";
      }
      c.fill();
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (body.render.visible) {
          c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
          c.closePath();
        }
      }
      c.fillStyle = "rgba(255,165,0,0.8)";
      c.fill();
    };
    Render.bodyVelocity = function(engine, bodies, context) {
      var c = context;
      c.beginPath();
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        c.moveTo(body.position.x, body.position.y);
        c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
      }
      c.lineWidth = 3;
      c.strokeStyle = "cornflowerblue";
      c.stroke();
    };
    Render.bodyIds = function(engine, bodies, context) {
      var c = context, i, j;
      for (i = 0; i < bodies.length; i++) {
        if (!bodies[i].render.visible) continue;
        var parts = bodies[i].parts;
        for (j = parts.length > 1 ? 1 :0; j < parts.length; j++) {
          var part = parts[j];
          c.font = "12px Arial";
          c.fillStyle = "rgba(255,255,255,0.5)";
          c.fillText(part.id, part.position.x + 10, part.position.y - 10);
        }
      }
    };
    Render.collisions = function(engine, pairs, context) {
      var c = context, options = engine.render.options, pair, collision, corrected, bodyA, bodyB, i, j;
      c.beginPath();
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        for (j = 0; j < pair.activeContacts.length; j++) {
          var contact = pair.activeContacts[j], vertex = contact.vertex;
          c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
        }
      }
      if (options.wireframes) {
        c.fillStyle = "rgba(255,255,255,0.7)";
      } else {
        c.fillStyle = "orange";
      }
      c.fill();
      c.beginPath();
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        if (pair.activeContacts.length > 0) {
          var normalPosX = pair.activeContacts[0].vertex.x, normalPosY = pair.activeContacts[0].vertex.y;
          if (pair.activeContacts.length === 2) {
            normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
            normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
          }
          if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
            c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
          } else {
            c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
          }
          c.lineTo(normalPosX, normalPosY);
        }
      }
      if (options.wireframes) {
        c.strokeStyle = "rgba(255,165,0,0.7)";
      } else {
        c.strokeStyle = "orange";
      }
      c.lineWidth = 1;
      c.stroke();
    };
    Render.separations = function(engine, pairs, context) {
      var c = context, options = engine.render.options, pair, collision, corrected, bodyA, bodyB, i, j;
      c.beginPath();
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;
        var k = 1;
        if (!bodyB.isStatic && !bodyA.isStatic) k = .5;
        if (bodyB.isStatic) k = 0;
        c.moveTo(bodyB.position.x, bodyB.position.y);
        c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);
        k = 1;
        if (!bodyB.isStatic && !bodyA.isStatic) k = .5;
        if (bodyA.isStatic) k = 0;
        c.moveTo(bodyA.position.x, bodyA.position.y);
        c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
      }
      if (options.wireframes) {
        c.strokeStyle = "rgba(255,165,0,0.5)";
      } else {
        c.strokeStyle = "orange";
      }
      c.stroke();
    };
    Render.grid = function(engine, grid, context) {
      var c = context, options = engine.render.options;
      if (options.wireframes) {
        c.strokeStyle = "rgba(255,180,0,0.1)";
      } else {
        c.strokeStyle = "rgba(255,180,0,0.5)";
      }
      c.beginPath();
      var bucketKeys = Common.keys(grid.buckets);
      for (var i = 0; i < bucketKeys.length; i++) {
        var bucketId = bucketKeys[i];
        if (grid.buckets[bucketId].length < 2) continue;
        var region = bucketId.split(",");
        c.rect(.5 + parseInt(region[0], 10) * grid.bucketWidth, .5 + parseInt(region[1], 10) * grid.bucketHeight, grid.bucketWidth, grid.bucketHeight);
      }
      c.lineWidth = 1;
      c.stroke();
    };
    Render.inspector = function(inspector, context) {
      var engine = inspector.engine, selected = inspector.selected, render = engine.render, options = render.options, bounds;
      if (options.hasBounds) {
        var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
        context.scale(1 / boundsScaleX, 1 / boundsScaleY);
        context.translate(-render.bounds.min.x, -render.bounds.min.y);
      }
      for (var i = 0; i < selected.length; i++) {
        var item = selected[i].data;
        context.translate(.5, .5);
        context.lineWidth = 1;
        context.strokeStyle = "rgba(255,165,0,0.9)";
        context.setLineDash([ 1, 2 ]);
        switch (item.type) {
         case "body":
          bounds = item.bounds;
          context.beginPath();
          context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3), Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
          context.closePath();
          context.stroke();
          break;

         case "constraint":
          var point = item.pointA;
          if (item.bodyA) point = item.pointB;
          context.beginPath();
          context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          context.closePath();
          context.stroke();
          break;
        }
        context.setLineDash([ 0 ]);
        context.translate(-.5, -.5);
      }
      if (inspector.selectStart !== null) {
        context.translate(.5, .5);
        context.lineWidth = 1;
        context.strokeStyle = "rgba(255,165,0,0.6)";
        context.fillStyle = "rgba(255,165,0,0.1)";
        bounds = inspector.selectBounds;
        context.beginPath();
        context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y), Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
        context.closePath();
        context.stroke();
        context.fill();
        context.translate(-.5, -.5);
      }
      if (options.hasBounds) context.setTransform(1, 0, 0, 1, 0, 0);
    };
    var _createCanvas = function(width, height) {
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.oncontextmenu = function() {
        return false;
      };
      canvas.onselectstart = function() {
        return false;
      };
      return canvas;
    };
    var _getPixelRatio = function(canvas) {
      var context = canvas.getContext("2d"), devicePixelRatio = window.devicePixelRatio || 1, backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
      return devicePixelRatio / backingStorePixelRatio;
    };
    var _getTexture = function(render, imagePath) {
      var image = render.textures[imagePath];
      if (image) return image;
      image = render.textures[imagePath] = new Image();
      image.src = imagePath;
      return image;
    };
    var _applyBackground = function(render, background) {
      var cssBackground = background;
      if (/(jpg|gif|png)$/.test(background)) cssBackground = "url(" + background + ")";
      render.canvas.style.background = cssBackground;
      render.canvas.style.backgroundSize = "contain";
      render.currentBackground = background;
    };
  })();
  var RenderPixi = {};
  (function() {
    RenderPixi.create = function(options) {
      var defaults = {
        controller:RenderPixi,
        element:null,
        canvas:null,
        options:{
          width:800,
          height:600,
          background:"#fafafa",
          wireframeBackground:"#222",
          hasBounds:false,
          enabled:true,
          wireframes:true,
          showSleeping:true,
          showDebug:false,
          showBroadphase:false,
          showBounds:false,
          showVelocity:false,
          showCollisions:false,
          showAxes:false,
          showPositions:false,
          showAngleIndicator:false,
          showIds:false,
          showShadows:false
        }
      };
      var render = Common.extend(defaults, options), transparent = !render.options.wireframes && render.options.background === "transparent";
      render.context = new PIXI.WebGLRenderer(render.options.width, render.options.height, {
        view:render.canvas,
        transparent:transparent,
        antialias:true,
        backgroundColor:options.background
      });
      render.canvas = render.context.view;
      render.container = new PIXI.Container();
      render.bounds = render.bounds || {
        min:{
          x:0,
          y:0
        },
        max:{
          x:render.options.width,
          y:render.options.height
        }
      };
      render.textures = {};
      render.sprites = {};
      render.primitives = {};
      render.spriteContainer = new PIXI.Container();
      render.container.addChild(render.spriteContainer);
      if (Common.isElement(render.element)) {
        render.element.appendChild(render.canvas);
      } else {
        Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', "warn");
      }
      render.canvas.oncontextmenu = function() {
        return false;
      };
      render.canvas.onselectstart = function() {
        return false;
      };
      return render;
    };
    RenderPixi.clear = function(render) {
      var container = render.container, spriteContainer = render.spriteContainer;
      while (container.children[0]) {
        container.removeChild(container.children[0]);
      }
      while (spriteContainer.children[0]) {
        spriteContainer.removeChild(spriteContainer.children[0]);
      }
      var bgSprite = render.sprites["bg-0"];
      render.textures = {};
      render.sprites = {};
      render.primitives = {};
      render.sprites["bg-0"] = bgSprite;
      if (bgSprite) container.addChildAt(bgSprite, 0);
      render.container.addChild(render.spriteContainer);
      render.currentBackground = null;
      container.scale.set(1, 1);
      container.position.set(0, 0);
    };
    RenderPixi.setBackground = function(render, background) {
      if (render.currentBackground !== background) {
        var isColor = background.indexOf && background.indexOf("#") !== -1, bgSprite = render.sprites["bg-0"];
        if (isColor) {
          var color = Common.colorToNumber(background);
          render.context.backgroundColor = color;
          if (bgSprite) render.container.removeChild(bgSprite);
        } else {
          if (!bgSprite) {
            var texture = _getTexture(render, background);
            bgSprite = render.sprites["bg-0"] = new PIXI.Sprite(texture);
            bgSprite.position.x = 0;
            bgSprite.position.y = 0;
            render.container.addChildAt(bgSprite, 0);
          }
        }
        render.currentBackground = background;
      }
    };
    RenderPixi.world = function(engine) {
      var render = engine.render, world = engine.world, context = render.context, container = render.container, options = render.options, bodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world), constraints = [], i;
      if (options.wireframes) {
        RenderPixi.setBackground(render, options.wireframeBackground);
      } else {
        RenderPixi.setBackground(render, options.background);
      }
      var boundsWidth = render.bounds.max.x - render.bounds.min.x, boundsHeight = render.bounds.max.y - render.bounds.min.y, boundsScaleX = boundsWidth / render.options.width, boundsScaleY = boundsHeight / render.options.height;
      if (options.hasBounds) {
        for (i = 0; i < bodies.length; i++) {
          var body = bodies[i];
          body.render.sprite.visible = Bounds.overlaps(body.bounds, render.bounds);
        }
        for (i = 0; i < allConstraints.length; i++) {
          var constraint = allConstraints[i], bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointAWorld = constraint.pointA, pointBWorld = constraint.pointB;
          if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
          if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);
          if (!pointAWorld || !pointBWorld) continue;
          if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld)) constraints.push(constraint);
        }
        container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
        container.position.set(-render.bounds.min.x * (1 / boundsScaleX), -render.bounds.min.y * (1 / boundsScaleY));
      } else {
        constraints = allConstraints;
      }
      for (i = 0; i < bodies.length; i++) RenderPixi.body(engine, bodies[i]);
      for (i = 0; i < constraints.length; i++) RenderPixi.constraint(engine, constraints[i]);
      context.render(container);
    };
    RenderPixi.constraint = function(engine, constraint) {
      var render = engine.render, bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB, container = render.container, constraintRender = constraint.render, primitiveId = "c-" + constraint.id, primitive = render.primitives[primitiveId];
      if (!primitive) primitive = render.primitives[primitiveId] = new PIXI.Graphics();
      if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
        primitive.clear();
        return;
      }
      if (Common.indexOf(container.children, primitive) === -1) container.addChild(primitive);
      primitive.clear();
      primitive.beginFill(0, 0);
      primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
      if (bodyA) {
        primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
      } else {
        primitive.moveTo(pointA.x, pointA.y);
      }
      if (bodyB) {
        primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
      } else {
        primitive.lineTo(pointB.x, pointB.y);
      }
      primitive.endFill();
    };
    RenderPixi.body = function(engine, body) {
      var render = engine.render, bodyRender = body.render;
      if (!bodyRender.visible) return;
      if (bodyRender.sprite && bodyRender.sprite.texture) {
        var spriteId = "b-" + body.id, sprite = render.sprites[spriteId], spriteContainer = render.spriteContainer;
        if (!sprite) sprite = render.sprites[spriteId] = _createBodySprite(render, body);
        if (Common.indexOf(spriteContainer.children, sprite) === -1) spriteContainer.addChild(sprite);
        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.rotation = body.angle;
        sprite.scale.x = bodyRender.sprite.xScale || 1;
        sprite.scale.y = bodyRender.sprite.yScale || 1;
      } else {
        var primitiveId = "b-" + body.id, primitive = render.primitives[primitiveId], container = render.container;
        if (!primitive) {
          primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
          primitive.initialAngle = body.angle;
        }
        if (Common.indexOf(container.children, primitive) === -1) container.addChild(primitive);
        primitive.position.x = body.position.x;
        primitive.position.y = body.position.y;
        primitive.rotation = body.angle - primitive.initialAngle;
      }
    };
    var _createBodySprite = function(render, body) {
      var bodyRender = body.render, texturePath = bodyRender.sprite.texture, texture = _getTexture(render, texturePath), sprite = new PIXI.Sprite(texture);
      sprite.anchor.x = .5;
      sprite.anchor.y = .5;
      return sprite;
    };
    var _createBodyPrimitive = function(render, body) {
      var bodyRender = body.render, options = render.options, primitive = new PIXI.Graphics(), fillStyle = Common.colorToNumber(bodyRender.fillStyle), strokeStyle = Common.colorToNumber(bodyRender.strokeStyle), strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle), strokeStyleWireframe = Common.colorToNumber("#bbb"), strokeStyleWireframeIndicator = Common.colorToNumber("#CD5C5C"), part;
      primitive.clear();
      for (var k = body.parts.length > 1 ? 1 :0; k < body.parts.length; k++) {
        part = body.parts[k];
        if (!options.wireframes) {
          primitive.beginFill(fillStyle, 1);
          primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
        } else {
          primitive.beginFill(0, 0);
          primitive.lineStyle(1, strokeStyleWireframe, 1);
        }
        primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
        for (var j = 1; j < part.vertices.length; j++) {
          primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
        }
        primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);
        primitive.endFill();
        if (options.showAngleIndicator || options.showAxes) {
          primitive.beginFill(0, 0);
          if (options.wireframes) {
            primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
          } else {
            primitive.lineStyle(1, strokeStyleIndicator);
          }
          primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
          primitive.lineTo((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - body.position.x, (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - body.position.y);
          primitive.endFill();
        }
      }
      return primitive;
    };
    var _getTexture = function(render, imagePath) {
      var texture = render.textures[imagePath];
      if (!texture) texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);
      return texture;
    };
  })();
  World.add = Composite.add;
  World.remove = Composite.remove;
  World.addComposite = Composite.addComposite;
  World.addBody = Composite.addBody;
  World.addConstraint = Composite.addConstraint;
  World.clear = Composite.clear;
  Engine.run = Runner.run;
  Matter.Body = Body;
  Matter.Composite = Composite;
  Matter.World = World;
  Matter.Contact = Contact;
  Matter.Detector = Detector;
  Matter.Grid = Grid;
  Matter.Pairs = Pairs;
  Matter.Pair = Pair;
  Matter.Resolver = Resolver;
  Matter.SAT = SAT;
  Matter.Constraint = Constraint;
  Matter.MouseConstraint = MouseConstraint;
  Matter.Common = Common;
  Matter.Engine = Engine;
  Matter.Mouse = Mouse;
  Matter.Sleeping = Sleeping;
  Matter.Bodies = Bodies;
  Matter.Composites = Composites;
  Matter.Axes = Axes;
  Matter.Bounds = Bounds;
  Matter.Vector = Vector;
  Matter.Vertices = Vertices;
  Matter.Render = Render;
  Matter.RenderPixi = RenderPixi;
  Matter.Events = Events;
  Matter.Query = Query;
  Matter.Runner = Runner;
  Matter.Svg = Svg;
  Matter.Metrics = Metrics;
  if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      exports = module.exports = Matter;
    }
    exports.Matter = Matter;
  }
  if (typeof define === "function" && define.amd) {
    define("Matter", [], function() {
      return Matter;
    });
  }
  if (typeof window === "object" && typeof window.document === "object") {
    window.Matter = Matter;
  }
})();