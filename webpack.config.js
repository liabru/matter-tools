"use strict";

const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');
const fs = require('fs');
const execSync = require('child_process').execSync;
const Case = require('case');

module.exports = (env = {}) => {
  const minimize = env.MINIMIZE || false;
  const alpha = env.ALPHA || false;
  const maxSize = 350 * 1024;
  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const version = !alpha ? pkg.version : `${pkg.version}-alpha+${commitHash}`;
  const license = fs.readFileSync('LICENSE', 'utf8');
  const date = new Date().toISOString().slice(0, 10);
  const name = pkg.name;
  const alphaInfo = 'Experimental pre-release build.\n  ';
  
  const banner = 
`${pkg.name} ${version} by @liabru ${date}
${alpha ? alphaInfo : ''}${pkg.homepage}
License ${pkg.license}${!minimize ? '\n\n' + license : ''}`;

  return {
    entry: {
      Inspector: './src/tools/Inspector',
      Demo: './src/tools/Demo',
      Gui: './src/tools/Gui',
      Serializer: './src/tools/Serializer'
    },
    output: {
      library: ['MatterTools', '[name]'],
      path: './build',
      publicPath: '/demo/lib',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'this',
      path: path.resolve(__dirname, './build'),
      filename: params => `matter-tools.${Case.camel(params.chunk.name)}${minimize ? '.min' : ''}.js`
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: 'raw-loader',
              options: {
              esModule: false,
              },
            },
          ],
        }      
      ]
    },
    optimization: { minimize },
    performance: {
      maxEntrypointSize: maxSize,
      maxAssetSize: maxSize
    },
    plugins: [
      new webpack.BannerPlugin(banner),
      new webpack.DefinePlugin({
        '%NAME%': name,
        '%VERSION%': version
      })
    ],
    resolve: {
      alias: {
        'jquery': 'jquery/dist/jquery.min',
        'jstree': 'jstree/dist/jstree.min',
        'dat.gui': 'dat.gui/build/dat.gui.min'
      }
    },
    externals: {
      'matter-js': {
        commonjs: 'matter-js',
        commonjs2: 'matter-js',
        amd: 'matter-js',
        root: 'Matter'
      },
      'matter-tools': {
        commonjs: 'matter-tools',
        commonjs2: 'matter-tools',
        amd: 'matter-tools',
        root: 'MatterTools'
      }
    },
    devServer: {
      open: true,
      openPage: '',
      compress: true,
      port: 8080,
      contentBase: [
        path.resolve(__dirname, './docs'),
        path.resolve(__dirname, './node_modules/matter-js/build')
      ],
      proxy: {
        '/demo/lib/matter.min.js': {
          target: 'http://localhost:8080/',
          pathRewrite: { '^/demo/lib/' : '/' }
        }
      }
    }
  };
};
