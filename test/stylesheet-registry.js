// Packages
import test from 'ava'

// Ours
import { StyleSheetRegistry } from '../src/stylesheet-registry'
import makeSheet, { invalidRules } from './stylesheet'
import withMock, { withMockDocument } from './helpers/with-mock'
import { computeId, computeSelector } from '../src/lib/hash'

function makeRegistry(options = { optimizeForSpeed: true }) {
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

test(
  'add',
  withMock(withMockDocument, t => {
    const options = [
      { optimizeForSpeed: true, isBrowser: true },
      { optimizeForSpeed: false, isBrowser: true },
      { optimizeForSpeed: true, isBrowser: false },
      { optimizeForSpeed: false, isBrowser: false }
    ]

    options.forEach(options => {
      if (options.isBrowser) {
        globalThis.window = globalThis
      }

      const registry = makeRegistry(options)

      registry.add({
        id: '123',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      t.deepEqual(registry.cssRules(), [['jsx-123', cssRule]])

      // Dedupe

      registry.add({
        id: '123',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      t.deepEqual(registry.cssRules(), [['jsx-123', cssRule]])

      registry.add({
        id: '345',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      t.deepEqual(registry.cssRules(), [
        ['jsx-123', cssRule],
        ['jsx-345', cssRule]
      ])

      if (options.optimizeForSpeed) {
        registry.add({ id: '456', children: [cssRule, cssRuleAlt] })

        t.deepEqual(registry.cssRules(), [
          ['jsx-123', cssRule],
          ['jsx-345', cssRule],
          ['jsx-456', 'div { color: red }p { color: red }']
        ])
      }

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

test(
  'add - filters out invalid rules (index `-1`)',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const registry = makeRegistry()

    // Insert a valid rule
    registry.add({ id: '123', children: [cssRule] })

    // Insert an invalid rule
    registry.add({ id: '456', children: [invalidRules[0]] })

    // Insert another valid rule
    registry.add({ id: '678', children: [cssRule] })

    t.deepEqual(registry.cssRules(), [
      ['jsx-123', 'div { color: red }'],
      ['jsx-678', 'div { color: red }']
    ])

    delete globalThis.window
  })
)

test(
  'it does not throw when inserting an invalid rule',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const registry = makeRegistry()

    // Insert a valid rule
    registry.add({ id: '123', children: [cssRule] })

    t.notThrows(() => {
      // Insert an invalid rule
      registry.add({ id: '456', children: [invalidRules[0]] })
    })

    t.deepEqual(registry.cssRules(), [['jsx-123', 'div { color: red }']])

    delete globalThis.window
  })
)

test('add - sanitizes dynamic CSS on the server', t => {
  const registry = makeRegistry({ optimizeForSpeed: false })

  registry.add({
    id: '123',
    children: [
      'div.__jsx-style-dynamic-selector { color: red</style><script>alert("howdy")</script> }'
    ],
    dynamic: ['red</style><script>alert("howdy")</script>']
  })

  t.deepEqual(registry.cssRules(), [
    [
      'jsx-1871671996',
      'div.jsx-1871671996 { color: red<\\/style><script>alert("howdy")</script> }'
    ]
  ])
})

test('add - nonce is properly fetched from meta tag', t => {
  const originalDocument = globalThis.document
  // We need to stub a document in order to simulate the meta tag
  globalThis.document = {
    querySelector(query) {
      t.is(query, 'meta[property="csp-nonce"]')
      return {
        getAttribute(attr) {
          t.is(attr, 'content')
          return 'test-nonce'
        }
      }
    }
  }

  globalThis.window = globalThis

  const registry = makeRegistry()
  registry.add({ id: '123', children: [cssRule] })

  t.is(registry._sheet._nonce, 'test-nonce')

  globalThis.document = originalDocument

  delete globalThis.window
})

// registry.remove

test(
  'remove',
  withMock(withMockDocument, t => {
    const options = [
      { optimizeForSpeed: true, isBrowser: true },
      { optimizeForSpeed: false, isBrowser: true },
      { optimizeForSpeed: true, isBrowser: false },
      { optimizeForSpeed: false, isBrowser: false }
    ]

    options.forEach(options => {
      if (options.isBrowser) {
        globalThis.window = globalThis
      }

      const registry = makeRegistry(options)
      registry.add({
        id: '123',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      registry.add({
        id: '345',
        children: options.optimizeForSpeed ? [cssRuleAlt] : cssRuleAlt
      })

      registry.remove({ id: '123' })
      t.deepEqual(registry.cssRules(), [['jsx-345', cssRuleAlt]])

      // Add a duplicate
      registry.add({
        id: '345',
        children: options.optimizeForSpeed ? [cssRuleAlt] : cssRuleAlt
      })
      // and remove it
      registry.remove({ id: '345' })
      // Still in the registry
      t.deepEqual(registry.cssRules(), [['jsx-345', cssRuleAlt]])
      // remove again
      registry.remove({ id: '345' })
      // now the registry should be empty
      t.deepEqual(registry.cssRules(), [])

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

// registry.update

test(
  'update',
  withMock(withMockDocument, t => {
    const options = [
      { optimizeForSpeed: true, isBrowser: true },
      { optimizeForSpeed: false, isBrowser: true },
      { optimizeForSpeed: true, isBrowser: false },
      { optimizeForSpeed: false, isBrowser: false }
    ]

    options.forEach(options => {
      if (options.isBrowser) {
        globalThis.window = globalThis
      }

      const registry = makeRegistry(options)
      registry.add({
        id: '123',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      registry.add({
        id: '123',
        children: options.optimizeForSpeed ? [cssRule] : cssRule
      })

      registry.update(
        { id: '123' },
        {
          id: '345',
          children: options.optimizeForSpeed ? [cssRuleAlt] : cssRuleAlt
        }
      )
      // Doesn't remove when there are multiple instances of 123
      t.deepEqual(registry.cssRules(), [
        ['jsx-123', cssRule],
        ['jsx-345', cssRuleAlt]
      ])

      registry.remove({ id: '345' })
      t.deepEqual(registry.cssRules(), [['jsx-123', cssRule]])

      // Update again
      registry.update(
        { id: '123' },
        {
          id: '345',
          children: options.optimizeForSpeed ? [cssRuleAlt] : cssRuleAlt
        }
      )
      // 123 replaced with 345
      t.deepEqual(registry.cssRules(), [['jsx-345', cssRuleAlt]])

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

// createComputeId

test(
  'createComputeId',
  withMock(withMockDocument, t => {
    // without props
    t.is(computeId('123'), 'jsx-123')

    // with props
    t.is(computeId('123', ['test', 3, 'test']), 'jsx-1172888331')
  })
)

// createComputeSelector

test(
  'createComputeSelector',
  withMock(withMockDocument, t => {
    t.is(
      computeSelector(
        'jsx-123',
        '.test {} .__jsx-style-dynamic-selector { color: red } .__jsx-style-dynamic-selector { color: red }'
      ),
      '.test {} .jsx-123 { color: red } .jsx-123 { color: red }'
    )
  })
)

// getIdAndRules

test(
  'getIdAndRules',
  withMock(withMockDocument, t => {
    const utilRegistry = makeRegistry()
    // simple
    t.deepEqual(
      utilRegistry.getIdAndRules({
        id: '123',
        children: '.test {} .jsx-123 { color: red } .jsx-123 { color: red }'
      }),
      {
        styleId: 'jsx-123',
        rules: ['.test {} .jsx-123 { color: red } .jsx-123 { color: red }']
      }
    )

    // dynamic
    t.deepEqual(
      utilRegistry.getIdAndRules({
        id: '123',
        children:
          '.test {} .__jsx-style-dynamic-selector { color: red } .__jsx-style-dynamic-selector { color: red }',
        dynamic: ['test', 3, 'test']
      }),
      {
        styleId: 'jsx-1172888331',
        rules: [
          '.test {} .jsx-1172888331 { color: red } .jsx-1172888331 { color: red }'
        ]
      }
    )

    // dynamic, css array
    t.deepEqual(
      utilRegistry.getIdAndRules({
        id: '123',
        children: [
          '.test {}',
          '.__jsx-style-dynamic-selector { color: red }',
          '.__jsx-style-dynamic-selector { color: red }'
        ],
        dynamic: ['test', 3, 'test']
      }),
      {
        styleId: 'jsx-1172888331',
        rules: [
          '.test {}',
          '.jsx-1172888331 { color: red }',
          '.jsx-1172888331 { color: red }'
        ]
      }
    )
  })
)
