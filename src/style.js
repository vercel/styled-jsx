import { useLayoutEffect } from 'react'
import { useStyleRegistry } from './stylesheet-registry'
import { computeId } from './lib/hash'
export default function JSXStyle(props) {
  const registry = useStyleRegistry()

  // If `registry` does not exist, we do nothing here.
  if (!registry) {
    return null
  }

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
