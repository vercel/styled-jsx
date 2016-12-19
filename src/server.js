import React from 'react'
import flush from './flush'

const {hasOwnProperty} = Object.prototype

export default function flushToReact() {
  const mem = flush()
  const arr = []
  for (const id in mem) {
    if (hasOwnProperty.call(mem, id)) {
      arr.push(React.createElement('style', {
        id: `__jsx-style-${id}`,
        // avoid warnings upon render with a key
        key: `__jsx-style-${id}`,
        dangerouslySetInnerHTML: {
          __html: mem[id]
        }
      }))
    }
  }
  return arr
}

export function flushToHTML() {
  const mem = flush()
  let html = ''
  for (const id in mem) {
    if (hasOwnProperty.call(mem, id)) {
      html += `<style id="__jsx-style-${id}">${mem[id]}</style>`
    }
  }
  return html
}
