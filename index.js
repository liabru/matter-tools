module.exports = {
  name: '%NAME%',
  version: '%VERSION%',
  for: 'matter-js@^0.11.0',
  install: () => {},
  Demo: require('./src/tools/Demo.js'),
  Gui: require('./src/tools/Gui.js'),
  Inspector: require('./src/tools/Inspector.js')
};