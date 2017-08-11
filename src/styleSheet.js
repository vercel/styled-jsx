import hashString from 'string-hash'

const isBrowser = typeof window !== 'undefined'
function noop() {}

const computeDynamic = (function memoizeComputeDynamic() {
  const cache = {}
  return function computeDynamic(id, css) {
    if (!cache[id]) {
      cache[id] = css.replace(/\[data-jsx~="\?"]/g, `[data-jsx~="${id}"]`)
    }
    return cache[id]
  }
})()

const fromServer = {}
const instancesCounts = {}
const tags = {}

function getIdAndCss(props) {
  if (props.dynamic) {
    const styleId = `${props.styleId}-${hashString(props.dynamic.toString())}`
    return {
      styleId,
      css: computeDynamic(styleId, props.css)
    }
  }

  return props
}

function insert(props) {
  const { styleId, css } = getIdAndCss(props)
  if (styleId in instancesCounts) {
    instancesCounts[styleId] += 1
    return
  }
  if (!(styleId in fromServer)) {
    fromServer[styleId] = document.getElementById(`__jsx-style-${styleId}`)
  }
  instancesCounts[styleId] = 1
  tags[styleId] = fromServer[styleId] || makeStyleTag(css)
}

function remove(props) {
  const { styleId } = getIdAndCss(props)
  instancesCounts[styleId] -= 1
  if (instancesCounts[styleId] < 1) {
    delete instancesCounts[styleId]
    const t = tags[styleId]
    delete tags[styleId]
    t.parentNode.removeChild(t)
  }
}

function update(props, nextProps) {
  const { styleId } = getIdAndCss(props)
  if (instancesCounts[styleId] === 1) {
    const next = getIdAndCss(nextProps)
    const t = tags[styleId]
    delete tags[styleId]
    delete instancesCounts[styleId]
    t.textContent = next.css
    tags[next.styleId] = t
    instancesCounts[next.styleId] = 1
    return
  }
  insert(nextProps)
  remove(props)
}

function makeStyleTag(str) {
  // Based on implementation by glamor
  const tag = document.createElement('style')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}

export default {
  insert: isBrowser ? insert : noop,
  remove: isBrowser ? remove : noop,
  update: isBrowser ? update : noop,
  computeDynamic
}
