import React from 'react'
import { globalStyleSheetRegistry } from './stylesheet-registry'

export {
  default as StyleSheetRegistry,
  StyleSheetRegistryContext,
  globalStyleSheetRegistry
} from './stylesheet-registry'

/**
 * Flush the registry to React <style /> elements.
 */
export default function flushToReact({
  nonce,
  registry = globalStyleSheetRegistry
} = {}) {
  return registry.flushRules().map(args => {
    const id = args[0]
    const css = args[1]
    return React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      nonce,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}

/**
 * Flush the registry to an HTML string containing <style /> elements.
 */
export function flushToHTML({
  nonce,
  registry = globalStyleSheetRegistry
} = {}) {
  return registry.flushRules().reduce((html, args) => {
    const id = args[0]
    const css = args[1]
    const nonceAttr = nonce ? ` nonce="${nonce}"` : ''
    html += `<style id="__${id}"${nonceAttr}>${css}</style>`
    return html
  }, '')
}
