/*** load gulp and plugins ***/

const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const cleancss = require('gulp-clean-css');
const browsersync = require('browser-sync');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');
const rev = require('gulp-rev');
const revdelete = require('gulp-rev-delete-original');
const revrewrite = require('gulp-rev-rewrite');
const sass = require('gulp-sass');
const terser = require('gulp-terser');
const useref = require('gulp-useref')

/*** gulp tasks ***/

// compile sass
function compileSass() {
  return gulp.src('src/sass/**/*.scss')
  .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
  .pipe(autoprefixer())
  .pipe(rename('styles.css'))
  .pipe(gulp.dest('src/css'))
  .pipe(browsersync.stream());
}

// start dev server and watch for changes to sass, js, and html files
function watchDev() {
  browsersync.init({
    server: {
      baseDir: './src',
      serveStaticOptions: {
        extensions: ['html']
      }
      // routes: {
      //   '/desired/url': 'path/to/file.html'
      // }
    }
  });
  gulp.watch('src/sass/**/*.scss', compileSass);
  gulp.watch('src/js/**/*.js').on('change', browsersync.reload);
  gulp.watch('src/**/*.html').on('change', browsersync.reload);
}

function testDist() {
  browsersync.init({
    server: {
      baseDir: 'dist',
      serveStaticOptions: {
        extensions: ['html']
      }
    }
  });
}

function cleanDist() {
  return gulp.src('dist', { read: false, allowEmpty: true })
  .pipe(clean());
}

function processFiles() {
  return gulp.src('src/index.html')
  .pipe(useref())
  .pipe(gulpif('*.js', terser({ keep_fnames: true, mangle: false })))
  .pipe(gulpif('*.css', cleancss()))
  .pipe(gulpif('*.html', htmlmin({ collapseWhitespace: true })))
  .pipe(gulp.dest('dist'));
}

function revisionAssets() {
  return gulp.src(['dist/css/*.css', 'dist/js/*.js'])
  .pipe(rev())
  .pipe(gulpif('*.css', gulp.dest('dist/css')))
  .pipe(gulpif('*.js', gulp.dest('dist/js')))
  .pipe(revdelete())
  .pipe(rev.manifest())
  .pipe(gulp.dest('dist'));
}

function revisionRewrite() {
  const manifest = gulp.src('dist/rev-manifest.json');
  return gulp.src('dist/*.html')
  .pipe(revrewrite({ manifest }))
  .pipe(gulp.dest('dist'));
}

function processImages() {
  return gulp.src('src/img/**/*.*')
  .pipe(imagemin({ verbose: true }))
  .pipe(gulp.dest('dist/img'))
}

/*** gulp commands ***/

exports.default = gulp.series(compileSass, watchDev);
exports.build = gulp.series(compileSass, cleanDist, processFiles, revisionAssets, revisionRewrite, processImages);
exports.test = gulp.series(compileSass, cleanDist, processFiles, revisionAssets, revisionRewrite, processImages, testDist);
exports.watch = gulp.series(compileSass, watchDev);