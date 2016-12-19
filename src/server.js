import React from 'react'
import flush from './flush'

export default function flushToReact () {
  const mem = flush()
  const arr = []
  for (const id in mem) {
    arr.push(React.createElement('style', {
      id: `__jsx-style-${id}`,
      // avoid warnings upon render with a key
      key: `__jsx-style-${id}`,
      dangerouslySetInnerHTML: {
        __html: mem[id]
      }
    }))
  }
  return arr
}

export function flushToHTML () {
  const mem = flush()
  let html = ''
  for (const id in mem) {
    html += `<style id="__jsx-style-${id}">${mem[id]}</style>`
  }
  return html
}
