// Packages
import test from 'ava'

// Ours
import macros from 'babel-plugin-macros'
import jsx from 'babel-plugin-syntax-jsx'
import _transform, { transformSource as _transformSource } from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [macros, jsx],
    ...opts
  })

const transformSource = (src, opts = {}) =>
  _transformSource(src.trim(), {
    plugins: [macros, jsx],
    ...opts
  })

test('transpiles correctly', async t => {
  const { code } = await transform('./fixtures/macro.js')
  t.snapshot(code)
})

test('throws when using the default export directly', async t => {
  const { message } = await t.throws(
    transformSource(`
    import css from './src/macro'

    css\`div { color: red }\`
  `)
  )

  t.regex(message, /can't use default import directly/i)
})

test('throws when using the default export directly and it is not called css', async t => {
  const { message } = await t.throws(
    transformSource(`
    import foo from './src/macro'

    foo\`div { color: red }\`
  `)
  )

  t.regex(message, /can't use default import directly/i)
})

test('throws when using the default export directly and it is not called resolve', async t => {
  const { message } = await t.throws(
    transformSource(`
    import resolve from './src/macro'

    resolve\`div { color: red }\`
  `)
  )

  t.regex(message, /can't use default import directly/i)
})

test('throws when using an invalid method from the default export', async t => {
  const { message } = await t.throws(
    transformSource(`
    import css from './src/macro'

    css.foo\`div { color: red }\`
  `)
  )

  t.regex(message, /using an invalid tag/i)
})

test('throws when using a named import different than resolve', async t => {
  const { message } = await t.throws(
    transformSource(`
    import { foo } from './src/macro'

    foo\`div { color: red }\`
  `)
  )

  t.regex(message, /imported an invalid named import/i)
})

test('throws when using a named import as a member expression', async t => {
  const { message } = await t.throws(
    transformSource(`
    import { resolve } from './src/macro'

    resolve.foo\`div { color: red }\`
  `)
  )

  t.regex(message, /can't use named import/i)
})

test('can alias the named import', async t => {
  const { code } = await transformSource(`
    import { resolve as foo } from './src/macro'

    foo\`div { color: red }\`
  `)
  t.snapshot(code)
})

test('injects JSXStyle for nested scope', async t => {
  const { code } = await transformSource(`
    import { resolve } from './src/macro'

    function test() {
      resolve\`div { color: red }\`
    }
  `)
  t.snapshot(code)
})
