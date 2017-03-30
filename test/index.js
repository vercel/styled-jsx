// Packages
import test from 'ava'
import React from 'react'
import ReactDOM from 'react-dom/server'

// Ours
import plugin from '../src/babel'
import JSXStyle from '../src/style'
import flush, {flushToHTML} from '../src/server'
import read from './_read'
import _transform, {mockStyleJsxId} from './_transform'

const transform = (file, opts = {}) => (
  _transform(file, {
    plugins: [plugin],
    ...opts
  })
)

test('works with stateless', async t => {
  const {code} = await transform('./fixtures/stateless.js')
  const out = await read('./fixtures/stateless.out.js')
  t.is(code, out.trim())
})

test('ignores whitespace around expression container', async t => {
  const {code} = await transform('./fixtures/whitespace.js')
  const out = await read('./fixtures/whitespace.out.js')
  t.is(code, out.trim())
})

test('works with class', async t => {
  const {code} = await transform('./fixtures/class.js')
  const out = await read('./fixtures/class.out.js')
  t.is(code, out.trim())
})

test('ignores when attribute is absent', async t => {
  const {code} = await transform('./fixtures/absent.js')
  const out = await read('./fixtures/absent.out.js')
  t.is(code, out.trim())
})

test('works with global styles', async t => {
  const {code} = await transform('./fixtures/global.js')
  const out = await read('./fixtures/global.out.js')
  t.is(code, out.trim())
})

test('generates source maps', async t => {
  const {code} = await transform('./fixtures/source-maps.js', {sourceMaps: true})
  const out = await read('./fixtures/source-maps.out.js')
  t.is(code, out.trim())
})

test('mixed global and scoped', async t => {
  const {code} = await transform('./fixtures/mixed-global-scoped.js')
  const out = await read('./fixtures/mixed-global-scoped.out.js')
  t.is(code, out.trim())
})

test('works with multiple jsx blocks', async t => {
  const {code} = await transform('./fixtures/multiple-jsx.js')
  const out = await read('./fixtures/multiple-jsx.out.js')
  t.is(code, out.trim())
})

test('should not add the data-jsx attribute to components instances', async t => {
  const {code} = await transform('./fixtures/component-attribute.js')
  const out = await read('./fixtures/component-attribute.out.js')
  t.is(code, out.trim())
})

test('works with expressions in template literals', async t => {
  const {code} = await transform('./fixtures/expressions.js')
  const out = await read('./fixtures/expressions.out.js')
  t.is(code, out.trim())
})

test('should have different jsx ids', async t => {
  const {code} = await transform('./fixtures/different-jsx-ids.js')
  const out = await read('./fixtures/different-jsx-ids.out.js')
  t.is(code, out.trim())
})

test('works with non styled-jsx styles', async t => {
  const {code} = await transform('./fixtures/non-styled-jsx-style.js')
  const out = await read('./fixtures/non-styled-jsx-style.out.js')
  t.is(code, out.trim())
})

test('throws when using `props` or constants ' +
  'defined in the closest scope', async t => {
  [1, 2, 3, 4].forEach(i => {
    t.throws(
      transform(`./fixtures/invalid-expressions/${i}.js`),
      SyntaxError
    )
  })
})

test('works with external stylesheets', async t => {
  const {code} = await transform('./fixtures/external-stylesheet.js')
  const out = await read('./fixtures/external-stylesheet.out.js')
  t.is(mockStyleJsxId(code), out.trim())
})

test('server rendering', t => {
  function App() {
    const color = 'green'
    return React.createElement('div', null,
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

  // expected CSS
  const expected = '<style id="__jsx-style-1">p { color: red }</style>' +
    '<style id="__jsx-style-2">div { color: blue }</style>' +
    '<style id="__jsx-style-3">div { color: green }</style>'

  // render using react
  ReactDOM.renderToString(React.createElement(App))
  const html = ReactDOM.renderToStaticMarkup(
    React.createElement('head', null, flush())
  )
  t.is(html, `<head>${expected}</head>`)

  // assert that memory is empty
  t.is(0, flush().length)
  t.is('', flushToHTML())

  // render to html again
  ReactDOM.renderToString(React.createElement(App))
  t.is(expected, flushToHTML())

  // assert that memory is empty
  t.is(0, flush().length)
  t.is('', flushToHTML())
})
