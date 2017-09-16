import hashString from 'string-hash'
import DefaultStyleSheet from './lib/stylesheet'

export default class StyleSheetRegistry {
  constructor(
    { StyleSheet = DefaultStyleSheet, optimizeForSpeed = false } = {}
  ) {
    this._sheet = new StyleSheet({
      name: 'styled-jsx',
      optimizeForSpeed
    })
    this._sheet.inject()
    this._isBrowser = typeof window !== 'undefined'

    this._fromServer = undefined
    this._indices = {}
    this._instancesCounts = {}

    this.computeId = cacheCurry(this.computeId)
    this.computeSelector = cacheCurry(this.computeSelector)
  }

  add(props) {
    if (undefined === this._optimizeForSpeed) {
      this._optimizeForSpeed = Array.isArray(props.css)
      this._sheet.setOptimizeForSpeed(this._optimizeForSpeed)
    }

    if (this._isBrowser && !this._fromServer) {
      this._fromServer = this.selectFromServer()
      this._instancesCounts = Object.keys(
        this._fromServer
      ).reduce((acc, tagName) => {
        acc[tagName] = 0
        return acc
      }, {})
    }

    const { styleId, rules } = this.getIdAndRules(props)

    // Deduping: just increase the instances count.
    if (styleId in this._instancesCounts) {
      this._instancesCounts[styleId] += 1
      return
    }

    this._instancesCounts[styleId] = 1
    this._indices[styleId] = rules.map(rule => {
      if (typeof rule !== 'string') {
        console.log(rule)
      }
      return this._sheet.insertRule(rule)
    })
  }

  remove(props) {
    const { styleId } = this.getIdAndRules(props)
    this._instancesCounts[styleId] -= 1
    if (this._instancesCounts[styleId] < 1) {
      const tagFromServer = this._fromServer[styleId]
      if (tagFromServer) {
        tagFromServer.parentNode.removeChild(tagFromServer)
      } else {
        this._indices[styleId].forEach(index => this._sheet.deleteRule(index))
      }
      delete this._instancesCounts[styleId]
      delete this._indices[styleId]
    }
  }

  update(props, nextProps) {
    this.add(nextProps)
    this.remove(props)
  }

  /**
   * createComputeId
   *
   * Creates a function to compute and memoize a jsx id from a basedId and optionally props.
   */
  computeId(cache = {}, baseId, props) {
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

  /**
   * createComputeSelector
   *
   * Creates a function to compute and memoize dynamic selectors.
   */
  computeSelector(
    cache = {},
    id,
    css,
    selectoPlaceholderRegexp = /__jsx-style-dynamic-selector/g
  ) {
    if (!cache[id]) {
      cache[id] = css.replace(selectoPlaceholderRegexp, id)
    }
    return cache[id]
  }

  getIdAndRules(props) {
    if (props.dynamic) {
      const styleId = this.computeId(props.styleId, props.dynamic)
      return {
        styleId,
        rules: Array.isArray(props.css)
          ? props.css.map(rule => this.computeSelector(styleId, rule))
          : [this.computeSelector(styleId, props.css)]
      }
    }

    return {
      styleId: this.computeId(props.styleId),
      rules: Array.isArray(props.css) ? props.css : [props.css]
    }
  }

  /**
   * selectFromServer
   *
   * Collects style tags from the document with id __jsx-XXX
   */
  selectFromServer() {
    const elements = Array.prototype.slice.call(
      document.querySelectorAll('[id^="__jsx-"]')
    )

    return elements.reduce((acc, element) => {
      const id = element.id.slice(2)
      acc[id] = element
      return acc
    }, {})
  }
}

function cacheCurry(fn) {
  const cache = {}
  return function() {
    const args = [].slice.call(arguments)
    args.unshift(cache)
    return fn.apply(null, args)
  }
}
