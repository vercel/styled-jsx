import hash from 'string-hash'
import * as t from 'babel-types'

import transform from '../lib/style-transform'
import {MARKUP_ATTRIBUTE_EXTERNAL} from './_constants'
import {
  getExpressionText,
  restoreExpressions,
  makeStyledJsxCss,
  isValidCss,
  makeSourceMapGenerator,
  addSourceMaps
} from './_utils'

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
  const useSourceMaps = Boolean(opts.sourceMaps)
  let globalCss = css.modified || css
  const commonHash = hash(globalCss)
  const globalHash = `1${commonHash}`
  const scopedHash = `2${commonHash}`
  let scopedCss
  const prefix = `[${MARKUP_ATTRIBUTE_EXTERNAL}~="${scopedHash}"]`
  const isTemplateLiteral = Boolean(css.modified)

  if (useSourceMaps) {
    const generator = makeSourceMapGenerator(opts.file)
    const filename = opts.sourceFileName
    const offset = path.get('loc').node.start
    scopedCss = addSourceMaps(
      transform(
        prefix,
        css.modified || css,
        {
          generator,
          offset,
          filename
        }
      ),
      generator,
      filename
    )
  } else {
    scopedCss = transform(
      prefix,
      css.modified || css
    )
  }

  if (css.replacements) {
    globalCss = restoreExpressions(
      globalCss,
      css.replacements
    )
    scopedCss = restoreExpressions(
      scopedCss,
      css.replacements
    )
  }

  return {
    initial: makeStyledJsxCss(globalCss, isTemplateLiteral),
    hash: globalHash,
    scoped: makeStyledJsxCss(scopedCss, isTemplateLiteral),
    scopedHash
  }
}

const makeHashesAndScopedCssPaths = (identifierName, data) => {
  return Object.keys(data).map(
    key => {
      const value = (
        typeof data[key] === 'object' ?
        data[key] :
        t.stringLiteral(data[key])
      )

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
    }
  )
}

const defaultExports = (path, decl, opts) => {
  const identifierName = '__styledJsxDefaultExport'
  const css = getCss(decl, opts.validate)
  if (!css) {
    return
  }
  const {
    initial,
    hash,
    scoped,
    scopedHash
  } = getStyledJsx(css, opts, path)

  path.insertBefore(
    t.variableDeclaration(
      'var',
      [t.variableDeclarator(
        t.identifier(identifierName),
        t.newExpression(
          t.identifier('String'),
          [initial]
        )
      )]
    )
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
  decl.get('declarations').forEach(
    decl => {
      const src = decl.get('init')
      const css = getCss(src, opts.validate)
      if (!css) {
        return
      }
      const {
        initial,
        hash,
        scoped,
        scopedHash
      } = getStyledJsx(css, opts)

      const identifierName = decl.get('id').node.name
      path.insertAfter(
        makeHashesAndScopedCssPaths(identifierName, {
          hash,
          scoped,
          scopedHash
        })
      )
      src.replaceWith(
        t.newExpression(
          t.identifier('String'),
          [initial]
        )
      )
    }
  )
}

export const moduleExportsVisitor = (path, opts) => {
  if (path.get('left').getSource() !== 'module.exports') {
    return
  }
  defaultExports(path, path.get('right'), opts)
}

const callVisitor = (visitor, path, state) => {
  const {file} = state
  const {opts} = file
  visitor(path, {
    validate: opts.validate,
    sourceMaps: opts.sourceMaps,
    sourceFileName: opts.sourceFileName,
    file
  })
}

export default function () {
  return {
    visitor: {
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
