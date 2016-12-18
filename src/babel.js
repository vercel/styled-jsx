// Packages
import jsx from 'babel-plugin-syntax-jsx'
import hash from 'string-hash'
import {SourceMapGenerator} from 'source-map'
import convert from 'convert-source-map'

// Ours
import transform from '../lib/style-transform'

const STYLE_ATTRIBUTE = 'jsx'
const GLOBAL_ATTRIBUTE = 'global'
const MARKUP_ATTRIBUTE = 'data-jsx'
const STYLE_COMPONENT = '_JSXStyle'
const STYLE_COMPONENT_CSS = 'css'

export default function ({types: t}) {
  const findStyles = children => (
    children.filter(el => (
      t.isJSXElement(el) &&
      el.openingElement.name.name === 'style' &&
      el.openingElement.attributes.some(attr => (
        attr.name.name === STYLE_ATTRIBUTE
      ))
    ))
  )

  const getExpressionText = expr => (
    t.isTemplateLiteral(expr) ?
      expr.quasis[0].value.raw :
      // assume string literal
      expr.value
  )

  const makeStyledJsxTag = transformedCss => (
    t.JSXElement(
      t.JSXOpeningElement(
        t.JSXIdentifier(STYLE_COMPONENT),
        [t.JSXAttribute(
          t.JSXIdentifier(STYLE_COMPONENT_CSS),
          t.JSXExpressionContainer(t.stringLiteral(transformedCss))
        )],
        true
      ),
      null,
      []
    )
  )

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

        if (el.name && el.name.name !== 'style') {
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

          const styles = findStyles(path.node.children)

          if (styles.length === 0) {
            state.hasJSXStyle = false
            return
          }

          state.styles = []

          for (const style of styles) {
            // compute children excluding whitespace
            const children = style.children.filter(c => (
              t.isJSXExpressionContainer(c) ||
              // ignore whitespace around the expression container
              (t.isJSXText(c) && c.value.trim() !== '')
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

            const expression = child.expression

            if (!t.isTemplateLiteral(child.expression) &&
                !t.isStringLiteral(child.expression)) {
              throw path.buildCodeFrameError(`Expected a template ` +
                `literal or String literal as the child of the ` +
                `JSX Style tag (eg: <style jsx>{\`some css\`}</style>),` +
                ` but got ${expression.type}`)
            }

            const styleText = getExpressionText(expression)

            state.styles.push([
              styleText,
              expression.loc
            ])
          }

          state.jsxId = hash(state.styles.map((s) => s[0]).join(''))
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
          const [css, loc] = state.styles.shift()

          const isGlobal = el.attributes.some(attr => (
            attr.name.name === GLOBAL_ATTRIBUTE
          ))

          if (isGlobal) {
            path.replaceWith(makeStyledJsxTag(css))
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

          path.replaceWith(makeStyledJsxTag(transformedCss))
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
