// Packages
import test from 'ava'

// Ours
import plugin from '../src/babel'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [[plugin, opts]]
  })

test('transpiles external stylesheets', async t => {
  const { code } = await transform('./fixtures/styles.js')
  t.snapshot(code)
})

test('(optimized) transpiles external stylesheets', async t => {
  const { code } = await transform('./fixtures/styles.js', {
    optimizeForSpeed: true
  })
  t.snapshot(code)
})

test('transpiles external stylesheets (CommonJS modules)', async t => {
  const { code } = await transform('./fixtures/styles2.js')
  t.snapshot(code)
})

test('(optimized) transpiles external stylesheets (CommonJS modules)', async t => {
  const { code } = await transform('./fixtures/styles2.js', {
    optimizeForSpeed: true
  })
  t.snapshot(code)
})

test('does not transpile non-styled-jsx tagged teplate literals', async t => {
  const { code } = await transform(
    './fixtures/not-styled-jsx-tagged-templates.js'
  )
  t.snapshot(code)
})

test('throws when using `this.something` in external stylesheets', async t => {
  const { message } = await t.throws(
    transform('./fixtures/styles-external-invalid.js')
  )
  t.regex(message, /this\.props/)
})

test('throws when referring an undefined value in external stylesheets', async t => {
  const { message } = await t.throws(
    transform('./fixtures/styles-external-invalid2.js')
  )
  t.regex(message, /props\.color/)
})

test('use external stylesheets', async t => {
  const { code } = await transform('./fixtures/external-stylesheet.js')
  t.snapshot(code)
})

test('use external stylesheets (multi-line)', async t => {
  const { code } = await transform(
    './fixtures/external-stylesheet-multi-line.js'
  )
  t.snapshot(code)
})

test('use external stylesheets (global only)', async t => {
  const { code } = await transform('./fixtures/external-stylesheet-global.js')
  t.snapshot(code)
})
