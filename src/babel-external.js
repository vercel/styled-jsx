import hash from 'string-hash'

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

const visitor = ({
  path,
  styleId,
  types: t,
  validate = false,
  state
}) => {
  if (!path.isTemplateLiteral() && !path.isStringLiteral()) {
    return
  }
  const css = getExpressionText(path)
  const prefix = `[${MARKUP_ATTRIBUTE_EXTERNAL}~="${styleId}"]`
  const isTemplateLiteral = Boolean(css.modified)
  const useSourceMaps = Boolean(state.file.opts.sourceMaps)

  let globalCss = css.modified || css

  if (validate && !isValidCss(globalCss)) {
    return
  }

  let localCss

  if (useSourceMaps) {
    const generator = makeSourceMapGenerator(state.file)
    const filename = state.file.opts.sourceFileName
    const offset = path.get('loc').node.start
    localCss = addSourceMaps(
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
    localCss = transform(
      prefix,
      css.modified || css
    )
  }

  if (css.replacements) {
    globalCss = restoreExpressions(
      globalCss,
      css.replacements
    )
    localCss = restoreExpressions(
      localCss,
      css.replacements
    )
  }

  path.replaceWith(
    t.objectExpression([
      t.objectProperty(
        t.identifier('global'),
        makeStyledJsxCss(globalCss, isTemplateLiteral)
      ),
      t.objectProperty(
        t.identifier('local'),
        makeStyledJsxCss(localCss, isTemplateLiteral)
      )
    ])
  )
}

export const exportDefaultDeclarationVisitor = ({path, ...rest}) => (
  visitor({
    path: path.get('declaration'),
    ...rest
  })
)

export const moduleExportsVisitor = ({path, ...rest}) => (
  visitor({
    path: path.get('right'),
    ...rest
  })
)

export default function ({types}) {
  return {
    visitor: {
      ExportDefaultDeclaration(path, state) {
        exportDefaultDeclarationVisitor({
          path,
          styleId: hash(state.file.opts.filename),
          types,
          state
        })
      },
      AssignmentExpression(path, state) {
        if (path.get('left').getSource() !== 'module.exports') {
          return
        }
        moduleExportsVisitor({
          path,
          styleId: hash(state.file.opts.filename),
          types,
          state
        })
      }
    }
  }
}
