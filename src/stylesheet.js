import hashString from 'string-hash'

export default class StyleSheet {
  constructor() {
    this._fromServer = false
    this._instancesCounts = {}
    this._tags = {}
    this._sheet = null

    this.computeId = createComputeId()
    this.computeSelector = createComputeSelector()
  }

  getIdAndCss(props) {
    if (props.dynamic) {
      const styleId = this.computeId(props.styleId, props.dynamic)
      return {
        styleId,
        rules: useSingleSheet(props.css)
          ? props.css.map(rule => this.computeSelector(styleId, rule))
          : [this.computeSelector(styleId, props.css)]
      }
    }

    return {
      styleId: this.computeId(props.styleId),
      rules: useSingleSheet(props.css) ? props.css : [props.css]
    }
  }

  insert(props) {
    if (!this._fromServer) {
      this._tags = selectFromServer()
      this._fromServer = this._tags
      this._instancesCounts = Object.keys(this._tags).reduce((acc, tagName) => {
        acc[tagName] = 0
        return acc
      }, {})
    }

    const { styleId, rules } = this.getIdAndCss(props)

    if (styleId in this._instancesCounts) {
      this._instancesCounts[styleId] += 1
      return
    }

    this._instancesCounts[styleId] = 1

    if (!useSingleSheet(props.css)) {
      this._tags[styleId] = makeStyleTag(rules[0])
      return
    }

    if (!this._sheet) {
      this._sheet = makeStyleTag('').sheet
    }

    // Insertion interval
    this._tags[styleId] = [
      // Start
      this._sheet.cssRules.length,
      // End
      this._sheet.cssRules.length + rules.length - 1
    ]

    rules.forEach(rule =>
      this._sheet.insertRule(rule, this._sheet.cssRules.length)
    )
  }

  remove(props) {
    const { styleId } = this.getIdAndCss(props)
    this._instancesCounts[styleId] -= 1
    if (this._instancesCounts[styleId] < 1) {
      delete this._instancesCounts[styleId]
      const t = this._tags[styleId]
      delete this._tags[styleId]
      if (
        !useSingleSheet(props.css) ||
        /* server side rendered styles are not arrays of indices */
        !Array.isArray(t)
      ) {
        t.parentNode.removeChild(t)
        return
      }

      for (let i = t[0]; i <= t[1]; i++) {
        this._sheet.deleteRule(i)
        this._sheet.insertRule('styledjsx-deleted-rule {}', i)
      }
    }
  }

  update(props, nextProps) {
    if (!useSingleSheet(props.css)) {
      const { styleId } = this.getIdAndCss(props)
      if (this._instancesCounts[styleId] === 1) {
        const next = this.getIdAndCss(nextProps)
        const t = this._tags[styleId]
        delete this._tags[styleId]
        delete this._instancesCounts[styleId]
        t.textContent = next.rules[0]
        this._tags[next.styleId] = t
        this._instancesCounts[next.styleId] = 1
        return
      }
    }
    this.insert(nextProps)
    this.remove(props)
  }
}

/**
 * useSingleSheet
 *
 * When css is an array (of strings) it means that we use the CSSOM api and therefore a single stylesheet.
 */
function useSingleSheet(css) {
  return Array.isArray(css)
}

/**
 * createComputeId
 *
 * Creates a function to compute and memoize a jsx id from a basedId and optionally props.
 */
export function createComputeId() {
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
}

/**
 * createComputeSelector
 *
 * Creates a function to compute and memoize dynamic selectors.
 */
export function createComputeSelector(
  selectoPlaceholderRegexp = /__jsx-style-dynamic-selector/g
) {
  const cache = {}
  return function(id, css) {
    if (!cache[id]) {
      cache[id] = css.replace(selectoPlaceholderRegexp, id)
    }
    return cache[id]
  }
}

/**
 * selectFromServer
 *
 * Collects style tags from the document with id __jsx-XXX
 */
export function selectFromServer() {
  const elements = Array.prototype.slice.call(
    document.querySelectorAll('[id^="__jsx-"]')
  )

  return elements.reduce((acc, element) => {
    const id = element.id.slice(2)
    acc[id] = element
    return acc
  }, {})
}

export function makeStyleTag(str) {
  // Based on implementation by glamor
  const tag = document.createElement('style')
  tag.setAttribute('data-jsx-client', '')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
