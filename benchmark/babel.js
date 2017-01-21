import {readFileSync} from 'fs'
import {resolve} from 'path'
import {Suite} from 'benchmark'
import {transform as babel} from 'babel-core'

import plugin from '../src/babel'

const makeTransform = fixturePath => {
  const fixture = readFileSync(
    resolve(__dirname, fixturePath),
    'utf8'
  )

  return () => babel(fixture, {
    babelrc: false,
    plugins: [plugin]
  })
}

const benchs = {
  basic: makeTransform('./fixtures/basic.js'),
  withExpressions: makeTransform('./fixtures/with-expressions.js')
}

const suite = new Suite('styled-jsx Babel transform')

module.exports =
  suite
    .add('basic', benchs.basic)
    .add('with expressions', benchs.withExpressions)
