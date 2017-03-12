const stylis = require('stylis')

/**
 * @type {RegExp}
 *
 * matches :global($1) capturing $1
 */
const regExpReplaceGlobal = /:global\((.*)\)/g

/**
 * @type {RegExp}
 *
 * matches selectors
 *
 * @example
 *
 *
 * `^[^ \t]*?\[.*?\]` matches
 *
 * - a[title="'w ' '  t'"]
 *
 * -------------
 *
 * `[^ s\+\~\>]+` matches
 *
 * - p a span
 * - p >> a
 *
 * -------------
 *
 * `.+\]` matches
 *
 * - [href="woot"]
 */
const regExpReplacePrefix = /^[^ \t]*?\[.*?\]|[^ \n\r\t\+\~\>]+|.+\]/g

let indexOf = 0
let prefix = ''
let filename = ''
let generator
let offset

/**
 * replace prefix
 *
 * @param  {string} match
 * @return {string}
 */
function replacePrefix (match) {
  // :hover etc...
  if ((indexOf = match.indexOf(':')) === -1) {
    return match + prefix
  }

  // tries to match `g` character in :global()
  if (match.charCodeAt(indexOf + 1) === 103) {
    return match.replace(regExpReplaceGlobal, '$1').trim()
  }

  // single pseudo selector h1:hover ->  h1[prefix]:hover
  return match.substring(0, indexOf) + prefix + match.substring(indexOf)
}

/**
 * middleware
 *
 * @param  {number} context
 * @param  {string} blob
 * @param  {number} line
 * @param  {number} column
 * @param  {string} prefix
 * @param  {number} length - current output length
 * @return {string|undefined}
 */
function middleware (context, blob, line, column, prefix, length) {
  // pre-processed, init source map
  if (context === 0 && generator !== void 0) {
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

  // post-processed
  if (context === 6 && generator !== void 0) {
    generator = void 0,
    offset = void 0,
    filename = void 0

    return
  }

  // selector/property, update source map
  if ((context === 1 || context === 2) && generator !== void 0) {
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

    return
  }

  // selector
  if (context !== 1.5) {
    return
  }

  // stylis does not prefix `:global()`
  if (blob.indexOf(prefix) !== 0 || blob.indexOf(' ') === -1) {
    return
  }

  // remove prefix
  blob = blob.substring(prefix.length).trim()

  // multiple selectors
  if (blob.indexOf(' ') !== -1) {
    return blob.replace(regExpReplacePrefix, replacePrefix);
  }

  // single non-pseudo selector h1 -> h1[prefix]
  if ((indexOf = blob.indexOf(':')) === -1) {
    return blob + prefix
  }

  // single pseudo selector h1:hover ->  h1[prefix]:hover
  return blob.substring(0, indexOf) + prefix + blob.substring(indexOf)
}

/**
 * transform
 *
 * @param  {number|string} id
 * @param  {string} styles
 * @param  {Object=} gen
 * @param  {Object=} start
 * @param  {string=} file
 * @return {string}
 */
function transform ({id, styles, gen, start, file, isExternal}) {
  prefix = `[data-jsx${isExternal ? '~' : ''}="${id}"]`
  filename = file
  generator = gen
  offset = start

  return stylis(prefix, styles, true, false, middleware)
}

module.exports = transform
