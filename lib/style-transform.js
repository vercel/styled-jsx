const stylis = require('stylis')

function middleware(ctx, str, line, col, prefix) {
  // ctx 1.5 is a selector
  if (ctx !== 1.5) {
    return
  }

  // Stylis adds the namespace at the beginning
  if (str.indexOf(prefix + ' ') !== 0) {
    return
  }

  // while want to append it to selectors.
  // Strip stylis' namespace.
  str = str.substring(prefix.length).trim();

  var i = 0
  var len = str.length - 1

  var chr
  var inSquareBrakets = 0
  var inParenthesis = 0

  var isGlobal = false
  var isPseudo = true
  var isCombinator = false
  var isSpace = false
  var isEnd = false

  var out = []
  var part = ''

  while (i <= len) {
    chr = str.charAt(i)
    isPseudo = chr === ':'
    isSpace = chr === ' '
    isEnd = i === len

    // TODO account for subselector
    if (chr === '[') {
      inSquareBrakets += 1
    }
    if (chr === ']') {
      inSquareBrakets -= 1
    }
    if (chr === '(') {
      inParenthesis += 1
    }
    if (chr === ')') {
      inParenthesis -= 1
    }

    // When we find a space or are at the end of the
    // selector we prefix (if necessary)
    // and push the sub string to the output array
    if (
      (
        isSpace ||
        isEnd
      ) &&
      !inSquareBrakets &&
      !inParenthesis
    ) {
      if (!isSpace) {
        part += chr
      }

      if (isGlobal) {
        out.push(part.slice(0, -1))
        isGlobal = false
      } else if (isCombinator) {
        out.push(part)
        isCombinator = false
      } else {
        out.push(part+prefix)
        isPseudo = false
      }

      part = ''
      i++
      continue
    }

    // combinator
    if (
      chr === '>' ||
      chr === '+' ||
      chr === '~'
    ) {
      isCombinator = true
      part += chr
      // >>> selector
      if (str.charAt(i + 1) === '>') {
        part += '>'
      }
      i++
      continue
    }

    // :global detection
    if (
      !isGlobal &&
      isPseudo
    ) {
      if (str.substr(i, 7) === ':global') {
        isGlobal = true
        i += 8
        inParenthesis += 1
        continue
      }
    }

    part += chr
    i++

    continue
  }

  return out.join(' ')
}

module.exports = function (id, styles) {
  const prefix = `[data-jsx="${id}"]`
  return stylis(prefix, styles, true, true, middleware)
}
