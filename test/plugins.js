// Packages
import test from 'ava'

// Ours
import babelPlugin from '../src/babel'
import babelTestPlugin from '../src/babel-test'
import { combinePlugins } from '../src/_utils'
import _transform from './_transform'
import testPlugin1 from './fixtures/plugins/plugin'
import testPlugin2 from './fixtures/plugins/another-plugin'

const transform = (file, opts = {}) =>
  _transform(file, {
    plugins: [
      [
        babelPlugin,
        { plugins: [require.resolve('./fixtures/plugins/another-plugin')] }
      ]
    ],
    ...opts
  })

test('combinePlugins returns an identity function when plugins is undefined', t => {
  const test = 'test'
  const plugins = combinePlugins()
  t.is(plugins(test), test)
})

test('combinePlugins throws if plugins is not an array', t => {
  t.throws(() => {
    combinePlugins(2)
  })
})

test('combinePlugins throws if plugins is not an array of strings', t => {
  t.throws(() => {
    combinePlugins(['test', 2])
  })
})

test('combinePlugins throws if loaded plugins are not functions', t => {
  t.throws(() => {
    combinePlugins([
      require.resolve('./fixtures/plugins/plugin'),
      require.resolve('./fixtures/plugins/invalid-plugin')
    ])
  })
})

test('combinePlugins works with a single plugin', t => {
  const plugins = combinePlugins([require.resolve('./fixtures/plugins/plugin')])

  t.is(testPlugin1('test'), plugins('test'))
})

test('combinePlugins works with options', t => {
  const expectedOption = 'my-test'
  const plugins = combinePlugins([
    [
      require.resolve('./fixtures/plugins/options'),
      {
        test: expectedOption
      }
    ]
  ])
  t.is(plugins(''), expectedOption)
})

test('combinePlugins applies plugins left to right', t => {
  const plugins = combinePlugins([
    require.resolve('./fixtures/plugins/plugin'),
    require.resolve('./fixtures/plugins/another-plugin')
  ])

  t.is(testPlugin2(testPlugin1('test')), plugins('test'))
})

test('applies plugins', async t => {
  const { code } = await transform('./fixtures/with-plugins.js')
  t.snapshot(code)
})

test('babel-test plugin strips jsx attribute', async t => {
  const { code } = await transform('./fixtures/with-plugins.js', {
    plugins: [babelTestPlugin]
  })

  t.snapshot(code)
})

test('passes options to plugins', async t => {
  const { code } = await transform('./fixtures/with-plugins.js', {
    plugins: [
      [
        babelPlugin,
        {
          plugins: [
            [require.resolve('./fixtures/plugins/options'), { foo: true }],
            require.resolve('./fixtures/plugins/multiple-options'),
            [
              require.resolve('./fixtures/plugins/multiple-options'),
              { foo: false }
            ]
          ],
          vendorPrefixes: false
        }
      ]
    ]
  })
  t.snapshot(code)
})

test('combinePlugins throws if passing an option called `babel`', t => {
  t.throws(() => {
    combinePlugins([['test', { babel: true }]])
  })
})

test('combinePlugins memoizes calls', t => {
  const v1 = combinePlugins([require.resolve('./fixtures/plugins/plugin')])
  const v2 = combinePlugins([require.resolve('./fixtures/plugins/plugin')])

  t.is(v1('test div'), v2('test div'))

  const v3 = combinePlugins([
    require.resolve('./fixtures/plugins/plugin'),
    require.resolve('./fixtures/plugins/another-plugin')
  ])

  t.not(v2('test div'), v3('test div'))
})
