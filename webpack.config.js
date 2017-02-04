"use strict";

const webpack = require('webpack');
const fs = require('node-fs-extra');
const path = require('path');
const pkg = require('./package.json');
const Case = require('case');
const uglify = require('uglify-js');
const glob = require('glob');

const isDevServer = process.argv.join(' ').includes('webpack-dev-server');
const name = Case.kebab(pkg.name);
const date = new Date().toISOString().slice(0, 10);
const author = pkg.author.slice(0, pkg.author.indexOf(' <'));
const banner = `${name} ${pkg.version} by ${author} ${date}
${pkg.homepage}
License ${pkg.license}`;

let postBuildTasksPlugin = {
  apply: function(compiler) {
    fs.copySync(
      path.dirname(require.resolve('matter-js')) + '/matter.min.js',
      'docs/demo/lib/matter.min.js'
    );

    if (isDevServer) {
      return;
    }

    let buildDir = compiler.options.output.path;

    // minify and rename all output
    compiler.plugin('after-emit', function() {
      glob(buildDir + '/*.js', (error, files) => {
        files.forEach((file) => {
          if (!file.includes('.min.js')) {
            var lowerFile = file.toLowerCase();

            fs.writeFileSync(
              lowerFile.replace(/\.js$/, '.min.js'),
              uglify.minify(file, {
                compress: true,
                output: {
                  comments: /^\!/
                }
              }).code
            );

            fs.renameSync(file, lowerFile);
          }
        });

        // copy libs to demo page
        fs.copySync(buildDir, 'docs/demo/lib');
      });
    });
  }
};

module.exports = {
  entry: {
    Inspector: './src/tools/Inspector',
    Demo: './src/tools/Demo',
    Gui: './src/tools/Gui',
    Serializer: './src/tools/Serializer'
  },
  output: {
    library: [Case.pascal(name), '[name]'],
    path: './build',
    publicPath: '/demo/lib',
    filename: 'matter-tools.[name].js',
    libraryTarget: 'umd'
  },
  alias: {
    '$': 'src/JqueryStub',
    'jquery': 'src/JqueryStub'
  },
  externals: {
    'matter-js': 'Matter',
    'jquery': 'jQuery',
    'matter-tools': 'MatterTools'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'exports-loader'
      },
      { 
        test: /\.css$/,
        loader: "raw-loader" 
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'string-replace',
        query: {
          multiple: [
            { search: '%NAME%', replace: name },
            { search: '%VERSION%', replace: pkg.version }
          ]
        }
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    postBuildTasksPlugin
  ],
  devServer: {
    proxy: {
      '/demo/lib/matter-tools.gui.js': {
        target: 'http://localhost:8080',
        pathRewrite: {'\\.gui' : '.Gui'}
      },
      '/demo/lib/matter-tools.demo.js': {
        target: 'http://localhost:8080',
        pathRewrite: {'\\.demo' : '.Demo'}
      },
      '/demo/lib/matter-tools.inspector.js': {
        target: 'http://localhost:8080',
        pathRewrite: {'\\.inspector' : '.Inspector'}
      },
      '/demo/lib/matter-tools.serializer.js': {
        target: 'http://localhost:8080',
        pathRewrite: {'\\.serializer' : '.Serializer'}
      }
    }
  }
};