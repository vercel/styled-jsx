import {join} from 'path'
import {gzipSync} from 'zlib'
import _ from 'babel-polyfill'
import gulp from 'gulp'
import babel from 'gulp-babel'
import {transformFile} from 'babel-core'
import size from 'human-size'

gulp.task('transpile', () => {
  gulp.src('src/**/*.js')
  .pipe(babel())
  .pipe(gulp.dest('dist'))
})

gulp.task('runtime-size', async () => {
  const files = ['flush.js', 'memory.js', 'render.js', 'style.js']

  const result = await Promise.all(files
  .map(f => join(__dirname, 'src', f))
  .map(transform))

  const code = result.map(({code}) => code).join('')

  console.log('-----------------------------------------------')
  console.log('files:', files.join(', '))
  console.log('minified:', size(code.length))
  console.log('minified and gzipped:', size(gzipSync(code).length))
  console.log('-----------------------------------------------')

  function transform(file) {
    return new Promise((resolve, reject) => {
      transformFile(file, {
        presets: ['babili']
      }, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
})

gulp.task('watch', () => gulp.watch('src/*', ['transpile']))
gulp.task('default', ['transpile', 'watch'])
