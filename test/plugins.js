// Packages
import test from 'ava'

// Ours
import {combinePlugins} from '../src/_utils'
import testPlugin1 from './fixtures/plugins/plugin'
import testPlugin2 from './fixtures/plugins/another-plugin'

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
  const plugins = combinePlugins([
    require.resolve('./fixtures/plugins/plugin')
  ])

  t.is(testPlugin1('test'), plugins('test'))
})

test('combinePlugins applies plugins left to right', t => {
  const plugins = combinePlugins([
    require.resolve('./fixtures/plugins/plugin'),
    require.resolve('./fixtures/plugins/another-plugin')
  ])

  t.is(testPlugin2(testPlugin1('test')), plugins('test'))
})
