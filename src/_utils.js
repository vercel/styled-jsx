import {dirname, normalize} from 'path'
import * as t from 'babel-types'
import escapeStringRegExp from 'escape-string-regexp'
import traverse from 'babel-traverse'
import {parse} from 'babylon'

import {
  STYLE_ATTRIBUTE,
  GLOBAL_ATTRIBUTE,
  STYLE_COMPONENT_ID,
  STYLE_COMPONENT,
  STYLE_COMPONENT_CSS
} from './_constants'

const isGlobalEl = el => el.attributes.some(({name}) => (
  name && name.name === GLOBAL_ATTRIBUTE
))

const isStyledJsx = ({node: el}) => (
  t.isJSXElement(el) &&
  el.openingElement.name.name === 'style' &&
  el.openingElement.attributes.some(attr => (
    attr.name.name === STYLE_ATTRIBUTE
  ))
)

const findStyles = path => {
  if (isStyledJsx(path)) {
    const {node} = path
    return isGlobalEl(node.openingElement) ?
      [path] : []
  }

  return path.get('children').filter(isStyledJsx)
}

const getExpressionText = expr => {
  const node = expr.node

  // assume string literal
  if (t.isStringLiteral(node)) {
    return node.value
  }

  const expressions = expr.get('expressions')

  // simple template literal without expressions
  if (expressions.length === 0) {
    return node.quasis[0].value.cooked
  }

  // Special treatment for template literals that contain expressions:
  //
  // Expressions are replaced with a placeholder
  // so that the CSS compiler can parse and
  // transform the css source string
  // without having to know about js literal expressions.
  // Later expressions are restored
  // by doing a replacement on the transformed css string.
  //
  // e.g.
  // p { color: ${myConstant}; }
  // becomes
  // p { color: ___styledjsxexpression0___; }

  const replacements = expressions.map((e, id) => ({
    pattern: new RegExp(`\\$\\{\\s*${escapeStringRegExp(e.getSource())}\\s*\\}`),
    replacement: `___styledjsxexpression_${id}___`,
    initial: `$\{${e.getSource()}}`
  })).sort((a, b) => a.initial.length < b.initial.length)

  const source = expr.getSource().slice(1, -1)

  const modified = replacements.reduce((source, currentReplacement) => {
    source = source.replace(
      currentReplacement.pattern,
      currentReplacement.replacement
    )
    return source
  }, source)

  return {
    source,
    modified,
    replacements
  }
}

const restoreExpressions = (css, replacements) => replacements.reduce(
  (css, currentReplacement) => {
    css = css.replace(
      new RegExp(currentReplacement.replacement, 'g'),
      currentReplacement.initial
    )
    return css
  },
  css
)

const makeStyledJsxCss = (transformedCss, isTemplateLiteral) => {
  if (!isTemplateLiteral) {
    return t.stringLiteral(transformedCss)
  }
  // build the expression from transformedCss
  let css
  traverse(
    parse(`\`${transformedCss}\``),
    {
      TemplateLiteral(path) {
        if (!css) {
          css = path.node
        }
      }
    }
  )
  return css
}

const makeStyledJsxTag = (id, transformedCss, isTemplateLiteral) => {
  let css

  if (
    typeof transformedCss === 'object' &&
    t.isMemberExpression(transformedCss)
  ) {
    css = transformedCss
  } else {
    css = makeStyledJsxCss(transformedCss, isTemplateLiteral)
  }

  return t.JSXElement(
    t.JSXOpeningElement(
      t.JSXIdentifier(STYLE_COMPONENT),
      [
        t.JSXAttribute(
          t.JSXIdentifier(STYLE_COMPONENT_ID),
          t.JSXExpressionContainer(t.numericLiteral(id))
        ),
        t.JSXAttribute(
          t.JSXIdentifier(STYLE_COMPONENT_CSS),
          t.JSXExpressionContainer(css)
        )
      ],
      true
    ),
    null,
    []
  )
}

// We only allow constants to be used in template literals.
// The following visitor ensures that MemberExpressions and Identifiers
// are not in the scope of the current Method (render) or function (Component).
const validateExpressionVisitor = {
  MemberExpression(path) {
    const {node} = path
    if (
      t.isThisExpression(node.object) &&
      t.isIdentifier(node.property) &&
      (
        node.property.name === 'props' ||
        node.property.name === 'state'
      )
    ) {
      throw path.buildCodeFrameError(
        `Expected a constant ` +
        `as part of the template literal expression ` +
        `(eg: <style jsx>{\`p { color: $\{myColor}\`}</style>), ` +
        `but got a MemberExpression: this.${node.property.name}`)
    }
  },
  Identifier(path, scope) {
    const {name} = path.node
    if (scope.hasOwnBinding(name)) {
      throw path.buildCodeFrameError(
        `Expected \`${name}\` ` +
        `to not come from the closest scope.\n` +
        `Styled JSX encourages the use of constants ` +
        `instead of \`props\` or dynamic values ` +
        `which are better set via inline styles or \`className\` toggling. ` +
        `See https://github.com/zeit/styled-jsx#dynamic-styles`)
    }
  }
}

const validateExpression = (expr, scope) => (
  expr.traverse(validateExpressionVisitor, scope)
)

const getExternalReference = (path, imports) => {
  const {node} = path
  if (!t.isIdentifier(node)) {
    return null
  }

  const importExpr = imports.filter(path => {
    const specifiers = path.get('specifiers')
    if (specifiers.length !== 1) {
      return false
    }
    return (
      specifiers[0].isImportDefaultSpecifier() &&
      specifiers[0].get('local').node.name === node.name
    )
  })[0]

  if (!importExpr) {
    return null
  }

  return importExpr.get('source').node.value
}

const resolvePath = (path, modulePath) => {
  if (path.charAt(0) !== '.') {
    return require.resolve(path)
  }
  return require.resolve(
    normalize(`${dirname(modulePath)}/${path}`)
  )
}

const generateAttribute = (name, value) => (
  t.jSXAttribute(
    t.JSXIdentifier(name),
    t.JSXExpressionContainer(value)
  )
)

export {
  isGlobalEl,
  isStyledJsx,
  findStyles,
  getExpressionText,
  restoreExpressions,
  makeStyledJsxCss,
  makeStyledJsxTag,
  validateExpression,
  getExternalReference,
  resolvePath,
  generateAttribute
}
