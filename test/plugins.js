// Packages
import test from 'ava'

// Ours
import babelPlugin from '../src/babel'
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
