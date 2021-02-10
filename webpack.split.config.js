"use strict";

const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');
const fs = require('fs');
const execSync = require('child_process').execSync;
const Case = require('case');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env = {}) => {
  const minimize = env.MINIMIZE || false;
  const alpha = env.ALPHA || false;
  const maxSize = 350 * 1024;
  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const version = !alpha ? pkg.version : `${pkg.version}-alpha+${commitHash}`;
  const license = fs.readFileSync('LICENSE', 'utf8');
  const name = pkg.name;
  const alphaInfo = 'Experimental pre-release build.\n  ';
  
  const banner = 
`${pkg.name} ${version} by @liabru
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
      publicPath: '/demo/lib/',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'this',
      path: path.resolve(__dirname, './build'),
      filename: params => `${name}.${Case.camel(params.chunk.name)}${minimize ? '.min' : ''}.js`
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
    node: false,
    optimization: { 
      minimize,
      minimizer: [
        new TerserPlugin({ 
          extractComments: false,
          terserOptions: {
            output: {
              comments: /license|copyright|\(c\)/ig,
            },
          }
        })
      ]
    },
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
      },
      'Demo': {
        commonjs: 'matter-tools/src/tools/Demo',
        commonjs2: 'matter-tools/src/tools/Demo',
        amd: 'matter-tools/src/tools/Demo',
        root: ['MatterTools', 'Demo']
      },
      'Gui': {
        commonjs: 'matter-tools/src/tools/Gui',
        commonjs2: 'matter-tools/src/tools/Gui',
        amd: 'matter-tools/src/tools/Gui',
        root: ['MatterTools', 'Gui']
      },
      'Inspector': {
        commonjs: 'matter-tools/src/tools/Inspector',
        commonjs2: 'matter-tools/src/tools/Inspector',
        amd: 'matter-tools/src/tools/Inspector',
        root: ['MatterTools', 'Inspector']
      },
      'Serializer': {
        commonjs: 'matter-tools/src/tools/Serializer',
        commonjs2: 'matter-tools/src/tools/Serializer',
        amd: 'matter-tools/src/tools/Serializer',
        root: ['MatterTools', 'Serializer']
      }
    }
  };
};
