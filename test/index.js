// Native
import path from 'path'

// Packages
import test from 'ava'
import {transformFile} from 'babel-core'
import React from 'react'
import ReactDOM from 'react-dom/server'

// Ours
import plugin from '../src/babel'
import JSXStyle from '../src/style'
import flush, {flushToHTML} from '../src/server'
import read from './_read'

const transform = (file, opts = {}) => (
  new Promise((resolve, reject) => {
    transformFile(path.resolve(__dirname, file), {
      babelrc: false,
      plugins: [plugin],
      ...opts
    }, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
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

test('server rendering', t => {
  function App() {
    return React.createElement('div', null,
      React.createElement(JSXStyle, {
        css: 'p { color: red }',
        styleId: 1
      }),
      React.createElement(JSXStyle, {
        css: 'div { color: blue }',
        styleId: 2
      })
    )
  }

  // expected CSS
  const expected = '<style id="__jsx-style-1">p { color: red }</style>' +
    '<style id="__jsx-style-2">div { color: blue }</style>'

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
