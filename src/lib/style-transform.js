const Stylis = require('stylis')

const stylis = new Stylis()

function disableNestingPlugin(...args) {
  let [context, , , parent = [], line, column] = args
  if (context === 2) {
    parent = parent[0]
    if (
      typeof parent === 'string' &&
      parent.trim().length > 0 &&
      parent.charAt(0) !== '@'
    ) {
      throw new Error(
        `Nesting detected at ${line}:${column}. ` +
          'Unfortunately nesting is not supported by styled-jsx.'
      )
    }
  }
}

let generator
let filename
let offset

function sourceMapsPlugin(...args) {
  const [context, , , , line, column, length] = args

  // Pre-processed, init source map
  if (context === -1 && generator !== undefined) {
    generator.addMapping({
      generated: {
        line: 1,
        column: 0
      },
      source: filename,
      original: offset
    })

    return
  }

  // Post-processed
  if (context === -2 && generator !== undefined) {
    generator = undefined
    offset = undefined
    filename = undefined

    return
  }

  // Selector/property, update source map
  if ((context === 1 || context === 2) && generator !== undefined) {
    generator.addMapping({
      generated: {
        line: 1,
        column: length
      },
      source: filename,
      original: {
        line: line + offset.line,
        column: column + offset.column
      }
    })
  }
}

/**
 * splitRulesPlugin
 * Used to split a blob of css into an array of rules
 * that can inserted via sheet.insertRule
 *
 * courtesy of and (c) the emotion folks (with some fixes from us)
 * https://github.com/emotion-js/emotion/blob/994ea265cf5a411c5fa9b606dd140ce66776d1db/packages/emotion/src/index.js#L23-L60
 */
let isSplitRulesEnabled = false
let splitRules = []
let splitRulesQueue = []
const nestedAtRules = ['m', 's', 'd', 'k', '-']

function splitRulesPlugin(
  context,
  content,
  selectors,
  parent,
  line,
  column,
  length,
  id
) {
  if (context === -2) {
    splitRules = splitRules.concat(splitRulesQueue)
    splitRulesQueue = []
    return
  }

  if (context === 1) {
    if (content.charAt(0) === '@') {
      splitRulesQueue.push(content)
      return ''
    }
  }

  if (context === 2) {
    if (id === 0) {
      const joinedSelectors = selectors.join(',')
      const rule = `${joinedSelectors}{${content}}`
      if (parent.join(',') === joinedSelectors || parent[0] === '') {
        splitRulesQueue.push(rule)
      } else {
        splitRulesQueue.unshift(rule)
      }
    }
    return
  }

  // after an at rule block
  if (context === 3) {
    const selectrs = selectors.join(',')
    if (nestedAtRules.indexOf(selectrs.charAt(1)) === -1) {
      splitRulesQueue.push(`${selectrs}${content}`)
    } else {
      if (selectrs.charAt(1) === 'k') {
        splitRulesQueue.push(`@-webkit-${selectrs.slice(1)}{${content}}`)
      }
      splitRulesQueue.push(`${selectrs}{${content}}`)
    }
  }
}

stylis.use(disableNestingPlugin)
stylis.use(sourceMapsPlugin)
stylis.use(splitRulesPlugin)
stylis.set({
  cascade: false,
  compress: true
})

/**
 * Public transform function
 *
 * @param {String} prefix
 * @param {String} styles
 * @param {Object} settings
 * @return {string}
 */
function transform(prefix, styles, settings = {}) {
  generator = settings.generator
  offset = settings.offset
  filename = settings.filename
  isSplitRulesEnabled = settings.splitRules
  splitRules = []

  const cssString = stylis(prefix, styles)

  if (isSplitRulesEnabled) {
    return splitRules
  }
  return cssString
}

module.exports = transform
