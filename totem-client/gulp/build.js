'use strict';

var   fs            = require('fs');
const gulp          = require('gulp');
const debug         = require('gulp-debug');
const $             = require('gulp-load-plugins')();
const path          = require('path');
const getDirName    = require('path').dirname;
const replace       = require('gulp-replace');
const config        = require('./config');
const utils         = require('./utils');
const packageFile   = require('../package.json');

/**
 * Build production version ready to deploy.
 * @gulptask build
 */
gulp.task('build', ['stampVersionCore', 'tagVersion', 'build-app', 'build-libs', 'fonts', 'locales:dist', 'other']);

/**
 * Build production version of app only, without assets.
 * @gulptask build-app
 */
gulp.task('build-app', ['inject', 'partials'], () => {
  const injectPartials = gulp.src(
      path.join(config.paths.partials, config.paths.angularTemplatecache),
      {read: false});

  const injectOptions = {
    addRootSlash: false,
    ignorePath: config.paths.partials,
    starttag: '<!-- inject:partials -->',
  };

  const filterOptions = {dot: true, restore: true};

  const excludeSourceMapsFilter = $.filter(['**', '!**/*.map'], filterOptions);
  const htmlFilter = $.filter(config.patterns.html, filterOptions);
  const scriptsFilter = $.filter(config.patterns.scripts, filterOptions);
  const stylesFilter = $.filter(config.patterns.stylesOutput, filterOptions);

  return gulp.src(path.join(config.paths.serve, '/*.html')).
      // Inject partials within `<!-- inject:partials -->` comments in HTML
      // files.
      pipe(debug()).
      pipe($.inject(injectPartials, injectOptions)).
      // Concatenate scripts and styles within
      // `<!-- build:<type>(<path>) <destination> -->` comments in HTML files.
      pipe($.useref()).
      // Filter scripts only.
      pipe(scriptsFilter).
      pipe(debug()).
      // Append revision hash to filenames.
      pipe($.rev()).
      // Initialize source mapping.
      pipe($.sourcemaps.init()).
      // Inject Angular dependencies.
      pipe($.ngAnnotate()).
      // Obfuscate scripts.
      pipe($.uglify(config.plugins.uglify)).
      on('error', utils.errorHandler('Uglify')).
      // Store source maps.
      pipe($.sourcemaps.write(config.paths.maps)).
      // Restore filtered.
      pipe(scriptsFilter.restore).
      // Filter styles only.
      pipe(stylesFilter).
      pipe(debug()).
      // Append revision hash to filenames.
      pipe($.rev()).
      // Initialize source mapping.
      pipe($.sourcemaps.init()).
      // Minify styles.
      pipe($.cssnano(config.plugins.cssnano)).
      // Store source maps.
      pipe($.sourcemaps.write(config.paths.maps)).
      // Restore filtered.
      pipe(stylesFilter.restore).
      // Exclude source maps to avoid injecting it instead of original files.
      pipe(excludeSourceMapsFilter).
      // Replace original filenames with updated.
      pipe($.revReplace()).
      // Restore source maps filtered out.
      pipe(excludeSourceMapsFilter.restore).
      // Filter HTML files.
      pipe(htmlFilter).
      pipe(debug()).
      // Convert shref links
      //pipe(replace('base href="/','base href="./')).
      // Minify HTML files.
      pipe($.htmlmin(config.plugins.htmlmin)).
      // Restore filtered.
      pipe(htmlFilter.restore).
      // Output files.
      pipe(gulp.dest(config.paths.dist)).
      // Output size of each file.
      pipe($.size({showFiles: true, title: 'build-app'}));
});

gulp.task('build-libs', () => {
  return gulp.src(path.join(config.paths.libs, '/**/*')).
         pipe(gulp.dest(config.paths.dist));
});

gulp.task('tagVersion', function(cb){
  var path = config.paths.dist + '/version';
  fs.mkdir(getDirName(path), { recursive: true}, function (err) {
    if (err) return cb(err);

    fs.writeFile(path, packageFile.version, { flag: 'w+'}, cb);
  });
  // fs.writeFile(, packageFile.version, { flag: 'a+', recursive: true }, cb);
});


gulp.task('stampVersionCore', function() {
  gulp.src(["src/app/services/core.service.js"])
    .pipe(replace(/appVersion:.*/g, "appVersion:'"+packageFile.version+"',"))
    .pipe(gulp.dest("src/app/services/"))
});