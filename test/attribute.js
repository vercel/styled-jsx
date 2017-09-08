// Packages
import test from 'ava'

// Ours
import plugin from '../src/babel'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [plugin],
    ...opts
  })

test('rewrites className', async t => {
  const { code } = await transform(
    './fixtures/attribute-generation-classname-rewriting.js'
  )
  t.snapshot(code)
})

test('generate attribute for mixed modes (global, static, dynamic)', async t => {
  const { code } = await transform('./fixtures/attribute-generation-modes.js')
  t.snapshot(code)
})
