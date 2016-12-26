import entries from 'object.entries'

const {hasOwnProperty} = Object.prototype
const tags = {}
let prevStyles = {}

export default typeof window === 'undefined' ? renderOnServer : renderOnClient

function renderOnServer() {}

function renderOnClient(components) {
  const styles = {}
  for (const c of components) {
    styles[c.props.styleId] = c
  }

  patch(diff(prevStyles, styles))

  prevStyles = styles
}

function diff(a, b) {
  const added = entries(b).filter(([k]) => !hasOwnProperty.call(a, k))
  const removed = entries(a).filter(([k]) => !hasOwnProperty.call(b, k))
  return [added, removed]
}

const fromServer = {}

function patch([added, removed]) {
  for (const [id, c] of added) {
    // avoid duplicates from server-rendered markup
    if (undefined === fromServer[id]) {
      fromServer[id] = document.getElementById(`__jsx-style-${id}`)
    }

    tags[id] = fromServer[id] || makeStyleTag(c.props.css)
  }

  for (const [id] of removed) {
    const t = tags[id]
    delete tags[id]
    t.parentNode.removeChild(t)
    // avoid checking the DOM later on
    fromServer[id] = null
  }
}

function makeStyleTag(str) {
  // based on implementation by glamor
  const tag = document.createElement('style')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
