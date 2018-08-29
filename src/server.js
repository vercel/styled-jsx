import React from 'react'
import { flush } from './style'

export default function flushToReact(options = {}) {
  return flush().map(args => {
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

export function flushToHTML(options = {}) {
  return flush().reduce((html, args) => {
    const id = args[0]
    const css = args[1]
    html += `<style id="__${id}"${
      options.nonce ? ` nonce="${options.nonce}"` : ''
    }>${css}</style>`
    return html
  }, '')
}
