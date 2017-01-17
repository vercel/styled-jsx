import {resolve} from 'path'
import Benchmark from 'benchmark'
import {transform as babel} from 'babel-core'
import fs from 'fs'

import plugin from '../src/babel'

const read = path => fs.readFileSync(resolve(__dirname, path), 'utf8')
const fixture = read('./fixtures/babel.js')

module.exports = new Benchmark({
  name: 'Babel transform',
  minSamples: 500,
  fn: () => {
    babel(fixture, {
      babelrc: false,
      plugins: [plugin]
    })
  }
})
