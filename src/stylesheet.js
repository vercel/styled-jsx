import hashString from 'string-hash'

const isBrowser = typeof window !== 'undefined'
const useSingleSheet = css => Array.isArray(css)
function noop() {}

const computeId = (function() {
  const cache = {}
  return function(baseId, props) {
    if (!props) {
      return `jsx-${baseId}`
    }
    const propsToString = String(props)
    const key = baseId + propsToString
    if (!cache[key]) {
      cache[key] = `jsx-${hashString(`${baseId}-${propsToString}`)}`
    }
    return cache[key]
  }
})()

const computeSelector = (function() {
  const cache = {}
  return function(id, css) {
    if (!cache[id]) {
      cache[id] = css.replace(/__jsx-style-dynamic-selector/g, id)
    }
    return cache[id]
  }
})()

let fromServer = false
const instancesCounts = {}
let tags = {}
let sheet

function getIdAndCss(props) {
  if (props.dynamic) {
    const styleId = computeId(props.styleId, props.dynamic)
    return {
      styleId,
      rules: useSingleSheet(props.css)
        ? props.css.map(rule => computeSelector(styleId, rule))
        : [computeSelector(styleId, props.css)]
    }
  }

  return {
    styleId: props.styleId,
    rules: useSingleSheet(props.css) ? props.css : [props.css]
  }
}

function selectFromServer() {
  fromServer = true
  const elements = Array.prototype.slice.call(
    document.querySelectorAll('[id^="__jsx-"]')
  )

  return elements.reduce((acc, element) => {
    const id = element.id.slice(2)
    acc[id] = element
    instancesCounts[id] = 0
    return acc
  }, {})
}

function insert(props) {
  if (!fromServer) {
    tags = selectFromServer()
  }

  const { styleId, rules } = getIdAndCss(props)

  if (styleId in instancesCounts) {
    instancesCounts[styleId] += 1
    return
  }

  instancesCounts[styleId] = 1

  if (!useSingleSheet(props.css)) {
    tags[styleId] = makeStyleTag(rules[0])
    return
  }

  if (!sheet) {
    sheet = makeStyleTag('').sheet
  }

  // Insertion interval
  tags[styleId] = [
    // Start
    sheet.cssRules.length,
    // End
    sheet.cssRules.length + rules.length - 1
  ]

  rules.forEach(rule => sheet.insertRule(rule, sheet.cssRules.length))
}

function remove(props) {
  const { styleId } = getIdAndCss(props)
  instancesCounts[styleId] -= 1
  if (instancesCounts[styleId] < 1) {
    delete instancesCounts[styleId]
    const t = tags[styleId]
    delete tags[styleId]
    if (
      !useSingleSheet(props.css) ||
      /* server side rendered styles are not arrays of indices */
      !Array.isArray(t)
    ) {
      t.parentNode.removeChild(t)
      return
    }

    for (let i = t[0]; i <= t[1]; i++) {
      sheet.deleteRule(i)
      sheet.insertRule('styledjsx-deleted-rule {}', i)
    }
  }
}

function update(props, nextProps) {
  const { styleId } = getIdAndCss(props)
  if (instancesCounts[styleId] === 1 && !useSingleSheet(props.css)) {
    const next = getIdAndCss(nextProps)
    const t = tags[styleId]
    delete tags[styleId]
    delete instancesCounts[styleId]
    t.textContent = next.rules[0]
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
  tag.setAttribute('data-jsx-client', '')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}

export default {
  insert: isBrowser ? insert : noop,
  remove: isBrowser ? remove : noop,
  update: isBrowser ? update : noop,
  computeId,
  computeSelector
}
