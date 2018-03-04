import { createMacro } from 'babel-plugin-macros'
import { processTaggedTemplateExpression } from './babel-external'
import { setStateOptions } from './_utils'

export default createMacro(styledJsxMacro)

function styledJsxMacro({ references, state }) {
  setStateOptions(state)

  Object.keys(references).forEach(key =>
    processTaggedTemplateExpression({
      type: 'resolve',
      path: references[key],
      fileInfo: {
        file: state.file,
        sourceFileName: state.file.opts.sourceFileName,
        sourceMaps: state.opts.sourceMaps
      },
      splitRules:
        typeof state.opts.optimizeForSpeed === 'boolean'
          ? state.opts.optimizeForSpeed
          : process.env.NODE_ENV === 'production',
      plugins: state.plugins,
      vendorPrefix: state.opts.vendorPrefixes
    })
  )
}
