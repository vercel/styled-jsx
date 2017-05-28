import hash from 'string-hash'
import * as t from 'babel-types'

import transform from './lib/style-transform'
import { MARKUP_ATTRIBUTE_EXTERNAL } from './_constants'
import {
  getExpressionText,
  restoreExpressions,
  makeStyledJsxCss,
  isValidCss,
  makeSourceMapGenerator,
  addSourceMaps,
  combinePlugins
} from './_utils'

let plugins
const getCss = (path, validate = false) => {
  if (!path.isTemplateLiteral() && !path.isStringLiteral()) {
    return
  }
  const css = getExpressionText(path)
  if (validate && !isValidCss(css.modified || css)) {
    return
  }
  return css
}

const getStyledJsx = (css, opts, path) => {
  const commonHash = hash(css.modified || css)
  const globalHash = `1${commonHash}`
  const scopedHash = `2${commonHash}`
  let compiledCss
  let globalCss
  let scopedCss
  const prefix = `[${MARKUP_ATTRIBUTE_EXTERNAL}~="${scopedHash}"]`
  const isTemplateLiteral = Boolean(css.modified)

  if (opts.sourceMaps) {
    const generator = makeSourceMapGenerator(opts.file)
    const filename = opts.sourceFileName
    const offset = path.get('loc').node.start
    compiledCss = [/* global */ '', prefix].map(prefix =>
      addSourceMaps(
        transform(prefix, opts.plugins(css.modified || css), {
          generator,
          offset,
          filename,
          vendorPrefix: opts.vendorPrefix
        }),
        generator,
        filename
      )
    )
  } else {
    compiledCss = ['', prefix].map(prefix =>
      transform(prefix, opts.plugins(css.modified || css), {
        vendorPrefix: opts.vendorPrefix
      })
    )
  }
  globalCss = compiledCss[0]
  scopedCss = compiledCss[1]

  if (css.replacements) {
    globalCss = restoreExpressions(globalCss, css.replacements)
    scopedCss = restoreExpressions(scopedCss, css.replacements)
  }

  return {
    initial: makeStyledJsxCss(globalCss, isTemplateLiteral),
    hash: globalHash,
    scoped: makeStyledJsxCss(scopedCss, isTemplateLiteral),
    scopedHash
  }
}

const makeHashesAndScopedCssPaths = (identifierName, data) => {
  return Object.keys(data).map(key => {
    const value = typeof data[key] === 'object'
      ? data[key]
      : t.stringLiteral(data[key])

    return t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          t.identifier(identifierName),
          t.identifier(`__${key}`)
        ),
        value
      )
    )
  })
}

const defaultExports = (path, decl, opts) => {
  const identifierName = '__styledJsxDefaultExport'
  const css = getCss(decl, opts.validate)
  if (!css) {
    return
  }
  const { initial, hash, scoped, scopedHash } = getStyledJsx(css, opts, path)

  path.insertBefore(
    t.variableDeclaration('var', [
      t.variableDeclarator(
        t.identifier(identifierName),
        t.newExpression(t.identifier('String'), [initial])
      )
    ])
  )
  path.insertBefore(
    makeHashesAndScopedCssPaths(identifierName, {
      hash,
      scoped,
      scopedHash
    })
  )
  decl.replaceWithSourceString(identifierName)
}

export const exportDefaultDeclarationVisitor = (path, opts) => {
  defaultExports(path, path.get('declaration'), opts)
}

export const namedExportDeclarationVisitor = (path, opts) => {
  const decl = path.get('declaration')
  if (!t.isVariableDeclaration(decl)) {
    return
  }
  decl.get('declarations').forEach(decl => {
    const src = decl.get('init')
    const css = getCss(src, opts.validate)
    if (!css) {
      return
    }
    const { initial, hash, scoped, scopedHash } = getStyledJsx(css, opts, path)

    const identifierName = decl.get('id').node.name
    path.insertAfter(
      makeHashesAndScopedCssPaths(identifierName, {
        hash,
        scoped,
        scopedHash
      })
    )
    src.replaceWith(t.newExpression(t.identifier('String'), [initial]))
  })
}

export const moduleExportsVisitor = (path, opts) => {
  if (path.get('left').getSource() !== 'module.exports') {
    return
  }
  defaultExports(path, path.get('right'), opts)
}

const callVisitor = (visitor, path, state) => {
  const { file } = state
  const { opts } = file
  visitor(path, {
    validate: state.opts.validate || opts.validate,
    sourceMaps: state.opts.sourceMaps || opts.sourceMaps,
    sourceFileName: opts.sourceFileName,
    file,
    plugins,
    vendorPrefix: state.opts.vendorPrefix
  })
}

export default function() {
  return {
    visitor: {
      Program(path, state) {
        if (!plugins) {
          plugins = combinePlugins(state.opts.plugins, {
            sourceMaps: state.opts.sourceMaps || state.file.opts.sourceMaps,
            vendorPrefix: state.opts.vendorPrefix || true
          })
        }
      },
      ExportDefaultDeclaration(path, state) {
        callVisitor(exportDefaultDeclarationVisitor, path, state)
      },
      AssignmentExpression(path, state) {
        callVisitor(moduleExportsVisitor, path, state)
      },
      ExportNamedDeclaration(path, state) {
        callVisitor(namedExportDeclarationVisitor, path, state)
      }
    }
  }
}
