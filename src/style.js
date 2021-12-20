import React from 'react'
import { useStyleRegistry, createStyleRegistry } from './stylesheet-registry'
import { computeId } from './lib/hash'

// Opt-into the new `useInsertionEffect` API in React 18, fallback to `useLayoutEffect`.
// https://github.com/reactwg/react-18/discussions/110
const useInsertionEffect = React.useInsertionEffect || React.useLayoutEffect

const defaultRegistry =
  typeof window !== 'undefined' ? createStyleRegistry() : undefined
export default function JSXStyle(props) {
  const registry = defaultRegistry ? defaultRegistry : useStyleRegistry()

  // If `registry` does not exist, we do nothing here.
  if (!registry) {
    return null
  }

  if (typeof window === 'undefined') {
    registry.add(props)
    return null
  }

  useInsertionEffect(() => {
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
