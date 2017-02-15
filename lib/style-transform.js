const stylis = require('stylis')

function middleware(ctx, str, line, col, prefix) {
if (ctx === 1.5) {
  // stylis does not prefix `:global()`
  if (str.indexOf(prefix) === 0 && str.indexOf(' ') !== -1) {
    // remove prefix
    str = str.substring(prefix.length).trim();

    var indexOf;

    // single selector
    if (str.indexOf(' ') !== -1) {
      return str.replace(/^[^ \t]*?\[.*?\]|[^ \n\r\t\+\~\>]+|.+\]/g, function (match) {
        // :hover etc...
        if ((indexOf = match.indexOf(':')) !== -1) {
          // :global()
          if (match.charCodeAt(indexOf+1) === 103) {
            return match.replace(/:global\((.*)\)/g, '$1').trim();
          }
          else {
            return match.substring(0, indexOf) + prefix + match.substring(indexOf);
          }
        }
        else {
          return match + prefix;
        }
      });
    }
    else {
      if ((indexOf = str.indexOf(':')) !== -1) {
        return str.substring(0, indexOf) + prefix + str.substring(indexOf);
      }
      else {
        return str + prefix;
      }
    }
  }
}
}

module.exports = function (id, styles) {
  const prefix = `[data-jsx="${id}"]`
  return stylis(prefix, styles, true, false, middleware)
}