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

let splitRules = false
let rules = []

function splitRulesPlugin(context, block, selectors) {
  if (splitRules) {
    switch (context) {
      // executed whenever a block of css is done compiling.
      case 2: case 3: {
        rules.push(`${selectors.join(',')} { ${block} }`)
      }
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
  splitRules = settings.splitRules

  rules = []
  const cssString = stylis(prefix, styles)

  if (splitRules) {
    return rules
  }
  return cssString
}

module.exports = transform
