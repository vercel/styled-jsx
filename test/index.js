// Packages
import test from 'ava'
import React from 'react'
import ReactDOM from 'react-dom/server'

// Ours
import plugin from '../src/babel'
import JSXStyle from '../src/style'
import flush, { flushToHTML } from '../src/server'
import _transform from './_transform'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [plugin],
    ...opts
  })

test('works with stateless', async t => {
  const { code } = await transform('./fixtures/stateless.js')
  t.snapshot(code)
})

test('ignores whitespace around expression container', async t => {
  const { code } = await transform('./fixtures/whitespace.js')
  t.snapshot(code)
})

test('works with class', async t => {
  const { code } = await transform('./fixtures/class.js')
  t.snapshot(code)
})

test('ignores when attribute is absent', async t => {
  const { code } = await transform('./fixtures/absent.js')
  t.snapshot(code)
})

test('works with global styles', async t => {
  const { code } = await transform('./fixtures/global.js')
  t.snapshot(code)
})

test('generates source maps', async t => {
  const { code } = await transform('./fixtures/source-maps.js', {
    sourceMaps: true
  })
  t.snapshot(code)
})

test('mixed global and scoped', async t => {
  const { code } = await transform('./fixtures/mixed-global-scoped.js')
  t.snapshot(code)
})

test('works with multiple jsx blocks', async t => {
  const { code } = await transform('./fixtures/multiple-jsx.js')
  t.snapshot(code)
})

test('should not add the data-jsx attribute to components instances', async t => {
  const { code } = await transform('./fixtures/component-attribute.js')
  t.snapshot(code)
})

test('works with expressions in template literals', async t => {
  const { code } = await transform('./fixtures/expressions.js')
  t.snapshot(code)
})

test('should have different jsx ids', async t => {
  const { code } = await transform('./fixtures/different-jsx-ids.js')
  t.snapshot(code)
})

test('works with non styled-jsx styles', async t => {
  const { code } = await transform('./fixtures/non-styled-jsx-style.js')
  t.snapshot(code)
})

test('works with css tagged template literals in the same file', async t => {
  const { code } = await transform('./fixtures/css-tag-same-file.js')
  t.snapshot(code)
})

test('does not transpile nested style tags', async t => {
  const { message } = await t.throws(
    transform('./fixtures/nested-style-tags.js')
  )
  t.regex(message, /detected nested style tag/i)
})

test('server rendering', t => {
  function App() {
    const color = 'green'
    return React.createElement(
      'div',
      null,
      React.createElement(JSXStyle, {
        css: 'p { color: red }',
        styleId: 1
      }),
      React.createElement(JSXStyle, {
        css: 'div { color: blue }',
        styleId: 2
      }),
      React.createElement(JSXStyle, {
        css: `div { color: ${color} }`,
        styleId: 3
      })
    )
  }
  // Expected CSS
  const expected =
    '<style id="__jsx-1">p { color: red }</style>' +
    '<style id="__jsx-2">div { color: blue }</style>' +
    '<style id="__jsx-3">div { color: green }</style>'

  // Render using react
  ReactDOM.renderToString(React.createElement(App))
  const html = ReactDOM.renderToStaticMarkup(
    React.createElement('head', null, flush())
  )

  t.is(html, `<head>${expected}</head>`)

  // Assert that memory is empty
  t.is(0, flush().length)
  t.is('', flushToHTML())

  // Render to html again
  ReactDOM.renderToString(React.createElement(App))
  t.is(expected, flushToHTML())

  // Assert that memory is empty
  t.is(0, flush().length)
  t.is('', flushToHTML())
})
