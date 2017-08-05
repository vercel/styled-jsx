const tags = new Map()
let prevStyles = new Map()

export default (typeof window === 'undefined' ? renderOnServer : renderOnClient)

function renderOnServer() {}

function renderOnClient(styles) {
  patch(diff(prevStyles, styles))
  prevStyles = styles
}

function diff(a, b) {
  const added = Array.from(b).filter(([k]) => !a.has(k))
  const removed = Array.from(a).filter(([k]) => !b.has(k))
  return [added, removed]
}

const fromServer = new Map()

function patch([added, removed]) {
  let styles
  let id
  let css
  let i = 0
  let len = added.length
  for (;i < len;i++) {
    styles = added[i]
    id = styles[0]
    css = styles[1]
    // Avoid duplicates from server-rendered markup
    if (!fromServer.has(id)) {
      fromServer.set(id, document.getElementById(`__jsx-style-${id}`))
    }

    const tag = fromServer.get(id) || makeStyleTag(css)
    tags.set(id, tag)
  }

  id = undefined
  i = 0
  len = removed.length

  for (;i < len; i++) {
    id = removed[i][0]
    const t = tags.get(id)
    tags.delete(id)
    t.parentNode.removeChild(t)
    // Avoid checking the DOM later on
    fromServer.delete(id)
  }
}

function makeStyleTag(str) {
  // Based on implementation by glamor
  const tag = document.createElement('style')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
