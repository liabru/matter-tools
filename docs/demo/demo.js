var sourceLinkRoot = 'https://github.com/liabru/matter-tools/blob/master';

MatterTools.Demo.create({
  fullPage: true,
  preventZoom: true,
  startExample: true,
  appendTo: document.body,

  toolbar: {
    title: 'matter-tools',
    url: 'https://github.com/liabru/matter-tools',
    reset: true,
    source: true,
    inspector: true,
    tools: true,
    fullscreen: true,
    exampleSelect: true
  },

  tools: {
    inspector: true,
    gui: true
  },
  
  examples: [
    {
      name: 'Basic',
      id: 'basic',
      init: Example.basic,
      sourceLink: sourceLinkRoot + '/docs/examples/basic.js'
    },
    {
      name: 'Basic 2',
      id: 'basic-2',
      init: Example.basic,
      sourceLink: sourceLinkRoot + '/docs/examples/basic.js'
    }
  ]
});