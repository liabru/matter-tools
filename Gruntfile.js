module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    buildName: 'matter-tools',
    buildVersion: '<%= pkg.version %>-edge',
    docVersion: 'v<%= pkg.version %>',
    concat: {
      build: {
        options: {
          process: function(src, filepath) {
            return '// Begin ' + filepath + '\n\n' + src + '\n\n;   // End ' + filepath + '\n\n';
          }
        },
        src: ['src/**/*.js', '!src/module/*'],
        dest: 'build/<%= buildName %>.js'
      },
      pack: {
        options: {
          banner: '/**\n* <%= buildName %>.js <%= buildVersion %> <%= grunt.template.today("yyyy-mm-dd") %>\n* <%= pkg.homepage %>\n* License: <%= pkg.license %>\n*/\n\n'
        },
        src: ['src/module/Intro.js', 'build/<%= buildName %>.js', 'src/module/Outro.js', 'libs/**/*.js'],
        dest: 'build/<%= buildName %>.js'
      },
      buildCss: {
        src: ['libs/jstree/themes/default/style.min.css', 'src/css/*.css'],
        dest: 'build/matter-tools.css'
      }
    },
    uglify: {
      min: {
        options: {
          banner: '/**\n* <%= buildName %>.min.js <%= buildVersion %> <%= grunt.template.today("yyyy-mm-dd") %>\n* <%= pkg.homepage %>\n* License: <%= pkg.license %>\n*/\n\n'
        },
        src: 'build/<%= buildName %>.js',
        dest: 'build/<%= buildName %>.min.js'
      },
      dev: {
        options: {
          mangle: false,
          compress: false,
          preserveComments: false,
          beautify: {
            width: 32000,
            indent_level: 2,
            space_colon: false,
            beautify: true
          },
          banner: '/**\n* <%= buildName %>.min.js <%= buildVersion %> <%= grunt.template.today("yyyy-mm-dd") %>\n* <%= pkg.homepage %>\n* License: <%= pkg.license %>\n*/\n\n'
        },
        src: 'build/<%= buildName %>.js',
        dest: 'build/<%= buildName %>.js'
      }
    },
    cssmin: {
      minify: {
        src: ['build/matter-tools.css'],
        dest: 'build/matter-tools.min.css'
      }
    },
    copy: {
      demo: {
        files: [
          {
            src: 'build/<%= buildName %>.js',
            dest: 'demo/js/libs/<%= buildName %>.js'
          },
          {
            src: 'build/matter-tools.css',
            dest: 'demo/css/matter-tools.css'
          }
        ]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['src/**/*.js', '!src/module/*']
    },
    connect: {
      watch: {
        options: {
          port: 9000,
          open: 'http://localhost:9000/demo',
          livereload: 9001
        }
      }
    },
    watch: {
      options: {
        livereload: {
          port: 9001
        }
      },
      src: {
        files: ['src/**/*.js', 'src/**/*.css'],
        tasks: ['build:dev']
      },
      demo: {
        files: ['demo/js/**/*.html', 'demo/js/**/*.js', 'demo/css/**/*.css']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['test', 'build']);
  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('dev', ['build:dev', 'connect:watch', 'watch']);

  grunt.registerTask('build', function(mode) {
    var isDev = (mode === 'dev'),
        isRelease = (mode === 'release'),
        isEdge = (mode === 'edge'),
        pkg = grunt.file.readJSON('package.json'),
        uglifyTask;

    // development build mode
    if (isDev) {
      grunt.config.set('buildName', 'matter-tools-dev');
      grunt.config.set('buildVersion', pkg.version + '-dev');
      grunt.task.run('concat', 'uglify:dev', 'uglify:min', 'cssmin', 'copy');
    }

    // release build mode
    if (isRelease) {
      grunt.config.set('buildName', 'matter-tools-' + pkg.version);
      grunt.config.set('buildVersion', pkg.version + '-alpha');
      grunt.task.run('concat', 'uglify:min', 'cssmin', 'copy');
    }

    // edge build mode (default)
    if (isEdge || (!isDev && !isRelease)) {
      grunt.config.set('buildVersion', pkg.version + '-edge');
      grunt.task.run('concat', 'uglify:min', 'cssmin');
    }
  });

  grunt.registerTask('set_config', 'Set a config property.', function(name, val) {
    grunt.config.set(name, val);
  });
};