import jsx from 'babel-plugin-syntax-jsx'
import murmurHash from '../lib/murmurhash2'
import transform from '../lib/style-transform'

const STYLE_ATTRIBUTE = 'jsx'
const MARKUP_ATTRIBUTE = 'data-jsx'
const INJECT_METHOD = '_jsxStyleInject'

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

  return {
    inherits: jsx,
    visitor: {
      JSXOpeningElement(path, state) {
        // if we don't have JSX styles
        // we can't do much here
        if (!state.hasJSXStyle) {
          return
        }

        if (state.ignoreClosing === null) {
          // this flag has a two-fold purpose:
          // - ignore the opening tag of the parent element
          //   of the style tag, since we don't want to add
          //   the attribute to that one
          // - keep a counter of elements inside so that we
          //   can keep track of when we exit the parent
          //   to reset state
          state.ignoreClosing = 1
          return
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
            t.JSXExpressionContainer(t.stringLiteral(state.jsxId))
          )
          el.attributes.push(attr)
        }

        state.ignoreClosing++
        // next visit will be: JSXElement exit()
      },

      // The JSXElement visitor collects JSX styles
      // when it enters a component
      // and replaces <style jsx>
      // with an inject call (INJECT_METHOD) when it leaves

      JSXElement: {
        enter(path, state) {
          // if we already found JSX styles
          // then our job is done here
          if (state.hasJSXStyle !== null) {
            return
          }

          const styles = findStyles(path.node.children)

          if (styles.length === 0) {
            state.hasJSXStyle = false
            return
          }

          state.jsxId = ''
          state.styles = []

          for (const style of styles) {
            if (style.children.length !== 1) {
              throw path.buildCodeFrameError(`Expected a child under ` +
                `JSX Style tag, but got ${style.children.length} ` +
                `(eg: <style jsx>{\`hi\`}</style>)`)
            }

            const child = style.children[0]

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
            const styleId = String(murmurHash(styleText))
            state.styles.push([
              styleId,
              styleText
            ])
          }

          state.jsxId += murmurHash(state.styles.map(s => s[1]).join(''))
          state.hasJSXStyle = true
          state.file.hasJSXStyle = true

          // now we go deeper
          // the next visit will be: JSXOpeningElement
        },
        exit(path, state) {
          // if we are leaving the component's root node
          // we reset hasJSXStyle
          if (state.hasJSXStyle && !--state.ignoreClosing) {
            state.hasJSXStyle = null
          }

          const el = path.node.openingElement
          if (!state.styles || !(el.name && el.name.name === 'style')) {
            return
          }

          // replace <style jsx> with an inject call (INJECT_METHOD)

          const [id, css] = state.styles.shift()
          path.replaceWith(
            t.JSXExpressionContainer(
              t.callExpression(
                t.identifier(INJECT_METHOD),
                [
                  t.stringLiteral(id),
                  t.stringLiteral(transform(id, css))
                ]
              )
            )
          )
        }
      },
      Program: {
        enter(path, state) {
          state.ignoreClosing = null
          state.hasJSXStyle = null
          state.file.hasJSXStyle = false
        },
        exit({node, scope}, state) {
          if (!(state.file.hasJSXStyle && !scope.hasBinding(INJECT_METHOD))) {
            return
          }

          const importDeclaration = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(INJECT_METHOD))],
            t.stringLiteral('styled-jsx/inject')
          )

          node.body.unshift(importDeclaration)
        }
      }
    }
  }
}
