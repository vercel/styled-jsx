// Packages
import test from 'ava'

// Ours
import StyleSheet from '../src/lib/stylesheet'
import withMock, { withMockDocument } from './helpers/with-mock'

export const invalidRules = ['invalid rule']

export default function makeSheet(options = { optimizeForSpeed: true }) {
  const sheet = new StyleSheet(options)
  // mocks
  sheet.makeStyleTag = function(name, cssString) {
    const cssRules = cssString ? [{ cssText: cssString }] : []
    const tag = {
      sheet: {
        cssRules,
        insertRule: (rule, index) => {
          if (invalidRules.includes(rule)) {
            throw new Error('invalid rule')
          }

          if (typeof index === 'number') {
            cssRules[index] = { cssText: rule }
          } else {
            cssRules.push({ cssText: rule })
          }

          return index
        },
        deleteRule: index => {
          if (options.optimizeForSpeed) {
            cssRules[index] = {
              cssText: `#${name}-deleted-rule____{}`
            }
          } else {
            cssRules[index] = null
          }
        },
        replaceRule: (index, rule) => {
          cssRules[index] = { cssText: rule }
        }
      },
      parentNode: {
        removeChild: () => {}
      }
    }

    let textContent = cssString
    Object.defineProperty(tag, 'textContent', {
      get: () => textContent,
      set: text => {
        textContent = text
        cssRules.length = 0
        cssRules.push({ cssText: text })
      }
    })

    return tag
  }

  return sheet
}

// sheet.setOptimizeForSpeed

test(
  'can change optimizeForSpeed only when the stylesheet is empty',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()

    sheet.inject()
    t.notThrows(() => {
      sheet.setOptimizeForSpeed(true)
    })

    sheet.insertRule('div { color: red }')
    t.throws(() => {
      sheet.setOptimizeForSpeed(false)
    })

    sheet.flush()
    t.notThrows(() => {
      sheet.setOptimizeForSpeed(false)
    })

    delete globalThis.window
  })
)

// sheet.insertRule

test(
  'insertRule',
  withMock(withMockDocument, t => {
    const options = [
      { optimizeForSpeed: true, isBrowser: true },
      { optimizeForSpeed: false, isBrowser: true },
      { optimizeForSpeed: true, isBrowser: false }
    ]

    options.forEach(options => {
      if (options.isBrowser) {
        globalThis.window = globalThis
      }

      const sheet = makeSheet(options)
      sheet.inject()

      sheet.insertRule('div { color: red }')
      t.deepEqual(sheet.cssRules(), [{ cssText: 'div { color: red }' }])

      sheet.insertRule('div { color: green }')
      t.deepEqual(sheet.cssRules(), [
        { cssText: 'div { color: red }' },
        { cssText: 'div { color: green }' }
      ])

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

test(
  'insertRule - returns the rule index',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()
    sheet.inject()

    let i = sheet.insertRule('div { color: red }')
    t.is(i, 0)

    i = sheet.insertRule('div { color: red }')
    t.is(i, 1)

    delete globalThis.window
  })
)

test(
  'insertRule - handles invalid rules and returns -1 as index',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()
    sheet.inject()

    const i = sheet.insertRule(invalidRules[0])
    t.is(i, -1)

    delete globalThis.window
  })
)

test(
  'insertRule - does not fail when the css is a String object',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()
    sheet.inject()

    /* eslint-disable unicorn/new-for-builtins,no-new-wrappers */

    sheet.insertRule(new String('div { color: red }'))
    t.deepEqual(sheet.cssRules(), [
      { cssText: new String('div { color: red }') }
    ])

    delete globalThis.window
    /* eslint-enable */
  })
)

// sheet.deleteRule

test(
  'deleteRule',
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

      const sheet = makeSheet(options)
      sheet.inject()

      sheet.insertRule('div { color: red }')
      sheet.insertRule('div { color: green }')
      const rulesCount = sheet.length

      sheet.deleteRule(1)
      // When deleting we replace rules with placeholders to keep the indices stable.
      t.is(sheet.length, rulesCount)

      t.deepEqual(sheet.cssRules(), [{ cssText: 'div { color: red }' }, null])

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

test(
  'deleteRule - does not throw when the rule at index does not exist',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()
    sheet.inject()

    t.notThrows(() => {
      sheet.deleteRule(sheet.length + 1)
    })

    delete globalThis.window
  })
)

// sheet.replaceRule

test(
  'replaceRule',
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

      const sheet = makeSheet(options)
      sheet.inject()

      const index = sheet.insertRule('div { color: red }')
      sheet.replaceRule(index, 'p { color: hotpink }')

      t.deepEqual(sheet.cssRules(), [{ cssText: 'p { color: hotpink }' }])

      if (options.isBrowser) {
        delete globalThis.window
      }
    })
  })
)

test(
  'replaceRule - handles invalid rules gracefully',
  withMock(withMockDocument, t => {
    globalThis.window = globalThis

    const sheet = makeSheet()
    sheet.inject()

    // Insert two rules
    sheet.insertRule('div { color: red }')
    const index = sheet.insertRule('div { color: red }')

    // Replace the latter with an invalid rule
    const i = sheet.replaceRule(index, invalidRules[0])
    t.is(i, index)
    t.is(sheet.length, 2)

    // Even though replacement (insertion) failed deletion succeeded
    // therefore the lib must insert a delete placeholder which resolves to `null`
    // when `cssRules()` is called.
    t.deepEqual(sheet.cssRules(), [{ cssText: 'div { color: red }' }, null])

    delete globalThis.window
  })
)
