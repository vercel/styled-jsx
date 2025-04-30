import React, { useLayoutEffect, useRef } from 'react'
import { useStyleRegistry, createStyleRegistry } from './stylesheet-registry'
import { computeId } from './lib/hash'

// Opt-into the new `useInsertionEffect` API in React 18, fallback to `useLayoutEffect`.
// https://github.com/reactwg/react-18/discussions/110
const useInsertionEffect = React.useInsertionEffect || useLayoutEffect

const defaultRegistry =
  typeof window !== 'undefined' ? createStyleRegistry() : undefined
export default function JSXStyle(props) {
  const registry = defaultRegistry ? defaultRegistry : useStyleRegistry()
  const insertionEffectCalled = useRef(false)

  // `registry` might not exist while server-side rendering
  if (!registry) {
    return null
  }

  if (typeof window === 'undefined') {
    registry.add(props)
    return null
  }

  useInsertionEffect(() => {
    // ReactDOM removes all DOM during hydration in certain cases
    if (!document.head) {
      return
    }
    registry.add(props)
    insertionEffectCalled.current = true
    return () => {
      insertionEffectCalled.current = false
      registry.remove(props)
    }
  }, [props.id, String(props.dynamic)])

  useLayoutEffect(() => {
    if (!document.head || insertionEffectCalled.current) {
      return
    }
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
