// Packages
import test from 'ava'

// Ours
import StyleSheetRegistry from '../src/stylesheet-registry'
import makeSheet from './stylesheet'

function makeRegistry(options) {
  const registry = new StyleSheetRegistry({
    styleSheet: makeSheet(options),
    ...options
  })
  registry.selectFromServer = () => ({})
  return registry
}

const cssRule = 'div { color: red }'
const cssRuleAlt = 'p { color: red }'

// registry.add

test('add', t => {
  const options = [
    {
      optimizeForSpeed: true,
      isBrowser: true
    },
    {
      optimizeForSpeed: false,
      isBrowser: true
    },
    {
      optimizeForSpeed: true,
      isBrowser: false
    },
    {
      optimizeForSpeed: false,
      isBrowser: false
    }
  ]

  options.forEach(options => {
    const registry = makeRegistry(options)
    registry.add({
      styleId: '123',
      css: options.optimizeForSpeed ? [cssRule] : cssRule
    })

    t.deepEqual(registry.cssRules(), [['jsx-123', cssRule]])

    // Dedupe

    registry.add({
      styleId: '123',
      css: options.optimizeForSpeed ? [cssRule] : cssRule
    })

    t.deepEqual(registry.cssRules(), [['jsx-123', cssRule]])

    registry.add({
      styleId: '345',
      css: options.optimizeForSpeed ? [cssRule] : cssRule
    })

    t.deepEqual(registry.cssRules(), [
      ['jsx-123', cssRule],
      ['jsx-345', cssRule]
    ])

    if (options.optimizeForSpeed) {
      registry.add({
        styleId: '456',
        css: [cssRule, cssRuleAlt]
      })

      t.deepEqual(registry.cssRules(), [
        ['jsx-123', cssRule],
        ['jsx-345', cssRule],
        ['jsx-456', 'div { color: red }\np { color: red }']
      ])
    }
  })
})
