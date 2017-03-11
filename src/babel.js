// Packages
import jsx from 'babel-plugin-syntax-jsx'
import hash from 'string-hash'
import {SourceMapGenerator} from 'source-map'
import convert from 'convert-source-map'

// Ours
import transform from '../lib/style-transform'

import {
  isGlobalEl,
  isStyledJsx,
  findStyles,
  getExpressionText,
  makeStyledJsxTag,
  validateExpression
} from './_utils'

import {
  MARKUP_ATTRIBUTE,
  STYLE_COMPONENT
} from './_constants'

export default function ({types: t}) {
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
            validateExpression(expression, scope)

            const styleText = getExpressionText(expression)
            const styleId = hash(styleText.source || styleText)

            state.styles.push([
              styleId,
              styleText,
              expression.node.loc
            ])
          }

          state.jsxId = hash(state.styles.map(s => s[1].source || s[1]).join(''))
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
                  new RegExp(currentReplacement.replacement, 'g'),
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
