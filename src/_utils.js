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

const makeStyledJsxTag = (id, transformedCss, isTemplateLiteral) => {
  let css
  if (isTemplateLiteral) {
    // build the expression from transformedCss
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
  } else {
    css = t.stringLiteral(transformedCss)
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

export {
  isGlobalEl,
  isStyledJsx,
  findStyles,
  getExpressionText,
  makeStyledJsxTag,
  validateExpression
}
