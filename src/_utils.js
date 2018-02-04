import * as t from 'babel-types'
import _hashString from 'string-hash'
import { SourceMapGenerator } from 'source-map'
import convert from 'convert-source-map'
import transform from './lib/style-transform'

import {
  STYLE_ATTRIBUTE,
  GLOBAL_ATTRIBUTE,
  STYLE_COMPONENT_ID,
  STYLE_COMPONENT,
  STYLE_COMPONENT_CSS,
  STYLE_COMPONENT_DYNAMIC
} from './_constants'

const concat = (a, b) => t.binaryExpression('+', a, b)
const and = (a, b) => t.logicalExpression('&&', a, b)
const or = (a, b) => t.logicalExpression('||', a, b)

const joinSpreads = spreads => spreads.reduce((acc, curr) => or(acc, curr))

export const hashString = str => String(_hashString(str))

export const addClassName = (path, jsxId) => {
  const jsxIdWithSpace = concat(jsxId, t.stringLiteral(' '))
  const attributes = path.get('attributes')
  const spreads = []
  let className = null
  // Find className and collect spreads
  for (let i = attributes.length - 1, attr; (attr = attributes[i]); i--) {
    const node = attr.node
    if (t.isJSXSpreadAttribute(attr)) {
      const name = node.argument.name
      const attrNameDotClassName = t.memberExpression(
        t.isMemberExpression(node.argument)
          ? node.argument
          : t.identifier(name),
        t.identifier('className')
      )

      spreads.push(
        // `${name}.className != null && ${name}.className`
        and(
          t.binaryExpression('!=', attrNameDotClassName, t.nullLiteral()),
          attrNameDotClassName
        )
      )
      continue
    }
    if (t.isJSXAttribute(attr) && node.name.name === 'className') {
      className = attributes[i]
      // found className break the loop
      break
    }
  }

  if (className) {
    let newClassName = className.node.value.expression || className.node.value
    newClassName =
      t.isStringLiteral(newClassName) || t.isTemplateLiteral(newClassName)
        ? newClassName
        : or(newClassName, t.stringLiteral(''))
    className.remove()

    className = t.jSXExpressionContainer(
      spreads.length === 0
        ? concat(jsxIdWithSpace, newClassName)
        : concat(jsxIdWithSpace, or(joinSpreads(spreads), newClassName))
    )
  } else {
    className = t.jSXExpressionContainer(
      spreads.length === 0
        ? jsxId
        : concat(jsxIdWithSpace, or(joinSpreads(spreads), t.stringLiteral('')))
    )
  }

  path.node.attributes.push(
    t.jSXAttribute(t.jSXIdentifier('className'), className)
  )
}

export const getScope = path =>
  (
    path.findParent(
      path =>
        path.isFunctionDeclaration() ||
        path.isArrowFunctionExpression() ||
        path.isClassMethod()
    ) || path
  ).scope

export const isGlobalEl = el =>
  el.attributes.some(({ name }) => name && name.name === GLOBAL_ATTRIBUTE)

export const isStyledJsx = ({ node: el }) =>
  t.isJSXElement(el) &&
  el.openingElement.name.name === 'style' &&
  el.openingElement.attributes.some(attr => attr.name.name === STYLE_ATTRIBUTE)

export const findStyles = path => {
  if (isStyledJsx(path)) {
    const { node } = path
    return isGlobalEl(node.openingElement) ? [path] : []
  }

  return path.get('children').filter(isStyledJsx)
}

