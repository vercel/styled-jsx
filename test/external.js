// Packages
import test from 'ava'

// Ours
import plugin from '../src/babel-external'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [plugin],
    ...opts
  })

test('transpiles external stylesheets', async t => {
  const { code } = await transform('./fixtures/styles.js')
  t.snapshot(code)
})

test('transpiles external stylesheets (CommonJS modules)', async t => {
  const { code } = await transform('./fixtures/styles2.js')
  t.snapshot(code)
})
