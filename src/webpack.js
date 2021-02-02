const loaderUtils = require('loader-utils')

const types = ['scoped', 'global', 'resolve']

module.exports = function(content) {
  if (this.cacheable) this.cacheable()
  this.addDependency(this.resourcePath)
  const options = Object.assign({}, loaderUtils.getOptions(this))

  if (!options.type) {
    options.type = 'scoped'
  }

  // Calls type with the current file name.
  if (typeof options.type === 'function') {
    options.type = options.type(this.resourcePath, {
      query: loaderUtils.parseQuery(this.resourceQuery || '?') || {}
    })
  }

  if (!types.includes(options.type)) {
    return this.callback(
      'The given `type` option is invalid. \n\n' +
        `Expected:\n One of scoped|global|resolve \n\n` +
        'Actual:\n ' +
        options.type
    )
  }

  // Allows to define the type for each individual file using a CSS comment.
  const commentType = content.match(/\/*\s*@styled-jsx=(scoped|global|resolve)/)
  if (commentType) {
    options.type = commentType[1]
  }

  let output = `import css from 'styled-jsx/css';\n\nconst styles = css`

  if (options.type === 'global') {
    // css.global``
    output += '.global'
  } else if (options.type === 'resolve') {
    // css.resolve``
    output += '.resolve'
  }
  // default css``

  // Escape backticks and backslashes: “`” ⇒ “\`”, “\” ⇒ “\\”
  // (c) https://git.io/fNZzr
  output += `\`${content.replace(
    /[`\\]/g,
    match => '\\' + match
  )}\`;\n\nexport default styles;`

  this.callback(null, output)
}
