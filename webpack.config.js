"use strict";

const webpack = require('webpack');
const fs = require('fs');
const pkg = require('./package.json');
const Case = require('case');
const name = Case.kebab(pkg.name);
const date = new Date().toISOString().slice(0, 10);
const author = pkg.author.slice(0, pkg.author.indexOf(' <'));
const banner = `${name} ${pkg.version} by ${author} ${date}
${pkg.homepage}
License ${pkg.license}`;

module.exports = {
  entry: {
    [name]: './index.js',
    [name + '.min']: './index.js'
  },
  output: {
    library: Case.pascal(name),
    path: './build',
    publicPath: '/demo',
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  externals: {
    'matter-js': 'Matter',
    'jquery': 'jQuery',
    //'dat': 'dat',
    'gif': 'GIF'
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
    /*new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    }),*/
    new webpack.BannerPlugin(banner),
    { 
      apply: function() {
        // copy matter.js for the demo page
        fs.createReadStream(require.resolve('matter-js'))
          .pipe(fs.createWriteStream('docs/demo/matter.js'));
      }
    }
  ]
};