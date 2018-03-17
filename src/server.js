import React from 'react'
import { flush } from './style'

export default function flushToReact() {
  return flush().map(([id, css]) =>
    React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  )
}

export function flushToHTML() {
  return flush().reduce((html, [id, css]) => {
    html += `<style id="__${id}">${css}</style>`
    return html
  }, '')
}
