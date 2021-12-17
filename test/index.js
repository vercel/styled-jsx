// Packages
import test from 'ava'
import React from 'react'
import ReactDOM from 'react-dom/server'

// Ours
import plugin from '../src/babel'
import JSXStyle from '../src/style'
import {
  StyleRegistry,
  useStyleRegistry,
  createStyleRegistry
} from '../src/stylesheet-registry'
import _transform, { transformSource as _transformSource } from './_transform'

const flushToHTML = (registry, options = {}) => {
  const cssRules = registry.cssRules()
  registry.flush()
  return cssRules.reduce((html, args) => {
    const id = args[0]
    const css = args[1]
    html += `<style id="__${id}"${
      options.nonce ? ` nonce="${options.nonce}"` : ''
    }>${css}</style>`
    return html
  }, '')
}

function mapCssRulesToReact(cssRules, options = {}) {
  return cssRules.map(args => {
    const id = args[0]
    const css = args[1]
    return React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      nonce: options.nonce ? options.nonce : undefined,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}

function flushToReact(registry, options = {}) {
  const cssRules = registry.cssRules()
  registry.flush()
  return mapCssRulesToReact(cssRules, options)
}

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [plugin],
    ...opts
  })

const transformSource = (src, opts = {}) =>
  _transformSource(src.trim(), {
    plugins: [[plugin, opts]],
    ...opts
  })

test('handles dynamic `this` value inside of arrow function', async t => {
  const { code } = await transform(
    './fixtures/dynamic-this-value-in-arrow.js',
    {
      plugins: ['@babel/plugin-transform-arrow-functions', plugin]
    }
  )
  t.snapshot(code)
})

test('works with stateless', async t => {
  const { code } = await transform('./fixtures/stateless.js')
  t.snapshot(code)
})

