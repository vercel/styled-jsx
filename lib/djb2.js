// djb2 via https://github.com/darkskyapp/string-hash
// via csjs

module.exports = function(str) {
  let hash = 5381
  let i = str.length

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0
}
