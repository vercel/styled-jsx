import { useLayoutEffect } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default function JSXStyle(props) {
  if (typeof window === 'undefined') {
    styleSheetRegistry.add(props)
    return null
  }
  useLayoutEffect(() => {
    styleSheetRegistry.add(props)
    return () => {
      styleSheetRegistry.remove(props)
    }
    // props.children can be string[], will be striped since id is identical
  }, [props.id, String(props.dynamic)])
  return null
}

JSXStyle.dynamic = info => {
  return info
    .map(tagInfo => {
      const baseId = tagInfo[0]
      const props = tagInfo[1]
      return styleSheetRegistry.computeId(baseId, props)
    })
    .join(' ')
}

export function flush() {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}
