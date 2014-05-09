module.exports = function(grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({

    compass: {
      dev: {
        options: {
          config: 'config.rb',
          force: true
        }
      }
    },

    watch: {
      compass: {
        files: ['sass/*.scss'],
        tasks: ['compass:dev']
      }
    }

  });

  grunt.registerTask('dev', ['watch']);
  grunt.registerTask('default', ['dev']);

}
