import entries from 'object.entries'
import memory from './memory'

const {hasOwnProperty} = Object.prototype
const tags = {}
let prevStyles = {}

export default typeof window === 'undefined' ? renderOnServer : renderOnClient

function renderOnServer(components) {
  for (const {props} of components) {
    memory[props['data-jsx']] = props.css
  }
}

function renderOnClient(components) {
  const styles = {}
  for (const c of components) {
    styles[c.props['data-jsx']] = c
  }

  patch(diff(prevStyles, styles))

  prevStyles = styles
}

function diff(a, b) {
  const added = entries(b).filter(([k]) => !hasOwnProperty.call(a, k))
  const removed = entries(a).filter(([k]) => !hasOwnProperty.call(b, k))
  return [added, removed]
}

function patch([added, removed]) {
  for (const [id, c] of added) {
    tags[id] = makeStyleTag(c.props.css)
  }

  for (const [id] of removed) {
    const t = tags[id]
    delete tags[id]
    t.parentNode.removeChild(t)
  }
}

function makeStyleTag(str) {
  // based on implementation by glamor
  const tag = document.createElement('style')

  tag.type = 'text/css'
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
