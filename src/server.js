import React from 'react'
import { flush } from './style'

export default function flushToReact() {
  const mem = flush()
  const arr = []
  for (const [id, css, nonce] of mem) {
    const createElementOptions = {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      dangerouslySetInnerHTML: {
        __html: css
      }
    }
    if (nonce) {
      createElementOptions.nonce = nonce
    }
    arr.push(
      React.createElement('style', createElementOptions)
    )
  }
  return arr
}

export function flushToHTML() {
  const mem = flush()
  let html = ''
  for (const [id, css, nonce] of mem) {
    let styleTag = `<style id="__${id}">`
    if (nonce) {
      styleTag = `<style id="__${id}" nonce="${nonce}">
    }
    html += `${styleTag}${css}</style>`
  }
  return html
}
