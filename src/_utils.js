import * as t from 'babel-types'
import _hashString from 'string-hash'
import { parse as parseCss } from 'css-tree'
import { SourceMapGenerator } from 'source-map'
import convert from 'convert-source-map'

import {
  STYLE_ATTRIBUTE,
  GLOBAL_ATTRIBUTE,
  STYLE_COMPONENT_ID,
  STYLE_COMPONENT,
  STYLE_COMPONENT_CSS,
  STYLE_COMPONENT_DYNAMIC,
  MARKUP_ATTRIBUTE
} from './_constants'

const concat = (a, b) => t.binaryExpression('+', a, b)
const and = (a, b) => t.logicalExpression('&&', a, b)
const or = (a, b) => t.logicalExpression('||', a, b)

const joinSpreads = spreads => spreads.reduce((acc, curr) => or(acc, curr))

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
        t.identifier(name),
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

  // Mark the path so that we don't add duplicates later.
  path.node.attributes.push(
    t.jSXAttribute(t.jSXIdentifier(MARKUP_ATTRIBUTE), null)
  )
}

export const hashString = str => String(_hashString(str))

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
            node.property.name === 'state'))) ||
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
    if (t.isMemberExpression(path.parentPath)) {
      return
    }
    const { name } = path.node
    if (scope.hasOwnBinding(name)) {
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
      `${css}${quasi.value.cooked}${quasis.length === index + 1
        ? ''
        : `%%styled-jsx-placeholder-${index}%%`}`,
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
    return externalJsxId
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

  if (hashes.dynamic.length === 0) {
    return {
      staticClassName,
      attribute: t.stringLiteral(staticClassName)
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

  if (hashes.static.length === 0) {
    return {
      staticClassName,
      attribute: dynamic
    }
  }

  // `1234 ${_JSXStyle.dynamic([ ['5678', [props.foo, bar, fn(props)]], ... ])}`
  return {
    staticClassName,
    attribute: t.templateLiteral(
      [
        t.templateElement(
          {
            raw: staticClassName + ' ',
            cooked: staticClassName + ' '
          },
          false
        ),
        t.templateElement({ raw: '', cooked: '' }, true)
      ],
      [dynamic]
    )
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

export const makeStyledJsxTag = (id, transformedCss, expressions = []) => {
  let css

  if (typeof transformedCss === 'string') {
    css = t.stringLiteral(transformedCss)
  } else if (Array.isArray(transformedCss)) {
    css = t.arrayExpression(transformedCss)
  } else {
    css = transformedCss
  }

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

export const isValidCss = str => {
  try {
    parseCss(
      // Replace the placeholders with some valid CSS
      // so that parsing doesn't fail for otherwise valid CSS.
      str
        // Replace all the placeholders with `all`
        .replace(
          // `\S` (the `delimiter`) is to match
          // the beginning of a block `{`
          // a property `:`
          // or the end of a property `;`
          /(\S)?\s*%%styled-jsx-placeholder-[^%]+%%(?:\s*(\}))?/gi,
          (match, delimiter, isBlockEnd) => {
            // The `end` of the replacement would be
            let end

            if (delimiter === ':' && isBlockEnd) {
              // ';}' single property block without semicolon
              // E.g. { color: all;}
              end = `;}`
            } else if (delimiter === '{' || isBlockEnd) {
              // ':;' when we are at the beginning or the end of a block
              // E.g. { all:; ...otherstuff
              // E.g. all:; }
              end = `:;${isBlockEnd || ''}`
            } else if (delimiter === ';') {
              // ':' when we are inside of a block
              // E.g. color: red; all:; display: block;
              end = ':'
            } else {
              // Otherwise empty
              end = ''
            }

            return `${delimiter || ''}all${end}`
          }
        )
        // Replace block placeholders before media queries
        // E.g. all @media (all) {}
        .replace(/all\s*([@])/g, (match, delimiter) => `all {} ${delimiter}`)
        // Replace block placeholders at the beginning of a media query block
        // E.g. @media (all) { all:; div { ... }}
        .replace(/@media[^{]+{\s*all:;/g, '@media (all) { ')
    )
    return true
  } catch (err) {}
  return false
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
