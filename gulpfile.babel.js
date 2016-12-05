// Packages
import gulp from 'gulp'
import babel from 'gulp-babel'

gulp.task('transpile', () =>
  gulp.src('src/**/*.js')
  .pipe(babel())
  .pipe(gulp.dest('dist')))

gulp.task('watch', () => gulp.watch('src/*', ['transpile']))
gulp.task('default', ['transpile', 'watch'])
