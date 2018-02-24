import * as t from 'babel-types'

import {
  getJSXStyleInfo,
  processCss,
  cssToBabelType,
  validateExternalExpressions,
  combinePlugins,
  booleanOption,
  getScope,
  computeClassNames,
  makeStyledJsxTag
} from './_utils'

const isModuleExports = t.buildMatchMemberExpression('module.exports')

function processTaggedTemplateExpression({
  type,
  path,
  fileInfo,
  splitRules,
  plugins,
  vendorPrefix
}) {
  const templateLiteral = path.get('quasi')
  let scope

  // Check whether there are undefined references or
  // references to this.something (e.g. props or state).
  // We allow dynamic styles only when resolving styles.
  if (type !== 'resolve') {
    validateExternalExpressions(templateLiteral)
  } else if (!path.scope.path.isProgram()) {
    scope = getScope(path)
  }

  const stylesInfo = getJSXStyleInfo(templateLiteral, scope)

  const { staticClassName, className } = computeClassNames([stylesInfo])

  const styles = processCss(
    {
      ...stylesInfo,
      staticClassName,
      fileInfo,
      isGlobal: type === 'global',
      plugins,
      vendorPrefix
    },
    { splitRules }
  )

  if (type === 'resolve') {
    const {hash, css, expressions} = styles
    path.replaceWith(
      // {
      //   styles: <_JSXStyle ... />,
      //   className: 'jsx-123'
      // }
      t.objectExpression([
        t.objectProperty(t.identifier('styles'), makeStyledJsxTag(hash, css, expressions)),
        t.objectProperty(t.identifier('className'), className)
      ])
    )
    return
  }

  const id = path.parentPath.node.id
  const baseExportName = id ? id.name : 'default'
  let parentPath =
    baseExportName === 'default'
      ? path.parentPath
      : path.findParent(
          path =>
            path.isVariableDeclaration() ||
            (path.isAssignmentExpression() &&
              isModuleExports(path.get('left').node))
        )

  if (baseExportName !== 'default' && !parentPath.parentPath.isProgram()) {
    parentPath = parentPath.parentPath
  }

  const css = cssToBabelType(styles.css)
  const newPath = t.isArrayExpression(css)
    ? css
    : t.newExpression(t.identifier('String'), [css])

  // default exports

  if (baseExportName === 'default') {
    const defaultExportIdentifier = path.scope.generateUidIdentifier(
      'defaultExport'
    )
    parentPath.insertBefore(
      t.variableDeclaration('const', [
        t.variableDeclarator(defaultExportIdentifier, newPath)
      ])
    )
    parentPath.insertBefore(addHash(defaultExportIdentifier, styles.hash))
    path.replaceWith(defaultExportIdentifier)
    return
  }

  // local and named exports

  parentPath.insertAfter(addHash(baseExportName, styles.hash))
  path.replaceWith(newPath)
}

function addHash(exportIdentifier, hash) {
  const value = typeof hash === 'string' ? t.stringLiteral(hash) : hash
  return t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(
        t.identifier(exportIdentifier),
        t.identifier('__hash')
      ),
      value
    )
  )
}

export const visitor = {
  ImportDeclaration(path, state) {
    // import css from 'styled-jsx/css'
    if (path.node.source.value !== 'styled-jsx/css') {
      return
    }

    // Find all the imported specifiers.
    // e.g import css, { global, resolve } from 'styled-jsx/css'
    // -> ['css', 'global', 'resolve']
    const specifiersNames = path.node.specifiers.map(
      specifier => specifier.local.name
    )
    specifiersNames.forEach(tagName => {
      // Get all the reference paths i.e. the places that use the tagName above
      // eg.
      // css`div { color: red }`
      // css.global`div { color: red }`
      // global`div { color: red `
      const binding = path.scope.getBinding(tagName)

      if (!binding || !Array.isArray(binding.referencePaths)) {
        return
      }

      // Produces an object containing all the TaggedTemplateExpression paths detected.
      // The object contains { scoped, global, resolve }
      const taggedTemplateExpressions = binding.referencePaths
        .map(ref => ref.parentPath)
        .reduce(
          (result, path) => {
            let taggedTemplateExpression
            if (path.isTaggedTemplateExpression()) {
              // css`` global`` resolve``
              taggedTemplateExpression = path
            } else if (
              path.parentPath &&
              path.isMemberExpression() &&
              path.parentPath.isTaggedTemplateExpression()
            ) {
              // This part is for css.global`` or css.resolve``
              // using the default import css
              taggedTemplateExpression = path.parentPath
            } else {
              return result
            }

            const tag = taggedTemplateExpression.get('tag')
            const id = tag.isIdentifier()
              ? tag.node.name
              : tag.get('property').node.name

            if (result[id]) {
              result[id].push(taggedTemplateExpression)
            } else {
              result.scoped.push(taggedTemplateExpression)
            }
            return result
          },
          {
            scoped: [],
            global: [],
            resolve: []
          }
        )

      if (Object.values(taggedTemplateExpressions).every(a => a.length === 0)) {
        return
      }

      const { vendorPrefix, sourceMaps } = state.opts

      Object.keys(taggedTemplateExpressions).forEach(type =>
        taggedTemplateExpressions[type].forEach(path =>
          // Process each css block
          processTaggedTemplateExpression({
            type,
            path,
            fileInfo: {
              file: state.file,
              sourceFileName: state.file.opts.sourceFileName,
              sourceMaps
            },
            splitRules:
              typeof state.opts.optimizeForSpeed === 'boolean'
                ? state.opts.optimizeForSpeed
                : process.env.NODE_ENV === 'production',
            plugins: state.plugins,
            vendorPrefix
          })
        )
      )
    })

    // Finally remove the import
    path.remove()
  }
}

export default function() {
  return {
    Program(path, state) {
      const vendorPrefix = booleanOption([
        state.opts.vendorPrefix,
        state.file.opts.vendorPrefix
      ])
      state.opts.vendorPrefix =
        typeof vendorPrefix === 'boolean' ? vendorPrefix : true
      const sourceMaps = booleanOption([
        state.opts.sourceMaps,
        state.file.opts.sourceMaps
      ])
      state.opts.sourceMaps = Boolean(sourceMaps)

      if (!state.plugins) {
        const { sourceMaps, vendorPrefix } = state.opts
        state.plugins = combinePlugins(state.opts.plugins, {
          sourceMaps: sourceMaps || state.file.opts.sourceMaps,
          vendorPrefix: typeof vendorPrefix === 'boolean' ? vendorPrefix : true
        })
      }
    },
    ...visitor
  }
}
