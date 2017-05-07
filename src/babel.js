// Packages
import jsx from 'babel-plugin-syntax-jsx'
import hash from 'string-hash'

// Ours
import transform from '../lib/style-transform'
import {
  exportDefaultDeclarationVisitor,
  namedExportDeclarationVisitor,
  moduleExportsVisitor
} from './babel-external'

import {
  isGlobalEl,
  isStyledJsx,
  findStyles,
  getExpressionText,
  restoreExpressions,
  makeStyledJsxTag,
  validateExpression,
  isExpressionImported,
  resolvePath,
  generateAttribute,
  makeSourceMapGenerator,
  addSourceMaps
} from './_utils'

import {
  MARKUP_ATTRIBUTE,
  STYLE_COMPONENT,
  MARKUP_ATTRIBUTE_EXTERNAL
} from './_constants'

const getPrefix = id => `[${MARKUP_ATTRIBUTE}="${id}"]`
const callExternalVisitor = (visitor, path, state) => {
  const {file} = state
  const {opts} = file
  visitor(path, {
    validate: true,
    sourceMaps: opts.sourceMaps,
    sourceFileName: opts.sourceFileName,
    file,
  })
}

export default function ({types: t}) {
  return {
    inherits: jsx,
    visitor: {
      ImportDefaultSpecifier(path, state) {
        state.imports.push(path.get('local').node.name)
      },
      ImportSpecifier(path, state) {
        state.imports.push((path.get('local') || path.get('imported')).node.name)
      },
      VariableDeclarator(path, state) {
        const subpath = path.get('init')
        if (
          !subpath.isCallExpression() ||
          subpath.get('callee').node.name !== 'require'
        ) {
          return
        }
        state.imports.push(path.get('id').node.name)
      },
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
            if (
              name === MARKUP_ATTRIBUTE || name.name === MARKUP_ATTRIBUTE ||
              name === MARKUP_ATTRIBUTE_EXTERNAL || name.name === MARKUP_ATTRIBUTE_EXTERNAL
            ) {
              // avoid double attributes
              return
            }
          }

          if (state.jsxId) {
            el.attributes.push(
              generateAttribute(MARKUP_ATTRIBUTE, t.numericLiteral(state.jsxId))
            )
          }

          if (state.externalJsxId) {
            el.attributes.push(
              generateAttribute(MARKUP_ATTRIBUTE_EXTERNAL, state.externalJsxId)
            )
          }
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
          state.externalStyles = []

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
                `JSX Style tag, but got ${children.length} ` +
                `(eg: <style jsx>{\`hi\`}</style>)`)
            }

            const child = children[0]

            if (!t.isJSXExpressionContainer(child)) {
              throw path.buildCodeFrameError(`Expected a child of ` +
                `type JSXExpressionContainer under JSX Style tag ` +
                `(eg: <style jsx>{\`hi\`}</style>), got ${child.type}`)
            }

            const expression = child.get('expression')

            if (t.isIdentifier(expression)) {
              const idName = expression.node.name
              if (state.imports.indexOf(idName) !== -1) {
                const id = t.identifier(idName)
                const isGlobal = isGlobalEl(style.get('openingElement').node)
                state.externalStyles.push([
                  t.memberExpression(
                    id,
                    t.identifier(isGlobal ? '__hash' : '__scopedHash')
                  ),
                  id,
                  isGlobal
                ])
                continue
              }

              throw path.buildCodeFrameError(`The Identifier ` +
                `\`${expression.getSource()}\` is either \`undefined\` or ` +
                `it is not an external StyleSheet reference i.e. ` +
                `it doesn't come from an \`import\` or \`require\` statement`)
            }

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

          if (state.externalStyles.length > 0) {
            const expressions = state.externalStyles
              // remove globals
              .filter(s => !s[2])
              .map(s => s[0])

            // construct a template literal of this form:
            // `${styles.__scopedHash} ${otherStyles.__scopedHash}`
            state.externalJsxId = expressions.length === 1
              ? expressions[0]
              : t.templateLiteral(
                  [t.templateElement({raw: '', coocked: ''})]
                    .concat([...new Array(expressions.length - 1)].map(e => t.templateElement({raw: ' ', coocked: ' '})))
                    .concat([t.templateElement({raw: '', coocked: ''}, true)])
                  ,
                  expressions
                )
          }

          if (state.styles.length > 0) {
            state.jsxId = hash(state.styles.map(s => s[1].source || s[1]).join(''))
          }

          state.hasJSXStyle = true
          state.file.hasJSXStyle = true
          // next visit will be: JSXOpeningElement
        },
        exit(path, state) {
          const isGlobal = isGlobalEl(path.node.openingElement)

          if (state.hasJSXStyle && !--state.ignoreClosing && !isGlobal) {
            state.hasJSXStyle = null
            state.jsxId = null
            state.externalJsxId = null
          }

          if (!state.hasJSXStyle || !isStyledJsx(path)) {
            return
          }

          if (
            state.externalStyles.length > 0 &&
            path.get('children')[0].get('expression').isIdentifier()
          ) {
            const [
              id,
              externalStylesReference,
              isGlobal
            ] = state.externalStyles.shift()

            path.replaceWith(
              makeStyledJsxTag(
                id,
                isGlobal
                  ? externalStylesReference
                  : t.memberExpression(
                      t.identifier(externalStylesReference.name),
                      t.identifier('__scoped')
                    )
              )
            )
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
            const generator = makeSourceMapGenerator(state.file)
            const filename = state.file.opts.sourceFileName
            transformedCss = addSourceMaps(
              transform(
                getPrefix(state.jsxId),
                css.modified || css,
                {
                  generator,
                  offset: loc.start,
                  filename
                }
              ),
              generator,
              filename
            )
          } else {
            transformedCss = transform(
              getPrefix(state.jsxId),
              css.modified || css
            )
          }

          if (css.replacements) {
            transformedCss = restoreExpressions(
              transformedCss,
              css.replacements
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
          state.imports = []
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
      },
      // Transpile external StyleSheets
      ExportDefaultDeclaration(path, state) {
        callExternalVisitor(exportDefaultDeclarationVisitor, path, state)
      },
      AssignmentExpression(path, state) {
        callExternalVisitor(moduleExportsVisitor, path, state)
      },
      ExportNamedDeclaration(path, state) {
        callExternalVisitor(namedExportDeclarationVisitor, path, state)
      }
    }
  }
}
