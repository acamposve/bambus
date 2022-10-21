'use strict';

const gulp           = require('gulp');
const debug          = require('gulp-debug');
const $              = require('gulp-load-plugins')();
const mainBowerFiles = require('main-bower-files');

const config = require('./config');

/**
 * Copy and flatten fonts from Bower packages to distribution dir.
 * @gulptask fonts
 */
gulp.task('fonts', ['custom-fonts'], () => {
  return gulp.src(mainBowerFiles()).
      pipe(debug()).
      pipe($.filter(config.patterns.fonts)).
      pipe(debug()).
      pipe($.flatten()).
      pipe($.size({title: 'fonts'})).
      pipe(gulp.dest(config.paths.fonts));
});

gulp.task('custom-fonts', () => {
  return gulp.src(config.paths.custom_fonts+'/**/*').
      pipe(debug()).
      pipe($.filter(config.patterns.fonts)).
      pipe(debug()).
      pipe($.flatten()).
      pipe($.size({title: 'custom-fonts'})).
      pipe(gulp.dest(config.paths.fonts));
});
