"use strict";

/**
 * An (experimental) tool for serializing matter.js worlds.
 * @module Serializer
 */

const Serializer = module.exports = {};
const Matter = require('matter-js');
const Common = Matter.Common;
const Engine = Matter.Engine;
const Resurrect = require('exports?Resurrect!../../bower_components/resurrect-js/resurrect');

/**
 * Creates a serializer.
 * @function Serializer.create
 * @return {} A serializer
 */
Serializer.create = function() {
  let serializer = new Resurrect({ prefix: '$', cleanup: true });
  serializer.parse = serializer.resurrect;
  return serializer;
};

/**
 * Clones an object using a serializer and assigns it a new id
 * @function Serializer.clone
 * @param {object} serializer
 * @param {object} object
 * @return {} The clone
 */
Serializer.clone = function(serializer, object) {
  var clone = serializer.parse(Serializer.serialise(serializer, object));
  clone.id = Common.nextId();
  return clone;
};

/**
 * Saves world state to local storage
 * @function Serializer.saveState
 * @param {object} serializer
 * @param {engine} engine
 * @param {string} key
 */
Serializer.saveState = function(serializer, engine, key) {
  localStorage.setItem(key, Serializer.serialise(serializer, engine.world));
};

/**
 * Loads world state from local storage
 * @function Serializer.loadState
 * @param {object} serializer
 * @param {engine} engine
 * @param {string} key
 */
Serializer.loadState = function(serializer, engine, key) {
  var loadedWorld = serializer.parse(localStorage.getItem(key));

  if (loadedWorld) {
    Engine.merge(engine, { world: loadedWorld });
  }
};

/**
 * Serialises the object using the given serializer and a Matter-specific replacer
 * @function Serializer.serialise
 * @param {object} serializer
 * @param {object} object
 * @param {number} indent
 * @return {string} The serialised object
 */
Serializer.serialise = function(serializer, object, indent) {
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