// The following visitor ensures that MemberExpressions and Identifiers
// are not in the scope of the current Method (render) or function (Component).
export const validateExpressionVisitor = {
  MemberExpression(path, scope) {
    const { node } = path
    if (
      (t.isIdentifier(node.property) &&
        (t.isThisExpression(node.object) &&
          (node.property.name === 'props' ||
            node.property.name === 'state' ||
            node.property.name === 'context'))) ||
      (t.isIdentifier(node.object) && scope.hasOwnBinding(node.object.name))
    ) {
      throw path.buildCodeFrameError(
        `Expected a constant ` +
          `as part of the template literal expression ` +
          `(eg: <style jsx>{\`p { color: $\{myColor}\`}</style>), ` +
          `but got a MemberExpression: this.${node.property.name}`
      )
    }
  },
  Identifier(path, scope) {
    const { name } = path.node

    if (t.isMemberExpression(path.parentPath) && scope.hasOwnBinding(name)) {
      return
    }

    let targetScope = path.scope
    let isDynamicBinding = false

    // Traversing scope chain in order to find current variable.
    // If variable has no parent scope and it's `const` then we can interp. it
    // as static in order to optimize styles.
    // `let` and `var` can be changed during runtime.
    while (targetScope) {
      if (targetScope.hasOwnBinding(name)) {
        const binding = targetScope.bindings[name]
        isDynamicBinding =
          binding.scope.parent !== null || binding.kind !== 'const'
        break
      }
      targetScope = targetScope.parent
    }

    if (isDynamicBinding) {
      throw path.buildCodeFrameError(
        `Expected \`${name}\` ` +
          `to not come from the closest scope.\n` +
          `Styled JSX encourages the use of constants ` +
          `instead of \`props\` or dynamic values ` +
          `which are better set via inline styles or \`className\` toggling. ` +
          `See https://github.com/zeit/styled-jsx#dynamic-styles`
      )
    }
  }
}

// Use `validateExpressionVisitor` to determine whether the `expr`ession has dynamic values.
export const isDynamic = (expr, scope) => {
  try {
    expr.traverse(validateExpressionVisitor, scope)
    return false
  } catch (err) {}

  return true
}

const validateExternalExpressionsVisitor = {
  Identifier(path) {
    if (t.isMemberExpression(path.parentPath)) {
      return
    }
    const { name } = path.node
    if (!path.scope.hasBinding(name)) {
      throw path.buildCodeFrameError(path.getSource())
    }
  },
  MemberExpression(path) {
    const { node } = path
    if (!t.isIdentifier(node.object)) {
      return
    }
    if (!path.scope.hasBinding(node.object.name)) {
      throw path.buildCodeFrameError(path.getSource())
    }
  },
  ThisExpression(path) {
    throw new Error(path.parentPath.getSource())
  }
}

export const validateExternalExpressions = path => {
  try {
    path.traverse(validateExternalExpressionsVisitor)
  } catch (err) {
    throw path.buildCodeFrameError(`
      Found an \`undefined\` or invalid value in your styles: \`${
        err.message
      }\`.

      If you are trying to use dynamic styles in external files this is unfortunately not possible yet.
      Please put the dynamic parts alongside the component. E.g.

      <button>
        <style jsx>{externalStylesReference}</style>
        <style jsx>{\`
          button { background-color: $\{${err.message}} }
        \`}</style>
      </button>
    `)
  }
}

export const getJSXStyleInfo = (expr, scope) => {
  const { node } = expr
  const location = node.loc

  // Assume string literal
  if (t.isStringLiteral(node)) {
    return {
      hash: hashString(node.value),
      css: node.value,
      expressions: [],
      dynamic: false,
      location
    }
  }

  // Simple template literal without expressions
  if (node.expressions.length === 0) {
    return {
      hash: hashString(node.quasis[0].value.cooked),
      css: node.quasis[0].value.cooked,
      expressions: [],
      dynamic: false,
      location
    }
  }

  // Special treatment for template literals that contain expressions:
  //
  // Expressions are replaced with a placeholder
  // so that the CSS compiler can parse and
  // transform the css source string
  // without having to know about js literal expressions.
  // Later expressions are restored.
  //
  // e.g.
  // p { color: ${myConstant}; }
  // becomes
  // p { color: %%styled-jsx-placeholder-${id}%%; }

  const { quasis, expressions } = node
  const hash = hashString(expr.getSource().slice(1, -1))
  const dynamic = scope ? isDynamic(expr, scope) : false
  const css = quasis.reduce(
    (css, quasi, index) =>
      `${css}${quasi.value.cooked}${
        quasis.length === index + 1 ? '' : `%%styled-jsx-placeholder-${index}%%`
      }`,
    ''
  )

  return {
    hash,
    css,
    expressions,
    dynamic,
    location
  }
}

