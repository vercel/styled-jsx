import { processTaggedTemplateExpression } from './babel-external'
import {
  setStateOptions,
  createReactComponentImportDeclaration
} from './_utils'
import { STYLE_COMPONENT } from './_constants'

export default ({ createMacro, MacroError }) => {
  return createMacro(styledJsxMacro)

  function styledJsxMacro({ references, state }) {
    setStateOptions(state)

    // Holds a reference to all the lines where strings are tagged using the `css` tag name.
    // We print a warning at the end of the macro in case there is any reference to css,
    // because `css` is generally used as default import name for 'styled-jsx/css'.
    // People who want to migrate from this macro to pure styled-jsx might have name conflicts issues.
    const cssReferences = []

    // references looks like this
    // {
    //    default: [path, path],
    //    resolve: [path],
    // }
    Object.keys(references).forEach(refName => {
      // Enforce `resolve` as named import so people
      // can only import { resolve } from 'styled-jsx/macro'
      // or an alias of it eg. { resolve as foo }
      if (refName !== 'default' && refName !== 'resolve') {
        throw new MacroError(
          `Imported an invalid named import: ${refName}. Please import: resolve`
        )
      }

      // Start processing the references for refName
      references[refName].forEach(path => {
        // We grab the parent path. Eg.
        // path -> css
        // path.parenPath -> css`div { color: red }`
        let templateExpression = path.parentPath

        // templateExpression member expression?
        // path -> css
        // path.parentPath -> css.resolve
        if (templateExpression.isMemberExpression()) {
          // grab .resolve
          const tagPropertyName = templateExpression.get('property').node.name
          // Member expressions are only valid on default imports
          // eg. import css from 'styled-jsx/macro'
          if (refName !== 'default') {
            throw new MacroError(
              `Can't use named import ${
                path.node.name
              } as a member expression: ${
                path.node.name
              }.${tagPropertyName}\`div { color: red }\` Please use it directly: ${
                path.node.name
              }\`div { color: red }\``
            )
          }

          // Otherwise enforce `css.resolve`
          if (tagPropertyName !== 'resolve') {
            throw new MacroError(
              `Using an invalid tag: ${tagPropertyName}. Please use ${
                templateExpression.get('object').node.name
              }.resolve`
            )
          }

          // Grab the TaggedTemplateExpression
          // i.e. css.resolve`div { color: red }`
          templateExpression = templateExpression.parentPath
        } else {
          if (refName === 'default') {
            const { name } = path.node
            throw new MacroError(
              `Can't use default import directly eg. ${name}\`div { color: red }\`. Please use ${name}.resolve\`div { color: red }\` instead.`
            )
          }

          if (path.node.name === 'css') {
            // If the path node name is `css` we push it to the references above to emit a warning later.
            cssReferences.push(path.node.loc.start.line)
          }
        }

        if (!state.styleComponentImportName) {
          const programPath = path.findParent(p => p.isProgram())
          state.styleComponentImportName = programPath.scope.generateUidIdentifier(
            STYLE_COMPONENT
          ).name
          const importDeclaration = createReactComponentImportDeclaration(state)
          programPath.unshiftContainer('body', importDeclaration)
        }

        // Finally transform the path :)
        processTaggedTemplateExpression({
          type: 'resolve',
          path: templateExpression,
          file: state.file,
          splitRules:
            typeof state.opts.optimizeForSpeed === 'boolean'
              ? state.opts.optimizeForSpeed
              : process.env.NODE_ENV === 'production',
          plugins: state.plugins,
          vendorPrefixes: state.opts.vendorPrefixes,
          sourceMaps: state.opts.sourceMaps,
          styleComponentImportName: state.styleComponentImportName
        })
      })
    })

    if (cssReferences.length > 0) {
      console.warn(
        `styled-jsx - Warning - We detected that you named your tag as \`css\` at lines: ${cssReferences.join(
          ', '
        )}.\n` +
          'This tag name is usually used as default import name for `styled-jsx/css`.\n' +
          'Porting macro code to pure styled-jsx in the future might be a bit problematic.'
      )
    }
  }
}
