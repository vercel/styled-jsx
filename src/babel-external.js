import * as t from 'babel-types'

import {
  getJSXStyleInfo,
  processCss,
  cssToBabelType,
  validateExternalExpressions,
  combinePlugins,
  booleanOption
} from './_utils'

const isModuleExports = t.buildMatchMemberExpression('module.exports')

function processTaggedTemplateExpression({
  path,
  fileInfo,
  splitRules,
  plugins,
  vendorPrefix
}) {
  const templateLiteral = path.get('quasi')

  // Check whether there are undefined references or references to this.something (e.g. props or state)
  validateExternalExpressions(templateLiteral)

  const stylesInfo = getJSXStyleInfo(templateLiteral)

  const globalStyles = processCss(
    {
      ...stylesInfo,
      hash: `${stylesInfo.hash}0`,
      fileInfo,
      isGlobal: true,
      plugins,
      vendorPrefix
    },
    { splitRules }
  )

  const scopedStyles = processCss(
    {
      ...stylesInfo,
      hash: `${stylesInfo.hash}1`,
      fileInfo,
      isGlobal: false,
      plugins,
      vendorPrefix
    },
    { splitRules }
  )

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

  const hashesAndScoped = {
    hash: globalStyles.hash,
    scoped: cssToBabelType(scopedStyles.css),
    scopedHash: scopedStyles.hash
  }

  const globalCss = cssToBabelType(globalStyles.css)

  // default exports

  if (baseExportName === 'default') {
    const defaultExportIdentifier = path.scope.generateUidIdentifier(
      'defaultExport'
    )
    parentPath.insertBefore(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          defaultExportIdentifier,
          t.isArrayExpression(globalCss)
            ? globalCss
            : t.newExpression(t.identifier('String'), [globalCss])
        )
      ])
    )
    parentPath.insertBefore(
      makeHashesAndScopedCssPaths(defaultExportIdentifier, hashesAndScoped)
    )
    path.replaceWith(defaultExportIdentifier)
    return
  }

  // named exports

  parentPath.insertAfter(
    makeHashesAndScopedCssPaths(t.identifier(baseExportName), hashesAndScoped)
  )
  path.replaceWith(
    t.isArrayExpression(globalCss)
      ? globalCss
      : t.newExpression(t.identifier('String'), [globalCss])
  )
}

function makeHashesAndScopedCssPaths(exportIdentifier, data) {
  return Object.keys(data).map(key => {
    const value =
      typeof data[key] === 'string' ? t.stringLiteral(data[key]) : data[key]

    return t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(exportIdentifier, t.identifier(`__${key}`)),
        value
      )
    )
  })
}

export const visitor = {
  ImportDeclaration(path, state) {
    if (path.node.source.value !== 'styled-jsx/css') {
      return
    }

    const tagName = path.node.specifiers[0].local.name
    const binding = path.scope.getBinding(tagName)

    if (!binding || !Array.isArray(binding.referencePaths)) {
      return
    }

    const taggedTemplateExpressions = binding.referencePaths
      .map(ref => ref.parentPath)
      .reduce((result, path) => {
        let taggedTemplateExpression
        if (path.isTaggedTemplateExpression()) {
          taggedTemplateExpression = path
        } else if (path.parentPath && path.isMemberExpression() && path.parentPath.isTaggedTemplateExpression()) {
          taggedTemplateExpression = path.parentPath
        } else {
          return result
        }

        const tag = taggedTemplateExpression.get('tag')
        const id = tag.isIdentifier() ? tag.node.name : tag.get('property').node.name

        if (result[id]) {
          result[id].push(taggedTemplateExpression)
        } else {
          result.scoped.push(taggedTemplateExpression)
        }
        return result
      }, {
        scoped: [],
        global: [],
        resolve: [],
      })

    if (Object.values(taggedTemplateExpressions).every(a => a.length === 0)) {
      return
    }

    const { vendorPrefix, sourceMaps } = state.opts

    Object.keys(taggedTemplateExpressions).forEach(type => {
      processTaggedTemplateExpression({
        type,
        path: taggedTemplateExpressions[type],
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
