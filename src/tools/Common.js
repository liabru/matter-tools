"use strict";

/**
* @class Common
*/

const Common = module.exports = {};

Common.injectStyles = function(styles, id) {
  if (document.getElementById(id)) {
    return;
  }

  let root = document.createElement('div');
  root.innerHTML = `<style id="${id}" type="text/css">${styles}</style>`;

  let lastStyle = document.head.querySelector('style:last-of-type');

  if (lastStyle) {
    Common.domInsertBefore(root.firstElementChild, lastStyle);
  } else {
    document.head.appendChild(root.firstElementChild);
  }
};

Common.injectScript = function(url, id, callback) {
  if (document.getElementById(id)) {
    return;
  }

  let script = document.createElement('script');
  script.id = id;
  script.src = url;
  script.onload = callback;

  document.body.appendChild(script);
};

Common.domRemove = function(element) {
  return element.parentElement.removeChild(element);
};

Common.domInsertBefore = function(element, before) {
  return before.parentNode.insertBefore(element, before.previousElementSibling);
};