test('works with fragment', async t => {
  const { code } = await transform('./fixtures/fragment.js')
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
    plugins: [[plugin, { sourceMaps: true }]]
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

test('works with dynamic element', async t => {
  const { code } = await transform('./fixtures/dynamic-element.js')
  t.snapshot(code)
})

test('works with dynamic element in class', async t => {
  const { code } = await transform('./fixtures/dynamic-element-class.js')
  t.snapshot(code)
})

test('works with existing identifier for _JSXStyle', async t => {
  const { code } = await transform('./fixtures/conflicts.js')
  t.snapshot(code)
})

test('does not transpile nested style tags', async t => {
  const { message } = await t.throwsAsync(() =>
    transform('./fixtures/nested-style-tags.js')
  )
  t.regex(message, /detected nested style tag/i)
})

test('works with exported jsx-style (CommonJS modules)', async t => {
  const { code } = await transformSource(
    'module.exports = () => <p><style jsx>{`p { color:red; }`}</style></p>',
    {
      plugins: [plugin, '@babel/plugin-transform-modules-commonjs']
    }
  )
  t.snapshot(code)
})

test('works with exported non-jsx style (CommonJS modules)', async t => {
  const { code } = await transformSource(
    'module.exports = () => <p><style>{`p { color:red; }`}</style></p>',
    {
      plugins: [plugin, '@babel/plugin-transform-modules-commonjs']
    }
  )
  t.snapshot(code)
})

test('sever rendering with hook api', t => {
  const registry = createStyleRegistry()
  function Head() {
    const registry = useStyleRegistry()
    const styles = registry.styles()
    registry.flush()
    // should be empty and `push` won't effect styles
    const stylesAfterFlushed = registry.styles()
    styles.push(...stylesAfterFlushed)
    return React.createElement('head', null, styles)
  }

  function App() {
    const color = 'green'
    return React.createElement(
      'div',
      null,
      React.createElement(Head),
      React.createElement(JSXStyle, { id: 2 }, 'div { color: blue }'),
      React.createElement(JSXStyle, { id: 3 }, `div { color: ${color} }`)
    )
  }

  // Expected DOM string
  const styles =
    '<style id="__jsx-2">div { color: blue }</style>' +
    '<style id="__jsx-3">div { color: green }</style>'

  const expected = `<head>${styles}</head>`

  const createContextualApp = type =>
    React.createElement(StyleRegistry, { registry }, React.createElement(type))

  // Render using react
  ReactDOM.renderToString(createContextualApp(App))
  const html = ReactDOM.renderToStaticMarkup(createContextualApp(Head))
  t.is(html, expected)
})

test('server rendering', t => {
  function App() {
    const color = 'green'
    return React.createElement(
      'div',
      null,
      React.createElement(
        JSXStyle,
        {
          id: 1
        },
        'p { color: red }'
      ),
      React.createElement(
        JSXStyle,
        {
          id: 2
        },
        'div { color: blue }'
      ),
      React.createElement(
        JSXStyle,
        {
          id: 3
        },
        `div { color: ${color} }`
      )
    )
  }

  // Expected CSS
  const expected =
    '<style id="__jsx-1">p { color: red }</style>' +
    '<style id="__jsx-2">div { color: blue }</style>' +
    '<style id="__jsx-3">div { color: green }</style>'

  const registry = createStyleRegistry()
  const createApp = () =>
    React.createElement(StyleRegistry, { registry }, React.createElement(App))

  // Render using react
  ReactDOM.renderToString(createApp())
  const html = ReactDOM.renderToStaticMarkup(
    React.createElement('head', null, flushToReact(registry))
  )

  t.is(html, `<head>${expected}</head>`)

  // Assert that memory is empty
  t.is(0, registry.cssRules().length)
  t.is('', flushToHTML(registry))

  // Render to html again
  ReactDOM.renderToString(createApp())
  t.is(expected, flushToHTML(registry))

  // Assert that memory is empty
  t.is(0, flushToReact(registry).length)
  t.is('', flushToHTML(registry))
})

test('server rendering with nonce', t => {
  function App() {
    const color = 'green'
    return React.createElement(
      'div',
      null,
      React.createElement(
        JSXStyle,
        {
          id: 1
        },
        'p { color: red }'
      ),
      React.createElement(
        JSXStyle,
        {
          id: 2
        },
        'div { color: blue }'
      ),
      React.createElement(
        JSXStyle,
        {
          id: 3
        },
        `div { color: ${color} }`
      )
    )
  }

  const registry = createStyleRegistry()
  const createApp = () =>
    React.createElement(StyleRegistry, { registry }, React.createElement(App))

  // Expected CSS
  const expected =
    '<style id="__jsx-1" nonce="test-nonce">p { color: red }</style>' +
    '<style id="__jsx-2" nonce="test-nonce">div { color: blue }</style>' +
    '<style id="__jsx-3" nonce="test-nonce">div { color: green }</style>'

  // Render using react
  ReactDOM.renderToString(createApp())
  const html = ReactDOM.renderToStaticMarkup(
    React.createElement(
      'head',
      null,
      flushToReact(registry, { nonce: 'test-nonce' })
    )
  )

  t.is(html, `<head>${expected}</head>`)

  // Assert that memory is empty
  t.is(0, flushToReact(registry, { nonce: 'test-nonce' }).length)
  t.is('', flushToHTML(registry, { nonce: 'test-nonce' }))

  // Render to html again
  ReactDOM.renderToString(createApp())
  t.is(expected, flushToHTML(registry, { nonce: 'test-nonce' }))

  // Assert that memory is empty
  t.is(0, flushToReact(registry, { nonce: 'test-nonce' }).length)
  t.is('', flushToHTML(registry, { nonce: 'test-nonce' }))
})

test('optimized styles do not contain new lines', t => {
  function App() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        JSXStyle,
        {
          id: 1
        },
        ['p { color: red }', '.foo { color: hotpink }']
      )
    )
  }

  const registry = createStyleRegistry()
  const createApp = () =>
    React.createElement(StyleRegistry, { registry }, React.createElement(App))

  ReactDOM.renderToString(createApp())
  const html = ReactDOM.renderToStaticMarkup(
    React.createElement('head', null, flushToReact(registry))
  )
  const expected =
    '<style id="__jsx-1">p { color: red }.foo { color: hotpink }</style>'

  t.is(html, `<head>${expected}</head>`)
})
