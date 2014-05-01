/**
* matter-dev.min.js 0.7.0-dev 2014-05-01
* http://brm.io/matter-js/
* License: MIT
*/

(function() {
  var Matter = {};
  var Body = {};
  (function() {
    var _nextGroupId = 1;
    Body.create = function(options) {
      var defaults = {
        id:Common.nextId(),
        type:"body",
        label:"Body",
        angle:0,
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
        frictionAir:.01,
        groupId:0,
        slop:.05,
        timeScale:1,
        render:{
          visible:true,
          sprite:{
            xScale:1,
            yScale:1
          },
          path:"L 0 0 L 40 0 L 40 40 L 0 40",
          lineWidth:1.5
        }
      };
      var body = Common.extend(defaults, options);
      _initProperties(body);
      return body;
    };
    Body.nextGroupId = function() {
      return _nextGroupId++;
    };
    var _initProperties = function(body) {
      body.vertices = body.vertices || Vertices.fromPath(body.render.path);
      body.axes = body.axes || Axes.fromVertices(body.vertices);
      body.area = Vertices.area(body.vertices);
      body.bounds = Bounds.create(body.vertices);
      body.mass = body.mass || body.density * body.area;
      body.inverseMass = 1 / body.mass;
      body.inertia = body.inertia || Vertices.inertia(body.vertices, body.mass);
      body.inverseInertia = 1 / body.inertia;
      body.positionPrev = body.positionPrev || {
        x:body.position.x,
        y:body.position.y
      };
      body.anglePrev = body.anglePrev || body.angle;
      body.render.fillStyle = body.render.fillStyle || (body.isStatic ? "#eeeeee" :Common.choose([ "#556270", "#4ECDC4", "#C7F464", "#FF6B6B", "#C44D58" ]));
      body.render.strokeStyle = body.render.strokeStyle || Common.shadeColor(body.render.fillStyle, -20);
      Vertices.create(body.vertices, body);
      var centre = Vertices.centre(body.vertices);
      Vertices.translate(body.vertices, body.position);
      Vertices.translate(body.vertices, centre, -1);
      Vertices.rotate(body.vertices, body.angle, body.position);
      Axes.rotate(body.axes, body.angle);
      Bounds.update(body.bounds, body.vertices, body.velocity);
      Body.setStatic(body, body.isStatic);
      Sleeping.set(body, body.isSleeping);
    };
    Body.setStatic = function(body, isStatic) {
      body.isStatic = isStatic;
      if (isStatic) {
        body.restitution = 0;
        body.friction = 1;
        body.mass = body.inertia = body.density = Infinity;
        body.inverseMass = body.inverseInertia = 0;
        body.render.lineWidth = 1;
        body.positionPrev.x = body.position.x;
        body.positionPrev.y = body.position.y;
        body.anglePrev = body.angle;
        body.angularVelocity = 0;
        body.speed = 0;
        body.angularSpeed = 0;
        body.motion = 0;
      }
    };
    Body.resetForcesAll = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        body.force.x = 0;
        body.force.y = 0;
        body.torque = 0;
      }
    };
    Body.applyGravityAll = function(bodies, gravity) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.isStatic || body.isSleeping) continue;
        body.force.y += body.mass * gravity.y * .001;
        body.force.x += body.mass * gravity.x * .001;
      }
    };
    Body.updateAll = function(bodies, deltaTime, correction, worldBounds) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.isStatic || body.isSleeping) continue;
        if (body.bounds.max.x < worldBounds.min.x || body.bounds.min.x > worldBounds.max.x || body.bounds.max.y < worldBounds.min.y || body.bounds.min.y > worldBounds.max.y) continue;
        Body.update(body, deltaTime, correction);
      }
    };
    Body.update = function(body, deltaTime, correction) {
      var deltaTimeSquared = deltaTime * deltaTime * body.timeScale;
      var frictionAir = 1 - body.frictionAir, velocityPrevX = body.position.x - body.positionPrev.x, velocityPrevY = body.position.y - body.positionPrev.y;
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
      Vertices.translate(body.vertices, body.velocity);
      if (body.angularVelocity !== 0) {
        Vertices.rotate(body.vertices, body.angularVelocity, body.position);
        Axes.rotate(body.axes, body.angularVelocity);
      }
      Bounds.update(body.bounds, body.vertices, body.velocity);
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
    Body.translate = function(body, translation) {
      body.positionPrev.x += translation.x;
      body.positionPrev.y += translation.y;
      body.position.x += translation.x;
      body.position.y += translation.y;
      Vertices.translate(body.vertices, translation);
      Bounds.update(body.bounds, body.vertices, body.velocity);
    };
    Body.rotate = function(body, angle) {
      body.anglePrev += angle;
      body.angle += angle;
      Vertices.rotate(body.vertices, angle, body.position);
      Axes.rotate(body.axes, angle);
      Bounds.update(body.bounds, body.vertices, body.velocity);
    };
    Body.scale = function(body, scaleX, scaleY, point) {
      Vertices.scale(body.vertices, scaleX, scaleY, point);
      body.axes = Axes.fromVertices(body.vertices);
      body.area = Vertices.area(body.vertices);
      body.mass = body.density * body.area;
      body.inverseMass = 1 / body.mass;
      Vertices.translate(body.vertices, {
        x:-body.position.x,
        y:-body.position.y
      });
      body.inertia = Vertices.inertia(body.vertices, body.mass);
      body.inverseInertia = 1 / body.inertia;
      Vertices.translate(body.vertices, {
        x:body.position.x,
        y:body.position.y
      });
      Bounds.update(body.bounds, body.vertices, body.velocity);
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
      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        switch (obj.type) {
         case "body":
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
      return composite;
    };
    Composite.remove = function(composite, object, deep) {
      var objects = [].concat(object);
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
      return composite;
    };
    Composite.addComposite = function(compositeA, compositeB) {
      compositeA.composites.push(compositeB);
      compositeB.parent = compositeA;
      Composite.setModified(compositeA, true, true, false);
      return compositeA;
    };
    Composite.removeComposite = function(compositeA, compositeB, deep) {
      var position = compositeA.composites.indexOf(compositeB);
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
      var position = composite.bodies.indexOf(body);
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
      var position = composite.constraints.indexOf(constraint);
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
            x:0,
            y:0
          },
          max:{
            x:800,
            y:600
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
      var collisions = [], metrics = engine.metrics, pairsTable = engine.pairs.table;
      for (var i = 0; i < broadphasePairs.length; i++) {
        var bodyA = broadphasePairs[i][0], bodyB = broadphasePairs[i][1];
        if (bodyA.groupId && bodyB.groupId && bodyA.groupId === bodyB.groupId) continue;
        if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping)) continue;
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
      return collisions;
    };
    Detector.bruteForce = function(bodies, engine) {
      var collisions = [], metrics = engine.metrics, pairsTable = engine.pairs.table;
      for (var i = 0; i < bodies.length; i++) {
        for (var j = i + 1; j < bodies.length; j++) {
          var bodyA = bodies[i], bodyB = bodies[j];
          if (bodyA.groupId && bodyB.groupId && bodyA.groupId === bodyB.groupId) continue;
          if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping)) continue;
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
  })();
  var Grid = {};
  (function() {
    Grid.create = function(bucketWidth, bucketHeight) {
      return {
        buckets:{},
        pairs:{},
        pairsList:[],
        bucketWidth:bucketWidth || 48,
        bucketHeight:bucketHeight || 48
      };
    };
    Grid.update = function(grid, bodies, engine, forceUpdate) {
      var i, col, row, world = engine.world, buckets = grid.buckets, bucket, bucketId, metrics = engine.metrics, gridChanged = false;
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
      bucket.splice(bucket.indexOf(body), 1);
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
      var bodyA = collision.bodyA, bodyB = collision.bodyB;
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
        inverseMass:bodyA.inverseMass + bodyB.inverseMass,
        friction:Math.min(bodyA.friction, bodyB.friction),
        restitution:Math.max(bodyA.restitution, bodyB.restitution),
        slop:Math.max(bodyA.slop, bodyB.slop)
      };
      Pair.update(pair, collision, timestamp);
      return pair;
    };
    Pair.update = function(pair, collision, timestamp) {
      var contacts = pair.contacts, supports = collision.supports, activeContacts = pair.activeContacts;
      pair.collision = collision;
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
        if (pair.isActive && activePairIds.indexOf(pair.id) === -1) {
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
      rayWidth = rayWidth || Number.MIN_VALUE;
      var rayAngle = Vector.angle(startPoint, endPoint), rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)), rayX = (endPoint.x + startPoint.x) * .5, rayY = (endPoint.y + startPoint.y) * .5, ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, {
        angle:rayAngle
      }), collisions = [];
      for (var i = 0; i < bodies.length; i++) {
        var bodyA = bodies[i];
        if (Bounds.overlaps(bodyA.bounds, ray.bounds)) {
          var collision = SAT.collides(bodyA, ray);
          if (collision.collided) {
            collision.body = collision.bodyA = collision.bodyB = bodyA;
            collisions.push(collision);
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
  })();
  var Resolver = {};
  (function() {
    var _restingThresh = 4, _positionDampen = .2, _positionWarming = .6;
    Resolver.solvePosition = function(pairs, timeScale) {
      var i, pair, collision, bodyA, bodyB, vertex, vertexCorrected, normal, bodyBtoA;
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;
        vertex = collision.supports[0];
        vertexCorrected = collision.supportCorrected;
        normal = collision.normal;
        bodyBtoA = Vector.sub(Vector.add(bodyB.positionImpulse, vertex), Vector.add(bodyA.positionImpulse, vertexCorrected));
        pair.separation = Vector.dot(normal, bodyBtoA);
      }
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        collision = pair.collision;
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;
        normal = collision.normal;
        positionImpulse = (pair.separation * _positionDampen - pair.slop) * timeScale;
        if (bodyA.isStatic || bodyB.isStatic) positionImpulse *= 2;
        if (!(bodyA.isStatic || bodyA.isSleeping)) {
          bodyA.positionImpulse.x += normal.x * positionImpulse;
          bodyA.positionImpulse.y += normal.y * positionImpulse;
        }
        if (!(bodyB.isStatic || bodyB.isSleeping)) {
          bodyB.positionImpulse.x -= normal.x * positionImpulse;
          bodyB.positionImpulse.y -= normal.y * positionImpulse;
        }
      }
    };
    Resolver.postSolvePosition = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.positionImpulse.x !== 0 || body.positionImpulse.y !== 0) {
          body.position.x += body.positionImpulse.x;
          body.position.y += body.positionImpulse.y;
          body.positionPrev.x += body.positionImpulse.x;
          body.positionPrev.y += body.positionImpulse.y;
          Vertices.translate(body.vertices, body.positionImpulse);
          Bounds.update(body.bounds, body.vertices, body.velocity);
          body.positionImpulse.x *= _positionWarming;
          body.positionImpulse.y *= _positionWarming;
        }
      }
    };
    Resolver.preSolveVelocity = function(pairs) {
      var impulse = {}, i, j, pair, contacts, collision, bodyA, bodyB, normal, tangent, contact, contactVertex, normalImpulse, tangentImpulse, offset;
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (!pair.isActive) continue;
        contacts = pair.activeContacts;
        collision = pair.collision;
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;
        normal = collision.normal;
        tangent = collision.tangent;
        for (j = 0; j < contacts.length; j++) {
          contact = contacts[j];
          contactVertex = contact.vertex;
          normalImpulse = contact.normalImpulse;
          tangentImpulse = contact.tangentImpulse;
          impulse.x = normal.x * normalImpulse + tangent.x * tangentImpulse;
          impulse.y = normal.y * normalImpulse + tangent.y * tangentImpulse;
          if (!(bodyA.isStatic || bodyA.isSleeping)) {
            offset = Vector.sub(contactVertex, bodyA.position);
            bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
            bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
            bodyA.anglePrev += Vector.cross(offset, impulse) * bodyA.inverseInertia;
          }
          if (!(bodyB.isStatic || bodyB.isSleeping)) {
            offset = Vector.sub(contactVertex, bodyB.position);
            bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
            bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
            bodyB.anglePrev -= Vector.cross(offset, impulse) * bodyB.inverseInertia;
          }
        }
      }
    };
    Resolver.solveVelocity = function(pairs) {
      var impulse = {};
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (!pair.isActive) continue;
        var collision = pair.collision, bodyA = collision.bodyA, bodyB = collision.bodyB, normal = collision.normal, tangent = collision.tangent, contacts = pair.activeContacts, contactShare = 1 / contacts.length;
        bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
        bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
        bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
        bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
        bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
        bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;
        for (var j = 0; j < contacts.length; j++) {
          var contact = contacts[j], contactVertex = contact.vertex, offsetA = Vector.sub(contactVertex, bodyA.position), offsetB = Vector.sub(contactVertex, bodyB.position), velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity)), velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity)), relativeVelocity = Vector.sub(velocityPointA, velocityPointB), normalVelocity = Vector.dot(normal, relativeVelocity);
          var tangentVelocity = Vector.dot(tangent, relativeVelocity), tangentSpeed = Math.abs(tangentVelocity), tangentVelocityDirection = Common.sign(tangentVelocity);
          var normalImpulse = (1 + pair.restitution) * normalVelocity, normalForce = Common.clamp(pair.separation + normalVelocity, 0, 1);
          var tangentImpulse = tangentVelocity;
          if (tangentSpeed > normalForce * pair.friction) tangentImpulse = normalForce * pair.friction * tangentVelocityDirection;
          var oAcN = Vector.cross(offsetA, normal), oBcN = Vector.cross(offsetB, normal), share = contactShare / (pair.inverseMass + bodyA.inverseInertia * oAcN * oAcN + bodyB.inverseInertia * oBcN * oBcN);
          normalImpulse *= share;
          tangentImpulse *= share;
          if (normalVelocity < 0 && normalVelocity * normalVelocity > _restingThresh) {
            contact.normalImpulse = 0;
            contact.tangentImpulse = 0;
          } else {
            var contactNormalImpulse = contact.normalImpulse;
            contact.normalImpulse = Math.min(contact.normalImpulse + normalImpulse, 0);
            normalImpulse = contact.normalImpulse - contactNormalImpulse;
            var contactTangentImpulse = contact.tangentImpulse;
            contact.tangentImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -tangentSpeed, tangentSpeed);
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
        var motion = bodyA.speed * bodyA.speed + bodyA.angularSpeed * bodyA.angularSpeed + bodyB.speed * bodyB.speed + bodyB.angularSpeed * bodyB.angularSpeed;
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
        var axes = [ prevCol.bodyA.axes[prevCol.axisNumber] ];
        minOverlap = _overlapAxes(prevCol.bodyA.vertices, prevCol.bodyB.vertices, axes);
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
          collision.bodyA = bodyA;
          collision.bodyB = bodyB;
        } else {
          minOverlap = overlapBA;
          collision.bodyA = bodyB;
          collision.bodyB = bodyA;
        }
        collision.axisNumber = minOverlap.axisNumber;
      }
      collision.collided = true;
      collision.normal = minOverlap.axis;
      collision.depth = minOverlap.overlap;
      bodyA = collision.bodyA;
      bodyB = collision.bodyB;
      if (Vector.dot(collision.normal, Vector.sub(bodyB.position, bodyA.position)) > 0) collision.normal = Vector.neg(collision.normal);
      collision.tangent = Vector.perp(collision.normal);
      collision.penetration = {
        x:collision.normal.x * collision.depth,
        y:collision.normal.y * collision.depth
      };
      var verticesB = _findSupports(bodyA, bodyB, collision.normal), supports = [ verticesB[0] ];
      if (Vertices.contains(bodyA.vertices, verticesB[1])) {
        supports.push(verticesB[1]);
      } else {
        var verticesA = _findSupports(bodyB, bodyA, Vector.neg(collision.normal));
        if (Vertices.contains(bodyB.vertices, verticesA[0])) {
          supports.push(verticesA[0]);
        }
        if (supports.length < 2 && Vertices.contains(bodyB.vertices, verticesA[1])) {
          supports.push(verticesA[1]);
        }
      }
      collision.supports = supports;
      collision.supportCorrected = Vector.sub(verticesB[0], collision.penetration);
      return collision;
    };
    var _overlapAxes = function(verticesA, verticesB, axes) {
      var projectionA = {}, projectionB = {}, result = {
        overlap:Number.MAX_VALUE
      }, overlap, axis;
      for (var i = 0; i < axes.length; i++) {
        axis = axes[i];
        _projectToAxis(projectionA, verticesA, axis);
        _projectToAxis(projectionB, verticesB, axis);
        overlap = projectionA.min < projectionB.min ? projectionA.max - projectionB.min :projectionB.max - projectionA.min;
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
      var nearestDistance = Number.MAX_VALUE, vertexToBody = {
        x:0,
        y:0
      }, vertices = bodyB.vertices, bodyAPosition = bodyA.position, distance, vertex, vertexA = vertices[0], vertexB = vertices[1];
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
        nearestDistance = distance;
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
        Vertices.translate(body.vertices, impulse);
        if (impulse.angle !== 0) {
          Vertices.rotate(body.vertices, impulse.angle, body.position);
          Axes.rotate(body.axes, impulse.angle);
          impulse.angle = 0;
        }
        Bounds.update(body.bounds, body.vertices);
        impulse.x = 0;
        impulse.y = 0;
      }
    };
  })();
  var MouseConstraint = {};
  (function() {
    MouseConstraint.create = function(engine, options) {
      var mouse = engine.input.mouse;
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
        dragBody:null,
        dragPoint:null,
        constraint:constraint
      };
      var mouseConstraint = Common.extend(defaults, options);
      Events.on(engine, "tick", function(event) {
        var allBodies = Composite.allBodies(engine.world);
        MouseConstraint.update(mouseConstraint, allBodies);
      });
      return mouseConstraint;
    };
    MouseConstraint.update = function(mouseConstraint, bodies) {
      var mouse = mouseConstraint.mouse, constraint = mouseConstraint.constraint;
      if (mouse.button === 0) {
        if (!constraint.bodyB) {
          for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            if (Bounds.contains(body.bounds, mouse.position) && Vertices.contains(body.vertices, mouse.position)) {
              constraint.pointA = mouse.position;
              constraint.bodyB = body;
              constraint.pointB = {
                x:mouse.position.x - body.position.x,
                y:mouse.position.y - body.position.y
              };
              constraint.angleB = body.angle;
              Sleeping.set(body, false);
            }
          }
        }
      } else {
        constraint.bodyB = null;
        constraint.pointB = null;
      }
      if (constraint.bodyB) {
        Sleeping.set(constraint.bodyB, false);
        constraint.pointA = mouse.position;
      }
    };
  })();
  var Common = {};
  (function() {
    Common._nextId = 0;
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
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    };
    Common.choose = function(choices) {
      return choices[Math.floor(Math.random() * choices.length)];
    };
    Common.isElement = function(obj) {
      try {
        return obj instanceof HTMLElement;
      } catch (e) {
        return typeof obj === "object" && obj.nodeType === 1 && typeof obj.style === "object" && typeof obj.ownerDocument === "object";
      }
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
      var perf = window.performance;
      if (perf) {
        perf.now = perf.now || perf.webkitNow || perf.msNow || perf.oNow || perf.mozNow;
        return +perf.now();
      }
      return +new Date();
    };
    Common.random = function(min, max) {
      return min + Math.random() * (max - min);
    };
    Common.colorToNumber = function(colorString) {
      colorString = colorString.replace("#", "");
      if (colorString.length == 3) {
        colorString = colorString.charAt(0) + colorString.charAt(0) + colorString.charAt(1) + colorString.charAt(1) + colorString.charAt(2) + colorString.charAt(2);
      }
      return parseInt(colorString, 16);
    };
    Common.log = function(message, type) {
      if (!console || !console.log) return;
      var style;
      switch (type) {
       case "warn":
        style = "color: coral";
        break;

       case "error":
        style = "color: red";
        break;
      }
      console.log("%c [Matter] " + type + ": " + message, style);
    };
    Common.nextId = function() {
      return Common._nextId++;
    };
  })();
  var Engine = {};
  (function() {
    var _fps = 60, _deltaSampleSize = _fps, _delta = 1e3 / _fps;
    var _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      window.setTimeout(function() {
        callback(Common.now());
      }, _delta);
    };
    Engine.create = function(element, options) {
      options = Common.isElement(element) ? options :element;
      element = Common.isElement(element) ? element :null;
      var defaults = {
        enabled:true,
        positionIterations:6,
        velocityIterations:4,
        constraintIterations:2,
        enableSleeping:false,
        timeScale:1,
        input:{},
        events:[],
        timing:{
          fps:_fps,
          timestamp:0,
          delta:_delta,
          correction:1,
          deltaMin:1e3 / _fps,
          deltaMax:1e3 / (_fps * .5),
          timeScale:1
        },
        render:{
          element:element,
          controller:Render
        }
      };
      var engine = Common.extend(defaults, options);
      engine.render = engine.render.controller.create(engine.render);
      engine.world = World.create(engine.world);
      engine.pairs = Pairs.create();
      engine.metrics = engine.metrics || Metrics.create();
      engine.input.mouse = engine.input.mouse || Mouse.create(engine.render.canvas);
      engine.broadphase = engine.broadphase || {
        current:"grid",
        grid:{
          controller:Grid,
          instance:Grid.create(),
          detector:Detector.collisions
        },
        bruteForce:{
          detector:Detector.bruteForce
        }
      };
      return engine;
    };
    Engine.run = function(engine) {
      var timing = engine.timing, delta, correction, counterTimestamp = 0, frameCounter = 0, deltaHistory = [], timeScalePrev = 1;
      (function render(timestamp) {
        _requestAnimationFrame(render);
        if (!engine.enabled) return;
        timestamp = timestamp || 0;
        var event = {
          timestamp:timestamp
        };
        Events.trigger(engine, "beforeTick", event);
        delta = timestamp - timing.timestamp || _delta;
        deltaHistory.push(delta);
        deltaHistory = deltaHistory.slice(-_deltaSampleSize);
        delta = Math.min.apply(null, deltaHistory);
        delta = delta < timing.deltaMin ? timing.deltaMin :delta;
        delta = delta > timing.deltaMax ? timing.deltaMax :delta;
        correction = delta / timing.delta;
        if (timeScalePrev !== 0) correction *= timing.timeScale / timeScalePrev;
        if (timing.timeScale === 0) correction = 0;
        timeScalePrev = timing.timeScale;
        timing.timestamp = timestamp;
        timing.correction = correction;
        timing.delta = delta;
        frameCounter += 1;
        if (timestamp - counterTimestamp >= 1e3) {
          timing.fps = frameCounter * ((timestamp - counterTimestamp) / 1e3);
          counterTimestamp = timestamp;
          frameCounter = 0;
        }
        Events.trigger(engine, "tick beforeUpdate", event);
        if (engine.world.isModified) engine.render.controller.clear(engine.render);
        Engine.update(engine, delta, correction);
        _triggerCollisionEvents(engine);
        _triggerMouseEvents(engine);
        Events.trigger(engine, "afterUpdate beforeRender", event);
        if (engine.render.options.enabled) engine.render.controller.world(engine);
        Events.trigger(engine, "afterTick afterRender", event);
      })();
    };
    Engine.update = function(engine, delta, correction) {
      var world = engine.world, timing = engine.timing, broadphase = engine.broadphase[engine.broadphase.current], broadphasePairs = [], i;
      var allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world);
      Metrics.reset(engine.metrics);
      if (engine.enableSleeping) Sleeping.update(allBodies);
      Body.applyGravityAll(allBodies, world.gravity);
      Body.updateAll(allBodies, delta * timing.timeScale, correction, world.bounds);
      for (i = 0; i < engine.constraintIterations; i++) {
        Constraint.solveAll(allConstraints, timing.timeScale);
      }
      Constraint.postSolveAll(allBodies);
      if (broadphase.controller) {
        if (world.isModified) broadphase.controller.clear(broadphase.instance);
        broadphase.controller.update(broadphase.instance, allBodies, engine, world.isModified);
        broadphasePairs = broadphase.instance.pairsList;
      } else {
        broadphasePairs = allBodies;
      }
      var collisions = broadphase.detector(broadphasePairs, engine);
      var pairs = engine.pairs, timestamp = timing.timestamp;
      Pairs.update(pairs, collisions, timestamp);
      Pairs.removeOld(pairs, timestamp);
      if (engine.enableSleeping) Sleeping.afterCollisions(pairs.list);
      Resolver.preSolveVelocity(pairs.list);
      for (i = 0; i < engine.velocityIterations; i++) {
        Resolver.solveVelocity(pairs.list);
      }
      for (i = 0; i < engine.positionIterations; i++) {
        Resolver.solvePosition(pairs.list, timing.timeScale);
      }
      Resolver.postSolvePosition(allBodies);
      Metrics.update(engine.metrics, engine);
      Body.resetForcesAll(allBodies);
      if (world.isModified) Composite.setModified(world, false, false, true);
      return engine;
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
      var broadphase = engine.broadphase[engine.broadphase.current];
      if (broadphase.controller) {
        var bodies = Composite.allBodies(world);
        broadphase.controller.clear(broadphase.instance);
        broadphase.controller.update(broadphase.instance, bodies, engine, true);
      }
    };
    var _triggerMouseEvents = function(engine) {
      var mouse = engine.input.mouse, mouseEvents = mouse.sourceEvents;
      if (mouseEvents.mousemove) {
        Events.trigger(engine, "mousemove", {
          mouse:mouse
        });
      }
      if (mouseEvents.mousedown) {
        Events.trigger(engine, "mousedown", {
          mouse:mouse
        });
      }
      if (mouseEvents.mouseup) {
        Events.trigger(engine, "mouseup", {
          mouse:mouse
        });
      }
      Mouse.clearSourceEvents(mouse);
    };
    var _triggerCollisionEvents = function(engine) {
      var pairs = engine.pairs;
      if (pairs.collisionStart.length > 0) {
        Events.trigger(engine, "collisionStart", {
          pairs:pairs.collisionStart
        });
      }
      if (pairs.collisionActive.length > 0) {
        Events.trigger(engine, "collisionActive", {
          pairs:pairs.collisionActive
        });
      }
      if (pairs.collisionEnd.length > 0) {
        Events.trigger(engine, "collisionEnd", {
          pairs:pairs.collisionEnd
        });
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
        var world = engine.world, broadphase = engine.broadphase[engine.broadphase.current], bodies = Composite.allBodies(world);
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
  var Mouse;
  (function() {
    Mouse = function(element) {
      var mouse = this;
      this.element = element || document.body;
      this.position = {
        x:0,
        y:0
      };
      this.mousedownPosition = {
        x:0,
        y:0
      };
      this.mouseupPosition = {
        x:0,
        y:0
      };
      this.offset = {
        x:0,
        y:0
      };
      this.button = -1;
      this.sourceEvents = {
        mousemove:null,
        mousedown:null,
        mouseup:null
      };
      this.mousemove = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element), touches = event.changedTouches;
        if (touches) {
          mouse.button = 0;
          event.preventDefault();
        }
        mouse.position.x = position.x + mouse.offset.x;
        mouse.position.y = position.y + mouse.offset.y;
        mouse.sourceEvents.mousemove = event;
      };
      this.mousedown = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element), touches = event.changedTouches;
        if (touches) {
          mouse.button = 0;
          event.preventDefault();
        } else {
          mouse.button = event.button;
        }
        mouse.position.x = position.x + mouse.offset.x;
        mouse.position.y = position.y + mouse.offset.y;
        mouse.mousedownPosition.x = position.x + mouse.offset.x;
        mouse.mousedownPosition.y = position.y + mouse.offset.y;
        mouse.sourceEvents.mousedown = event;
      };
      this.mouseup = function(event) {
        var position = _getRelativeMousePosition(event, mouse.element), touches = event.changedTouches;
        if (touches) {
          event.preventDefault();
        }
        mouse.button = -1;
        mouse.position.x = position.x + mouse.offset.x;
        mouse.position.y = position.y + mouse.offset.y;
        mouse.mouseupPosition.x = position.x + mouse.offset.x;
        mouse.mouseupPosition.y = position.y + mouse.offset.y;
        mouse.sourceEvents.mouseup = event;
      };
      Mouse.setElement(mouse, mouse.element);
    };
    Mouse.create = function(element) {
      return new Mouse(element);
    };
    Mouse.setElement = function(mouse, element) {
      mouse.element = element;
      element.addEventListener("mousemove", mouse.mousemove);
      element.addEventListener("mousedown", mouse.mousedown);
      element.addEventListener("mouseup", mouse.mouseup);
      element.addEventListener("touchmove", mouse.mousemove);
      element.addEventListener("touchstart", mouse.mousedown);
      element.addEventListener("touchend", mouse.mouseup);
    };
    Mouse.clearSourceEvents = function(mouse) {
      mouse.sourceEvents.mousemove = null;
      mouse.sourceEvents.mousedown = null;
      mouse.sourceEvents.mouseup = null;
    };
    var _getRelativeMousePosition = function(event, element) {
      var elementBounds = element.getBoundingClientRect(), scrollX = window.pageXOffset !== undefined ? window.pageXOffset :(document.documentElement || document.body.parentNode || document.body).scrollLeft, scrollY = window.pageYOffset !== undefined ? window.pageYOffset :(document.documentElement || document.body.parentNode || document.body).scrollTop, touches = event.changedTouches, x, y;
      if (touches) {
        x = touches[0].pageX - elementBounds.left - scrollX;
        y = touches[0].pageY - elementBounds.top - scrollY;
      } else {
        x = event.pageX - elementBounds.left - scrollX;
        y = event.pageY - elementBounds.top - scrollY;
      }
      return {
        x:x / (element.clientWidth / element.width),
        y:y / (element.clientHeight / element.height)
      };
    };
  })();
  var Sleeping = {};
  (function() {
    var _motionWakeThreshold = .18, _motionSleepThreshold = .08, _minBias = .9;
    Sleeping.update = function(bodies) {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i], motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;
        if (body.force.x > 0 || body.force.y > 0) {
          Sleeping.set(body, false);
          continue;
        }
        var minMotion = Math.min(body.motion, motion), maxMotion = Math.max(body.motion, motion);
        body.motion = _minBias * minMotion + (1 - _minBias) * maxMotion;
        if (body.sleepThreshold > 0 && body.motion < _motionSleepThreshold) {
          body.sleepCounter += 1;
          if (body.sleepCounter >= body.sleepThreshold) Sleeping.set(body, true);
        } else if (body.sleepCounter > 0) {
          body.sleepCounter -= 1;
        }
      }
    };
    Sleeping.afterCollisions = function(pairs) {
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (!pair.isActive) continue;
        var collision = pair.collision, bodyA = collision.bodyA, bodyB = collision.bodyB;
        if (bodyA.isSleeping && bodyB.isSleeping || bodyA.isStatic || bodyB.isStatic) continue;
        if (bodyA.isSleeping || bodyB.isSleeping) {
          var sleepingBody = bodyA.isSleeping && !bodyA.isStatic ? bodyA :bodyB, movingBody = sleepingBody === bodyA ? bodyB :bodyA;
          if (!sleepingBody.isStatic && movingBody.motion > _motionWakeThreshold) {
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
        render:{
          path:"L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height
        }
      };
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
        render:{
          path:"L 0 0 L " + x1 + " " + -height + " L " + x2 + " " + -height + " L " + x3 + " 0"
        }
      };
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
        render:{
          path:path
        }
      };
      return Body.create(Common.extend({}, polygon, options));
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
        for (col = 0; col < columns; col++) {
          if (col > 0) {
            bodyA = bodies[col - 1 + row * columns];
            bodyB = bodies[col + row * columns];
            Composite.addConstraint(composite, Constraint.create(Common.extend({
              bodyA:bodyA,
              bodyB:bodyB
            }, options)));
          }
        }
        for (col = 0; col < columns; col++) {
          if (row > 0) {
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
      var groupId = Body.nextGroupId(), wheelBase = -20, wheelAOffset = -width * .5 + wheelBase, wheelBOffset = width * .5 - wheelBase, wheelYOffset = 0;
      var car = Composite.create({
        label:"Car"
      }), body = Bodies.trapezoid(xx, yy, width, height, .3, {
        groupId:groupId,
        friction:.01
      });
      var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
        groupId:groupId,
        restitution:.5,
        friction:.9,
        density:.01
      });
      var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
        groupId:groupId,
        restitution:.5,
        friction:.9,
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
      var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row) {
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
  var Vector = {};
  (function() {
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
    Vector.rotateAbout = function(vector, angle, point) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return {
        x:point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin),
        y:point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos)
      };
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
    Vector.add = function(vectorA, vectorB) {
      return {
        x:vectorA.x + vectorB.x,
        y:vectorA.y + vectorB.y
      };
    };
    Vector.sub = function(vectorA, vectorB) {
      return {
        x:vectorA.x - vectorB.x,
        y:vectorA.y - vectorB.y
      };
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
  })();
  var Vertices = {};
  (function() {
    Vertices.create = function(vertices, body) {
      for (var i = 0; i < vertices.length; i++) {
        vertices[i].index = i;
        vertices[i].body = body;
      }
    };
    Vertices.fromPath = function(path) {
      var pathPattern = /L\s*([\-\d\.]*)\s*([\-\d\.]*)/gi, vertices = [];
      path.replace(pathPattern, function(match, x, y) {
        vertices.push({
          x:parseFloat(x, 10),
          y:parseFloat(y, 10)
        });
      });
      return vertices;
    };
    Vertices.centre = function(vertices) {
      var cx = 0, cy = 0;
      for (var i = 0; i < vertices.length; i++) {
        cx += vertices[i].x;
        cy += vertices[i].y;
      }
      return {
        x:cx / vertices.length,
        y:cy / vertices.length
      };
    };
    Vertices.area = function(vertices) {
      var area = 0, j = vertices.length - 1;
      for (var i = 0; i < vertices.length; i++) {
        area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
        j = i;
      }
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
    };
    Vertices.rotate = function(vertices, angle, point) {
      if (angle === 0) return;
      var cos = Math.cos(angle), sin = Math.sin(angle);
      for (var i = 0; i < vertices.length; i++) {
        var vertice = vertices[i], dx = vertice.x - point.x, dy = vertice.y - point.y;
        vertice.x = point.x + (dx * cos - dy * sin);
        vertice.y = point.y + (dx * sin + dy * cos);
      }
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
      Render.setBackground(render, render.options.background);
      if (Common.isElement(render.element)) {
        render.element.appendChild(render.canvas);
      } else {
        Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', "warn");
      }
      return render;
    };
    Render.clear = function(render) {};
    Render.setBackground = function(render, background) {
      if (render.currentBackground !== background) {
        var cssBackground = background;
        if (/(jpg|gif|png)$/.test(background)) cssBackground = "url(" + background + ")";
        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
      }
    };
    Render.world = function(engine) {
      var render = engine.render, world = engine.world, canvas = render.canvas, context = render.context, options = render.options, allBodies = Composite.allBodies(world), allConstraints = Composite.allConstraints(world), bodies = [], constraints = [], i;
      if (options.wireframes) {
        Render.setBackground(render, options.wireframeBackground);
      } else {
        Render.setBackground(render, options.background);
      }
      context.globalCompositeOperation = "source-in";
      context.fillStyle = "transparent";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      if (options.hasBounds) {
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
        context.translate(-render.bounds.min.x, -render.bounds.min.y);
      } else {
        constraints = allConstraints;
        bodies = allBodies;
      }
      if (!options.wireframes || engine.enableSleeping && options.showSleeping) {
        Render.bodies(engine, bodies, context);
      } else {
        Render.bodyWireframes(engine, bodies, context);
      }
      if (options.showBounds) Render.bodyBounds(engine, bodies, context);
      if (options.showAxes || options.showAngleIndicator) Render.bodyAxes(engine, bodies, context);
      if (options.showPositions) Render.bodyPositions(engine, bodies, context);
      if (options.showVelocity) Render.bodyVelocity(engine, bodies, context);
      if (options.showIds) Render.bodyIds(engine, bodies, context);
      if (options.showCollisions) Render.collisions(engine, engine.pairs.list, context);
      Render.constraints(constraints, context);
      if (options.showBroadphase && engine.broadphase.current === "grid") Render.grid(engine, engine.broadphase[engine.broadphase.current].instance, context);
      if (options.showDebug) Render.debug(engine, context);
      if (options.hasBounds) context.translate(render.bounds.min.x, render.bounds.min.y);
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
      var c = context, render = engine.render, options = render.options;
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
      var c = context, render = engine.render, options = render.options, i;
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        if (body.render.sprite && body.render.sprite.texture && !options.wireframes) {
          var sprite = body.render.sprite, texture = _getTexture(render, sprite.texture);
          if (options.showSleeping && body.isSleeping) c.globalAlpha = .5;
          c.translate(body.position.x, body.position.y);
          c.rotate(body.angle);
          c.drawImage(texture, texture.width * -.5 * sprite.xScale, texture.height * -.5 * sprite.yScale, texture.width * sprite.xScale, texture.height * sprite.yScale);
          c.rotate(-body.angle);
          c.translate(-body.position.x, -body.position.y);
          if (options.showSleeping && body.isSleeping) c.globalAlpha = 1;
        } else {
          if (body.circleRadius) {
            c.beginPath();
            c.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
          } else {
            c.beginPath();
            c.moveTo(body.vertices[0].x, body.vertices[0].y);
            for (var j = 1; j < body.vertices.length; j++) {
              c.lineTo(body.vertices[j].x, body.vertices[j].y);
            }
            c.closePath();
          }
          if (!options.wireframes) {
            if (options.showSleeping && body.isSleeping) {
              c.fillStyle = Common.shadeColor(body.render.fillStyle, 50);
            } else {
              c.fillStyle = body.render.fillStyle;
            }
            c.lineWidth = body.render.lineWidth;
            c.strokeStyle = body.render.strokeStyle;
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
    };
    Render.bodyWireframes = function(engine, bodies, context) {
      var c = context, i, j;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        c.moveTo(body.vertices[0].x, body.vertices[0].y);
        for (j = 1; j < body.vertices.length; j++) {
          c.lineTo(body.vertices[j].x, body.vertices[j].y);
        }
        c.lineTo(body.vertices[0].x, body.vertices[0].y);
      }
      c.lineWidth = 1;
      c.strokeStyle = "#bbb";
      c.stroke();
    };
    Render.bodyBounds = function(engine, bodies, context) {
      var c = context, render = engine.render, options = render.options;
      c.beginPath();
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.render.visible) c.rect(body.bounds.min.x, body.bounds.min.y, body.bounds.max.x - body.bounds.min.x, body.bounds.max.y - body.bounds.min.y);
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
      var c = context, render = engine.render, options = render.options, i, j;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        if (options.showAxes) {
          for (j = 0; j < body.axes.length; j++) {
            var axis = body.axes[j];
            c.moveTo(body.position.x, body.position.y);
            c.lineTo(body.position.x + axis.x * 20, body.position.y + axis.y * 20);
          }
        } else {
          c.moveTo(body.position.x, body.position.y);
          c.lineTo((body.vertices[0].x + body.vertices[body.vertices.length - 1].x) / 2, (body.vertices[0].y + body.vertices[body.vertices.length - 1].y) / 2);
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
      var c = context, render = engine.render, options = render.options, body, i;
      c.beginPath();
      for (i = 0; i < bodies.length; i++) {
        body = bodies[i];
        if (body.render.visible) {
          c.arc(body.position.x, body.position.y, 3, 0, 2 * Math.PI, false);
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
      var c = context, render = engine.render, options = render.options;
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
      var c = context;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (!body.render.visible) continue;
        c.font = "12px Arial";
        c.fillStyle = "rgba(255,255,255,0.5)";
        c.fillText(body.id, body.position.x + 10, body.position.y - 10);
      }
    };
    Render.collisions = function(engine, pairs, context) {
      var c = context, options = engine.render.options, pair, collision, i, j;
      c.beginPath();
      for (i = 0; i < pairs.length; i++) {
        pair = pairs[i];
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
        collision = pair.collision;
        if (pair.activeContacts.length > 0) {
          var normalPosX = pair.activeContacts[0].vertex.x, normalPosY = pair.activeContacts[0].vertex.y;
          if (pair.activeContacts.length === 2) {
            normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
            normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
          }
          c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
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
      var engine = inspector.engine, mouse = engine.input.mouse, selected = inspector.selected, c = context, render = engine.render, options = render.options, bounds;
      if (options.hasBounds) context.translate(-render.bounds.min.x, -render.bounds.min.y);
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
      if (options.hasBounds) context.translate(render.bounds.min.x, render.bounds.min.y);
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
    var _getTexture = function(render, imagePath) {
      var image = render.textures[imagePath];
      if (image) return image;
      image = render.textures[imagePath] = new Image();
      image.src = imagePath;
      return image;
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
      var render = Common.extend(defaults, options);
      render.context = new PIXI.WebGLRenderer(800, 600, render.canvas, false, true);
      render.canvas = render.context.view;
      render.stage = new PIXI.Stage();
      render.textures = {};
      render.sprites = {};
      render.primitives = {};
      render.spriteBatch = new PIXI.SpriteBatch();
      render.stage.addChild(render.spriteBatch);
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
      var stage = render.stage, spriteBatch = render.spriteBatch;
      while (stage.children[0]) {
        stage.removeChild(stage.children[0]);
      }
      while (spriteBatch.children[0]) {
        spriteBatch.removeChild(spriteBatch.children[0]);
      }
      var bgSprite = render.sprites["bg-0"];
      render.textures = {};
      render.sprites = {};
      render.primitives = {};
      render.sprites["bg-0"] = bgSprite;
      if (bgSprite) spriteBatch.addChildAt(bgSprite, 0);
      render.stage.addChild(render.spriteBatch);
      render.currentBackground = null;
    };
    RenderPixi.setBackground = function(render, background) {
      if (render.currentBackground !== background) {
        var isColor = background.indexOf && background.indexOf("#") !== -1, bgSprite = render.sprites["bg-0"];
        if (isColor) {
          var color = Common.colorToNumber(background);
          render.stage.setBackgroundColor(color);
          if (bgSprite) render.spriteBatch.removeChild(bgSprite);
        } else {
          if (!bgSprite) {
            var texture = _getTexture(render, background);
            bgSprite = render.sprites["bg-0"] = new PIXI.Sprite(texture);
            bgSprite.position.x = 0;
            bgSprite.position.y = 0;
            render.spriteBatch.addChildAt(bgSprite, 0);
          }
        }
        render.currentBackground = background;
      }
    };
    RenderPixi.world = function(engine) {
      var render = engine.render, world = engine.world, context = render.context, stage = render.stage, options = render.options, bodies = Composite.allBodies(world), constraints = Composite.allConstraints(world), i;
      if (options.wireframes) {
        RenderPixi.setBackground(render, options.wireframeBackground);
      } else {
        RenderPixi.setBackground(render, options.background);
      }
      for (i = 0; i < bodies.length; i++) RenderPixi.body(engine, bodies[i]);
      for (i = 0; i < constraints.length; i++) RenderPixi.constraint(engine, constraints[i]);
      context.render(stage);
    };
    RenderPixi.constraint = function(engine, constraint) {
      var render = engine.render, bodyA = constraint.bodyA, bodyB = constraint.bodyB, pointA = constraint.pointA, pointB = constraint.pointB, stage = render.stage, constraintRender = constraint.render, primitiveId = "c-" + constraint.id, primitive = render.primitives[primitiveId];
      if (!primitive) primitive = render.primitives[primitiveId] = new PIXI.Graphics();
      if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
        primitive.clear();
        return;
      }
      if (stage.children.indexOf(primitive) === -1) stage.addChild(primitive);
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
        var spriteId = "b-" + body.id, sprite = render.sprites[spriteId], spriteBatch = render.spriteBatch;
        if (!sprite) sprite = render.sprites[spriteId] = _createBodySprite(render, body);
        if (spriteBatch.children.indexOf(sprite) === -1) spriteBatch.addChild(sprite);
        sprite.position.x = body.position.x;
        sprite.position.y = body.position.y;
        sprite.rotation = body.angle;
      } else {
        var primitiveId = "b-" + body.id, primitive = render.primitives[primitiveId], stage = render.stage;
        if (!primitive) {
          primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
          primitive.initialAngle = body.angle;
        }
        if (stage.children.indexOf(primitive) === -1) stage.addChild(primitive);
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
      var bodyRender = body.render, options = render.options, primitive = new PIXI.Graphics();
      primitive.clear();
      if (!options.wireframes) {
        primitive.beginFill(Common.colorToNumber(bodyRender.fillStyle), 1);
        primitive.lineStyle(body.render.lineWidth, Common.colorToNumber(bodyRender.strokeStyle), 1);
      } else {
        primitive.beginFill(0, 0);
        primitive.lineStyle(1, Common.colorToNumber("#bbb"), 1);
      }
      primitive.moveTo(body.vertices[0].x - body.position.x, body.vertices[0].y - body.position.y);
      for (var j = 1; j < body.vertices.length; j++) {
        primitive.lineTo(body.vertices[j].x - body.position.x, body.vertices[j].y - body.position.y);
      }
      primitive.lineTo(body.vertices[0].x - body.position.x, body.vertices[0].y - body.position.y);
      primitive.endFill();
      if (options.showAngleIndicator || options.showAxes) {
        primitive.beginFill(0, 0);
        if (options.wireframes) {
          primitive.lineStyle(1, Common.colorToNumber("#CD5C5C"), 1);
        } else {
          primitive.lineStyle(1, Common.colorToNumber(body.render.strokeStyle));
        }
        primitive.moveTo(0, 0);
        primitive.lineTo((body.vertices[0].x + body.vertices[body.vertices.length - 1].x) / 2 - body.position.x, (body.vertices[0].y + body.vertices[body.vertices.length - 1].y) / 2 - body.position.y);
        primitive.endFill();
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
  Matter.Metrics = Metrics;
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