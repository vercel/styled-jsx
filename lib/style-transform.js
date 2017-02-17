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

let generator
let start
let filename

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
  // post-processed
  if (context === 6 && generator !== null) {
    generator = null,
    start = null,
    filename = null

    return
  }

  if (context === 0 && generator !== null) {
    // TODO: init source maps generator
    return
  }

  if ((context === 1 || context === 2) && generator !== null) {
    // TODO: update source maps generator
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
 * @param  {Object=} _generator
 * @param  {Object=} _start
 * @param  {string=} _filename
 * @return {string}
 */
function transform (id, styles, _generator, _start, _filename) {
  prefix = `[data-jsx="${id}"]`

  generator = _generator,
  start = _start,
  filename = _filename

  return stylis(prefix, styles, true, false, middleware)
}

module.exports = transform
