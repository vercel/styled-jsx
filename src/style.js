import { useLayoutEffect, useContext } from 'react'
import { StyleSheetContext } from './stylesheet-registry'
import { computeId } from './lib/hash'
export default function JSXStyle(props) {
  const registry = useContext(StyleSheetContext)
  if (typeof window === 'undefined') {
    registry.add(props)
    return null
  }
  useLayoutEffect(() => {
    registry.add(props)
    return () => {
      registry.remove(props)
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
      return computeId(baseId, props)
    })
    .join(' ')
}
