const stylis = require('stylis')

// matches :global($1) capturing $1
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
const regExpReplace = /^[^ \t]*?\[.*?\]|[^ \n\r\t\+\~\>]+|.+\]/g

let indexOf = 0
let prefix = ''

function replace (match) {
  // :hover etc...
  if ((indexOf = match.indexOf(':')) !== -1) {
    // tries to matche `g` character in :global()
    if (match.charCodeAt(indexOf + 1) === 103) {
      return match.replace(regExpGlobal, '$1').trim()
    } else {
      return match.substring(0, indexOf) + prefix + match.substring(indexOf)
    }
  } else {
    return match + prefix
  }
}

function middleware (ctx, str, line, col) {
  if (ctx !== 1.5) {
    return
  }

  // stylis does not prefix `:global()`
  if (str.indexOf(prefix) === 0 && str.indexOf(' ') !== -1) {
    // remove prefix
    str = str.substring(prefix.length).trim()

    // single selector
    if (str.indexOf(' ') !== -1) {
      return str.replace(regExpReplace, replace);
    } else {
      if ((indexOf = str.indexOf(':')) !== -1) {
        return str.substring(0, indexOf) + prefix + str.substring(indexOf);
      } else {
        return str + prefix;
      }
    }
  }
}

module.exports = function (id, styles) {
  prefix = `[data-jsx="${id}"]`

  return stylis(prefix, styles, true, false, middleware)
}