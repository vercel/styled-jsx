// Packages
import test from 'ava'

// Ours
import macros from 'babel-plugin-macros'
import jsx from 'babel-plugin-syntax-jsx'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [macros, jsx],
    ...opts
  })

test('transpiles correctly', async t => {
  const { code } = await transform('./fixtures/macro.js')
  t.snapshot(code)
})
