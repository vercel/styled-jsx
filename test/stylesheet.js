// Packages
import test from 'ava'

// Ours
import StyleSheet from '../src/lib/stylesheet'

function makeSheet(options = { optimizeForSpeed: true, isBrowser: true }) {
  const sheet = new StyleSheet(options)
  // mocks
  sheet.makeStyleTag = function(name, cssString) {
    const cssRules = cssString ? [{ cssText: cssString }] : []
    return {
      sheet: {
        cssRules,
        insertRule: (rule, index) => {
          if (typeof index === 'number') {
            cssRules[index] = { cssText: rule }
          } else {
            cssRules.push({ cssText: rule })
          }
          return index
        },
        deleteRule: index => {
          cssRules.splice(index, 1)
        },
        replaceRule: (index, rule) => {
          cssRules[index] = { cssText: rule }
        }
      },
      textContent: cssString,
      parentNode: {
        removeChild: () => {}
      }
    }
  }
  return sheet
}

// sheet.setOptimizeForSpeed

test('can change optimizeForSpeed only when the stylesheet is empty', t => {
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
})

// sheet.insertRule

test('insertRule', t => {
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
    }
  ]

  options.forEach(options => {
    const sheet = makeSheet(options)
    sheet.inject()

    sheet.insertRule('div { color: red }')
    t.deepEqual(sheet.cssRules(), [{ cssText: 'div { color: red }' }])

    sheet.insertRule('div { color: green }')
    t.deepEqual(sheet.cssRules(), [
      { cssText: 'div { color: red }' },
      { cssText: 'div { color: green }' }
    ])
  })
})

test('insertRule - returns the rule index', t => {
  const sheet = makeSheet()
  sheet.inject()

  let i = sheet.insertRule('div { color: red }')
  t.is(i, 0)

  i = sheet.insertRule('div { color: red }')
  t.is(i, 1)
})

// sheet.deleteRule

test('deleteRule', t => {
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
    }
  ]

  options.forEach(options => {
    const sheet = makeSheet(options)
    sheet.inject()

    sheet.insertRule('div { color: red }')
    sheet.insertRule('div { color: green }')
    sheet.deleteRule(1)

    t.deepEqual(
      sheet.cssRules(),
      options.optimizeForSpeed
        ? [
            { cssText: 'div { color: red }' },
            { cssText: '#stylesheet-empty-rule____{}' }
          ]
        : [{ cssText: 'div { color: red }' }]
    )

    // t.deepEqual(sheet.cssRules(), [{ cssText: 'div { color: red }' }, { cssText: 'div { color: green }' }])
  })
})
