// Packages
import jsx from 'babel-plugin-syntax-jsx'
import hash from 'string-hash'
import {SourceMapGenerator} from 'source-map'
import convert from 'convert-source-map'
import {transform as parse} from 'babel-core'

// Ours
import transform from '../lib/style-transform'

const STYLE_ATTRIBUTE = 'jsx'
const GLOBAL_ATTRIBUTE = 'global'
const MARKUP_ATTRIBUTE = 'data-jsx'
const STYLE_COMPONENT = '_JSXStyle'
const STYLE_COMPONENT_ID = 'styleId'
const STYLE_COMPONENT_CSS = 'css'

export default function ({types: t}) {
  const findStyles = children => (
    children.filter(el => (
      t.isJSXElement(el.node) &&
      el.node.openingElement.name.name === 'style' &&
      el.node.openingElement.attributes.some(attr => (
        attr.name.name === STYLE_ATTRIBUTE
      ))
    ))
  )

  const getExpressionText = expr => {
    const node = expr.node

    // assuming string literal
    if (t.isStringLiteral(node)) {
      return node.value
    }

    const expressions = node.expressions

    // simple template literal without expressions
    if (expressions.length === 0) {
      return node.quasis[0].value.cooked
    }

    const errors = expressions.reduce((errors, expression) => {
      if (
        t.isArrowFunctionExpression(expression) ||
        t.isFunctionExpression(expression)
      ) {
        errors.push(`styled-jsx cannot contain function expressions:\n${expr.getSource()}`)
      }
      return errors
    }, [])

    if (errors.length > 0) {
      throw expr.buildCodeFrameError(`\n${errors.join('\n')}`)
    }

    // strip out ` and return the template literal source
    return expr.getSource().slice(1, -1)
  }

  const makeStyledJsxTag = (id, transformedCss, isTemplateLiteral) => {
    let css
    if (isTemplateLiteral) {
      // build the expression from transformedCss
      css = parse(`\`${transformedCss}\``).ast.program.body[0].expression
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

        const el = path.node

        if (el.name &&
          (el.name.name !== 'style' && el.name.name !== STYLE_COMPONENT)) {
          for (const attr of el.attributes) {
            if (attr.name === MARKUP_ATTRIBUTE) {
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

          const styles = findStyles(path.get('children'))

          if (styles.length === 0) {
            if (state.file.hasJSXStyle) {
              state.hasJSXStyle = false
            }
            return
          }

          state.styles = []

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

            const expression = child.node.expression

            if (!t.isTemplateLiteral(expression) &&
                !t.isStringLiteral(expression)) {
              throw path.buildCodeFrameError(`Expected a template ` +
                `literal or String literal as the child of the ` +
                `JSX Style tag (eg: <style jsx>{\`some css\`}</style>),` +
                ` but got ${expression.type}`)
            }

            const styleText = getExpressionText(child.get('expression'))
            const styleId = hash(styleText)

            state.styles.push([
              styleId,
              styleText,
              expression.loc,
              t.isTemplateLiteral(expression) && expression.expressions.length > 0
            ])
          }

          state.jsxId = hash(state.styles.map(s => s[1]).join(''))
          state.hasJSXStyle = true
          state.file.hasJSXStyle = true
          // next visit will be: JSXOpeningElement
        },
        exit(path, state) {
          if (state.hasJSXStyle && !--state.ignoreClosing) {
            state.hasJSXStyle = null
          }

          if (!state.hasJSXStyle) {
            return
          }

          const el = path.node.openingElement

          if (!el.name || el.name.name !== 'style') {
            return
          }

          // we replace styles with the function call
          const [id, css, loc, isTemplateLiteral] = state.styles.shift()

          const isGlobal = el.attributes.some(attr => (
            attr.name.name === GLOBAL_ATTRIBUTE
          ))

          if (isGlobal) {
            path.replaceWith(makeStyledJsxTag(id, css, isTemplateLiteral))
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
              transform(state.jsxId, css, generator, loc.start, filename),
              convert
                .fromObject(generator)
                .toComment({multiline: true}),
              `/*@ sourceURL=${filename} */`
            ].join('\n')
          } else {
            transformedCss = transform(state.jsxId, css)
          }

          path.replaceWith(
            makeStyledJsxTag(id, transformedCss, isTemplateLiteral)
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
