import path from 'path'
import Benchmark from 'benchmark'
import {transformFile} from 'babel-core'

import plugin from '../src/babel'

const transform = (file, opts = {}) => (
  new Promise((resolve, reject) => {
    transformFile(path.resolve(__dirname, file), {
      babelrc: false,
      plugins: [plugin],
      ...opts
    }, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
)

module.exports = new Benchmark({
  name: 'Babel transform',
  minSamples: 500,
  defer: true,
  fn: async p => {
    await transform('./fixtures/babel.js')
    p.resolve()
  }
})
