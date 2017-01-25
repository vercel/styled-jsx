// Packages
import jsx from 'babel-plugin-syntax-jsx'
import hash from 'string-hash'
import {SourceMapGenerator} from 'source-map'
import convert from 'convert-source-map'
import traverse from 'babel-traverse'
import {parse} from 'babylon'

// Ours
import transform from '../lib/style-transform'

const STYLE_ATTRIBUTE = 'jsx'
const GLOBAL_ATTRIBUTE = 'global'
const MARKUP_ATTRIBUTE = 'data-jsx'
const STYLE_COMPONENT = '_JSXStyle'
const STYLE_COMPONENT_ID = 'styleId'
const STYLE_COMPONENT_CSS = 'css'

export default function ({types: t}) {
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
      replacement: `___styledjsxexpression_${id}___`,
      initial: `$\{${e.getSource()}}`
    })).sort((a, b) => a.initial.length < b.initial.length)

    const source = expr.getSource().slice(1, -1)

    const modified = replacements.reduce((source, currentReplacement) => {
      source = source.replace(
        currentReplacement.initial,
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

  return {
    inherits: jsx,
    visitor: {
      JSXOpeningElement(path, state) {
        const el = path.node
        const {name} = el.name || {}

        if (!state.hasJSXStyle) {
          return
        }

        if (state.ignoreClosing === null) {
          // we keep a counter of elements inside so that we
          // can keep track of when we exit the parent to reset state
          // note: if we wished to add an option to turn off
          // selectors to reach parent elements, it would suffice to
          // set this to `1` and do an early return instead
          state.ignoreClosing = 0
        }

        if (
          name &&
          name !== 'style' &&
          name !== STYLE_COMPONENT &&
          name.charAt(0) !== name.charAt(0).toUpperCase()
        ) {
          for (const {name} of el.attributes) {
            if (!name) {
              continue
            }
            if (name === MARKUP_ATTRIBUTE || name.name === MARKUP_ATTRIBUTE) {
              // avoid double attributes
              return
            }
          }

          const attr = t.jSXAttribute(
            t.JSXIdentifier(MARKUP_ATTRIBUTE),
            t.JSXExpressionContainer(t.numericLiteral(state.jsxId))
          )
          el.attributes.push(attr)
        }

        state.ignoreClosing++
        // next visit will be: JSXElement exit()
      },
      JSXElement: {
        enter(path, state) {
          if (state.hasJSXStyle !== null) {
            return
          }

          const styles = findStyles(path)

          if (styles.length === 0) {
            return
          }

          state.styles = []

          const scope = (path.findParent(path => (
            path.isFunctionDeclaration() ||
            path.isArrowFunctionExpression() ||
            path.isClassMethod()
          )) || path).scope

          for (const style of styles) {
            // compute children excluding whitespace
            const children = style.get('children').filter(c => (
              t.isJSXExpressionContainer(c.node) ||
              // ignore whitespace around the expression container
              (t.isJSXText(c.node) && c.node.value.trim() !== '')
            ))

            if (children.length !== 1) {
              throw path.buildCodeFrameError(`Expected one child under ` +
                `JSX Style tag, but got ${style.children.length} ` +
                `(eg: <style jsx>{\`hi\`}</style>)`)
            }

            const child = children[0]

            if (!t.isJSXExpressionContainer(child)) {
              throw path.buildCodeFrameError(`Expected a child of ` +
                `type JSXExpressionContainer under JSX Style tag ` +
                `(eg: <style jsx>{\`hi\`}</style>), got ${child.type}`)
            }

            const expression = child.get('expression')

            if (!t.isTemplateLiteral(expression) &&
                !t.isStringLiteral(expression)) {
              throw path.buildCodeFrameError(`Expected a template ` +
                `literal or String literal as the child of the ` +
                `JSX Style tag (eg: <style jsx>{\`some css\`}</style>),` +
                ` but got ${expression.type}`)
            }

            // Validate MemberExpressions and Identifiers
            // to ensure that are constants not defined in the closest scope
            child.get('expression').traverse(validateExpressionVisitor, scope)

            const styleText = getExpressionText(expression)
            const styleId = hash(styleText.source || styleText)

            state.styles.push([
              styleId,
              styleText,
              expression.node.loc
            ])
          }

          state.jsxId = hash(state.styles.map(s => s[1]).join(''))
          state.hasJSXStyle = true
          state.file.hasJSXStyle = true
          // next visit will be: JSXOpeningElement
        },
        exit(path, state) {
          const isGlobal = isGlobalEl(path.node.openingElement)

          if (state.hasJSXStyle && (!--state.ignoreClosing && !isGlobal)) {
            state.hasJSXStyle = null
          }

          if (!state.hasJSXStyle || !isStyledJsx(path)) {
            return
          }

          // we replace styles with the function call
          const [id, css, loc] = state.styles.shift()

          if (isGlobal) {
            path.replaceWith(makeStyledJsxTag(id, css.source || css, css.modified))
            return
          }

          const useSourceMaps = Boolean(state.file.opts.sourceMaps)
          let transformedCss

          if (useSourceMaps) {
            const filename = state.file.opts.sourceFileName
            const generator = new SourceMapGenerator({
              file: filename,
              sourceRoot: state.file.opts.sourceRoot
            })
            generator.setSourceContent(filename, state.file.code)
            transformedCss = [
              transform(
                String(state.jsxId),
                css.modified || css,
                generator,
                loc.start,
                filename
              ),
              convert
                .fromObject(generator)
                .toComment({multiline: true}),
              `/*@ sourceURL=${filename} */`
            ].join('\n')
          } else {
            transformedCss = transform(
              String(state.jsxId),
              css.modified || css
            )
          }

          if (css.modified) {
            transformedCss = css.replacements.reduce(
              (transformedCss, currentReplacement) => {
                transformedCss = transformedCss.replace(
                  currentReplacement.replacement,
                  currentReplacement.initial
                )
                return transformedCss
              },
              transformedCss
            )
          }

          path.replaceWith(
            makeStyledJsxTag(id, transformedCss, css.modified)
          )
        }
      },
      Program: {
        enter(path, state) {
          state.hasJSXStyle = null
          state.ignoreClosing = null
          state.file.hasJSXStyle = false
        },
        exit({node, scope}, state) {
          if (!(state.file.hasJSXStyle && !scope.hasBinding(STYLE_COMPONENT))) {
            return
          }

          const importDeclaration = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
            t.stringLiteral('styled-jsx/style')
          )

          node.body.unshift(importDeclaration)
        }
      }
    }
  }
}
