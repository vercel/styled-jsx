import {join} from 'path'
import gulp from 'gulp'
import babel from 'gulp-babel'
import {minify} from 'uglify-js'
import size from 'human-size'

gulp.task('transpile', () => {
  gulp.src('src/**/*.js')
  .pipe(babel())
  .pipe(gulp.dest('dist'))
})

gulp.task('runtime-size', ['transpile'], () => {
  const files = ['flush.js', 'memory.js', 'render.js', 'style.js']
  const {code} = minify(files.map(f => join(__dirname, 'dist', f)))
  console.log('files:', files.join(', '))
  console.log('minified:', size(code.length))
})

gulp.task('watch', () => gulp.watch('src/*', ['transpile']))
gulp.task('default', ['transpile', 'watch'])
