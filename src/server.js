import React from 'react'
import StylesheetRegistryContext from './stylesheet-registry-context'
import StylesheetRegistry from './stylesheet-registry'

function flush(styleSheetRegistry) {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}

export default function flushToReact(registry, options = {}) {
  return flush(registry).map(args => {
    const id = args[0]
    const css = args[1]
    return React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      nonce: options.nonce ? options.nonce : undefined,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}

export function flushToHTML(registry, options = {}) {
  return flush(registry).reduce((html, args) => {
    const id = args[0]
    const css = args[1]
    html += `<style id="__${id}"${
      options.nonce ? ` nonce="${options.nonce}"` : ''
    }>${css}</style>`
    return html
  }, '')
}

export function wrapWithProvider(element, registry) {
  return React.createElement(
    StylesheetRegistryContext.Provider,
    { value: registry },
    element
  )
}

export function callDomServerMethod(reactDomServer, method, element) {
  const registry = new StylesheetRegistry()
  const wrapped = wrapWithProvider(element, registry)
  const result = reactDomServer[method](wrapped)
  return { result, registry }
}

export function renderToString(server, element) {
  return callDomServerMethod(server, 'renderToString', element)
}

export function renderToStaticMarkup(server, element) {
  return callDomServerMethod(server, 'renderToStaticMarkup', element)
}

export function renderToNodeStream(server, element) {
  return callDomServerMethod(server, 'renderToNodeStream', element)
}

export function renderToStaticNodeStream(server, element) {
  return callDomServerMethod(server, 'renderToStaticNodeStream', element)
}

export function wrapServer(server) {
  return {
    renderToString(element) {
      return renderToString(server, element)
    },

    renderToStaticMarkup(element) {
      return renderToStaticMarkup(server, element)
    },

    renderToNodeStream(element) {
      renderToNodeStream(server, element)
    },

    renderToStaticNodeStream(element) {
      renderToStaticNodeStream(server, element)
    }
  }
}
