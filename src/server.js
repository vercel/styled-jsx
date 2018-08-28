import React from 'react'
import { flush } from './style'

export default function flushToReact(nonce) {
  return flush().map(args => {
    const id = args[0]
    const css = args[1]
    return React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      nonce: nonce ? nonce : undefined,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}

export function flushToHTML(nonce) {
  return flush().reduce((html, args) => {
    const id = args[0]
    const css = args[1]
    html += `<style id="__${id}"${
      nonce ? ` nonce="${nonce}"` : ''
    }>${css}</style>`
    return html
  }, '')
}
