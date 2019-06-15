import React from 'react'

const defaultInstance = {}

const methods = [
  'add',
  'remove',
  'update',
  'flush',
  'cssRules',
  'createComputeId',
  'createComputeSelector',
  'getIdAndRules',
  'selectFromServer'
]

methods.forEach(methodName => {
  defaultInstance[methodName] = () => {
    throw new Error(
      `StyleSheetRegistry.${methodName}: The style registry can no longer be referenced statically. You must wrap each render with a StyleSheetRegistryContext.Provider, and provide a unique registry for each render`
    )
  }
})

const StyleSheetRegistryContext = React.createContext(defaultInstance)

export default StyleSheetRegistryContext

export function wrapElementWithProvider(element, registry) {
  return React.createElement(
    StyleSheetRegistryContext.Provider,
    { value: registry },
    element
  )
}
