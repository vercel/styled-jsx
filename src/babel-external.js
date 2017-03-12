import hash from 'string-hash'

import transform from '../lib/style-transform'
import {
  getExpressionText,
  restoreExpressions,
  makeStyledJsxCss
} from './_utils'

export const exportDefaultDeclarationVisitor = ({
  path: entryPath,
  styleId,
  types: t
}) => {
  const path = entryPath.get('declaration')
  if (!path.isTemplateLiteral() || path.isStringLiteral()) {
    return
  }
  const css = getExpressionText(path)
  const isTemplateLiteral = css.modified
  let globalCss = css.modified || css

  let localCss = transform({
    id: String(styleId),
    styles: css.modified || css,
    isExternal: true
  })

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

  // TODO add source maps support

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

export default function ({types}) {
  return {
    visitor: {
      ExportDefaultDeclaration(path, state) {
        exportDefaultDeclarationVisitor({
          path,
          styleId: hash(require.resolve(state.file.opts.filename)),
          types
        })
      }
    }
  }
}
