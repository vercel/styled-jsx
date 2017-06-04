// Packages
import test from 'ava'
import escapeStringRegExp from 'escape-string-regexp'

// Ours
import plugin from '../src/babel-external'
import { MARKUP_ATTRIBUTE_EXTERNAL } from '../src/_constants'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [[plugin, opts]]
  })

test('transpiles external stylesheets', async t => {
  const { code } = await transform('./fixtures/styles.js')
  t.snapshot(code)
})

test('transpiles external stylesheets (CommonJS modules)', async t => {
  const { code } = await transform('./fixtures/styles2.js')
  t.snapshot(code)
})

test('transpiles external stylesheets with validation', async t => {
  const { code } = await transform('./fixtures/styles.js', {
    validate: true
  })
  t.regex(code, new RegExp(escapeStringRegExp(MARKUP_ATTRIBUTE_EXTERNAL), 'g'))
  t.snapshot(code)
})
