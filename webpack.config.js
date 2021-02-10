"use strict";

const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');
const fs = require('fs');
const execSync = require('child_process').execSync;
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env = {}) => {
  const isDevServer = Boolean(process.env.WEBPACK_DEV_SERVER);
  const minimize = env.MINIMIZE || isDevServer || false;
  const alpha = env.ALPHA || false;
  const maxSize = 450 * 1024;
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
    entry: { [name]: './src/index' },
    output: {
      library: 'MatterTools',
      publicPath: '/demo/lib/',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'this',
      path: path.resolve(__dirname, './build'),
      filename: `${name}${alpha ? '.alpha' : ''}${minimize ? '.min' : ''}.js`
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
        'dat.gui': 'dat.gui/build/dat.gui.min',
        'Demo': path.resolve(__dirname, 'src/tools/Demo'),
        'Gui': path.resolve(__dirname, 'src/tools/Gui'),
        'Inspector': path.resolve(__dirname, 'src/tools/Inspector'),
        'Serializer': path.resolve(__dirname, 'src/tools/Serializer')
      }
    },
    externals: {
      'matter-js': {
        commonjs: 'matter-js',
        commonjs2: 'matter-js',
        amd: 'matter-js',
        root: 'Matter'
      }
    },
    devServer: {
      watchContentBase: true,
      hot: false,
      compress: true,
      overlay: true,
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