export const computeClassNames = (styles, externalJsxId) => {
  if (styles.length === 0) {
    return {
      className: externalJsxId
    }
  }

  const hashes = styles.reduce(
    (acc, styles) => {
      if (styles.dynamic === false) {
        acc.static.push(styles.hash)
      } else {
        acc.dynamic.push(styles)
      }
      return acc
    },
    {
      static: [],
      dynamic: []
    }
  )

  const staticClassName = `jsx-${hashString(hashes.static.join(','))}`

  // Static and optionally external classes. E.g.
  // '[jsx-externalClasses] jsx-staticClasses'
  if (hashes.dynamic.length === 0) {
    return {
      staticClassName,
      className: externalJsxId
        ? concat(t.stringLiteral(staticClassName + ' '), externalJsxId)
        : t.stringLiteral(staticClassName)
    }
  }

  // _JSXStyle.dynamic([ ['1234', [props.foo, bar, fn(props)]], ... ])
  const dynamic = t.callExpression(
    // Callee: _JSXStyle.dynamic
    t.memberExpression(t.identifier(STYLE_COMPONENT), t.identifier('dynamic')),
    // Arguments
    [
      t.arrayExpression(
        hashes.dynamic.map(styles =>
          t.arrayExpression([
            t.stringLiteral(hashString(styles.hash + staticClassName)),
            t.arrayExpression(styles.expressions)
          ])
        )
      )
    ]
  )

  // Dynamic and optionally external classes. E.g.
  // '[jsx-externalClasses] ' + _JSXStyle.dynamic([ ['1234', [props.foo, bar, fn(props)]], ... ])
  if (hashes.static.length === 0) {
    return {
      staticClassName,
      className: externalJsxId
        ? concat(concat(externalJsxId, t.stringLiteral(' ')), dynamic)
        : dynamic
    }
  }

  // Static, dynamic and optionally external classes. E.g.
  // '[jsx-externalClasses] jsx-staticClasses ' + _JSXStyle.dynamic([ ['5678', [props.foo, bar, fn(props)]], ... ])
  return {
    staticClassName,
    className: externalJsxId
      ? concat(
          concat(externalJsxId, t.stringLiteral(` ${staticClassName} `)),
          dynamic
        )
      : concat(t.stringLiteral(`${staticClassName} `), dynamic)
  }
}

export const templateLiteralFromPreprocessedCss = (css, expressions) => {
  const quasis = []
  const finalExpressions = []
  const parts = css.split(/(?:%%styled-jsx-placeholder-(\d+)%%)/g)

  if (parts.length === 1) {
    return t.stringLiteral(css)
  }

  parts.forEach((part, index) => {
    if (index % 2 > 0) {
      // This is necessary because, after preprocessing, declarations might have been alterate.
      // eg. properties are auto prefixed and therefore expressions need to match.
      finalExpressions.push(expressions[part])
    } else {
      quasis.push(part)
    }
  })

  return t.templateLiteral(
    quasis.map((quasi, index) =>
      t.templateElement(
        {
          raw: quasi,
          cooked: quasi
        },
        quasis.length === index + 1
      )
    ),
    finalExpressions
  )
}

export const cssToBabelType = css => {
  if (typeof css === 'string') {
    return t.stringLiteral(css)
  } else if (Array.isArray(css)) {
    return t.arrayExpression(css)
  }

  return css
}

export const makeStyledJsxTag = (id, transformedCss, expressions = []) => {
  const css = cssToBabelType(transformedCss)

  const attributes = [
    t.jSXAttribute(
      t.jSXIdentifier(STYLE_COMPONENT_ID),
      t.jSXExpressionContainer(
        typeof id === 'string' ? t.stringLiteral(id) : id
      )
    ),
    t.jSXAttribute(
      t.jSXIdentifier(STYLE_COMPONENT_CSS),
      t.jSXExpressionContainer(css)
    )
  ]

  if (expressions.length > 0) {
    attributes.push(
      t.jSXAttribute(
        t.jSXIdentifier(STYLE_COMPONENT_DYNAMIC),
        t.jSXExpressionContainer(t.arrayExpression(expressions))
      )
    )
  }

  return t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier(STYLE_COMPONENT), attributes, true),
    null,
    []
  )
}

