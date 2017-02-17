const stylis = require('stylis')

/**
 * @type {RegExp}
 *
 * matches :global($1) capturing $1
 */
const regExpGlobal = /:global\((.*)\)/g

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
    return match.replace(regExpGlobal, '$1').trim()
  } 

  return match.substring(0, indexOf) + prefix + match.substring(indexOf)
}

/**
 * middleware
 * 
 * @param  {number} context
 * @param  {string} content
 * @param  {number} line
 * @param  {number} column
 * @return {string|undefined}
 */
function middleware (context, content, line, column) {
  // selector 
  if (context !== 1.5) {
    return
  }

  // stylis does not prefix `:global()`
  if (content.indexOf(prefix) !== 0 || content.indexOf(' ') === -1) {
    return;
  }

  // remove prefix
  content = content.substring(prefix.length).trim()

  // multiple selectors
  if (content.indexOf(' ') !== -1) {
    return content.replace(regExpReplacePrefix, replacePrefix);
  } 

  // single non-pseudo selector h1 -> h1[prefix]
  if ((indexOf = content.indexOf(':')) === -1) {
    return content + prefix;
  }

  // single pseudo selector h1:hover ->  h1[prefix]:hover
  return content.substring(0, indexOf) + prefix + content.substring(indexOf);
}

/**
 * exports
 * @param  {number|string} id
 * @param  {string} styles
 * @return {string}
 */
module.exports = function (id, styles) {
  prefix = `[data-jsx="${id}"]`

  return stylis(prefix, styles, true, false, middleware)
}
