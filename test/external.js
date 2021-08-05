// Packages
import test from 'ava'

// Ours
import plugin from '../src/babel'
import _transform, { transformSource as _transformSource } from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [[plugin, opts]]
  })

const transformSource = (src, opts = {}) =>
  _transformSource(src.trim(), {
    plugins: [[plugin, opts]],
    ...opts
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
  const { message } = await t.throwsAsync(() =>
    transform('./fixtures/styles-external-invalid.js')
  )
  t.regex(message, /this\.props/)
})

test('throws when referring an undefined value in external stylesheets', async t => {
  const { message } = await t.throwsAsync(() =>
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

test('injects JSXStyle for nested scope', async t => {
  const { code } = await transformSource(`
    import css from 'styled-jsx/css'

    function test() {
      css.resolve\`div { color: red }\`
    }
  `)
  t.snapshot(code)
})

test('use external stylesheet and dynamic element', async t => {
  const { code } = await transform('./fixtures/dynamic-element-external.js')
  t.snapshot(code)
})

test('Makes sure that style nodes are not re-used', async t => {
  const { code } = await transformSource(
    `
    import styles from './App.styles';

    function Test() {
      return <div>
        <style jsx global>{styles}</style>
      </div>
    }
      `,
    {
      babelrc: false,
      plugins: [plugin, '@babel/plugin-transform-modules-commonjs']
    }
  )

  t.snapshot(code)
})

test('Make sure that it works with the new automatic transform', async t => {
  const { code } = await transformSource(
    `
    import css from "styled-jsx/css";

    const A = css.resolve\`
      div {
        color: green;
      }
    \`;

    export default function IndexPage() {
      return JSON.stringify(A);
    }
    `,
    {
      babelrc: false,
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      plugins: [plugin]
    }
  )

  t.snapshot(code)
})