export const makeSourceMapGenerator = file => {
  const filename = file.opts.sourceFileName
  const generator = new SourceMapGenerator({
    file: filename,
    sourceRoot: file.opts.sourceRoot
  })

  generator.setSourceContent(filename, file.code)
  return generator
}

export const addSourceMaps = (code, generator, filename) => {
  const sourceMaps = [
    convert.fromObject(generator).toComment({ multiline: true }),
    `/*@ sourceURL=${filename} */`
  ]

  if (Array.isArray(code)) {
    return code.concat(sourceMaps)
  }

  return [code].concat(sourceMaps).join('\n')
}

export const combinePlugins = plugins => {
  if (!plugins) {
    return css => css
  }

  if (
    !Array.isArray(plugins) ||
    plugins.some(p => !Array.isArray(p) && typeof p !== 'string')
  ) {
    throw new Error(
      '`plugins` must be an array of plugins names (string) or an array `[plugin-name, {options}]`'
    )
  }

  return plugins
    .map((plugin, i) => {
      let options = {}
      if (Array.isArray(plugin)) {
        options = plugin[1] || {}
        plugin = plugin[0]
        if (Object.prototype.hasOwnProperty.call(options, 'babel')) {
          throw new Error(`
            Error while trying to register the styled-jsx plugin: ${plugin}
            The option name \`babel\` is reserved.
          `)
        }
      }

      // eslint-disable-next-line import/no-dynamic-require
      let p = require(plugin)
      if (p.default) {
        p = p.default
      }

      const type = typeof p
      if (type !== 'function') {
        throw new Error(
          `Expected plugin ${
            plugins[i]
          } to be a function but instead got ${type}`
        )
      }
      return {
        plugin: p,
        options
      }
    })
    .reduce(
      (previous, { plugin, options }) => (css, babelOptions) =>
        plugin(previous ? previous(css, babelOptions) : css, {
          ...options,
          babel: babelOptions
        }),
      null
    )
}

const getPrefix = (isDynamic, id) =>
  isDynamic ? '.__jsx-style-dynamic-selector' : `.${id}`

export const processCss = (stylesInfo, options) => {
  const {
    hash,
    css,
    expressions,
    dynamic,
    location,
    fileInfo,
    isGlobal,
    plugins,
    vendorPrefixes
  } = stylesInfo

  const staticClassName =
    stylesInfo.staticClassName || `jsx-${hashString(hash)}`

  const { splitRules } = options

  const useSourceMaps = Boolean(fileInfo.sourceMaps) && !splitRules

  const pluginsOptions = {
    location: {
      start: { ...location.start },
      end: { ...location.end }
    },
    vendorPrefixes,
    sourceMaps: useSourceMaps,
    isGlobal,
    filename: fileInfo.filename
  }

  let transformedCss

  if (useSourceMaps) {
    const generator = makeSourceMapGenerator(fileInfo.file)
    const filename = fileInfo.sourceFileName
    transformedCss = addSourceMaps(
      transform(
        isGlobal ? '' : getPrefix(dynamic, staticClassName),
        plugins(css, pluginsOptions),
        {
          generator,
          offset: location.start,
          filename,
          splitRules,
          vendorPrefixes
        }
      ),
      generator,
      filename
    )
  } else {
    transformedCss = transform(
      isGlobal ? '' : getPrefix(dynamic, staticClassName),
      plugins(css, pluginsOptions),
      { splitRules, vendorPrefixes }
    )
  }

  if (expressions.length > 0) {
    if (typeof transformedCss === 'string') {
      transformedCss = templateLiteralFromPreprocessedCss(
        transformedCss,
        expressions
      )
    } else {
      transformedCss = transformedCss.map(transformedCss =>
        templateLiteralFromPreprocessedCss(transformedCss, expressions)
      )
    }
  } else if (Array.isArray(transformedCss)) {
    transformedCss = transformedCss.map(transformedCss =>
      t.stringLiteral(transformedCss)
    )
  }

  return {
    hash: dynamic ? hashString(hash + staticClassName) : hashString(hash),
    css: transformedCss,
    expressions: dynamic && expressions
  }
}

export const booleanOption = opts => {
  let ret
  opts.some(opt => {
    if (typeof opt === 'boolean') {
      ret = opt
      return true
    }
    return false
  })
  return ret
}
