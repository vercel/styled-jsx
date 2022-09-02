/*
Based on Glamor's sheet
https://github.com/threepointone/glamor/blob/667b480d31b3721a905021b26e1290ce92ca2879/src/sheet.js
*/

const isProd =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV === 'production'
const isString = o => Object.prototype.toString.call(o) === '[object String]'

export default class StyleSheet {
  constructor({ name = 'stylesheet', optimizeForSpeed = isProd } = {}) {
    invariant(isString(name), '`name` must be a string')
    this._name = name
    this._deletedRulePlaceholder = `#${name}-deleted-rule____{}`

    invariant(
      typeof optimizeForSpeed === 'boolean',
      '`optimizeForSpeed` must be a boolean'
    )
    this._optimizeForSpeed = optimizeForSpeed
    this._serverSheet = undefined
    this._tags = []
    this._injected = false
    this._rulesCount = 0

    const node =
      typeof window !== 'undefined' &&
      document.querySelector('meta[property="csp-nonce"]')
    this._nonce = node ? node.getAttribute('content') : null
  }

  setOptimizeForSpeed(bool) {
    invariant(
      typeof bool === 'boolean',
      '`setOptimizeForSpeed` accepts a boolean'
    )

    invariant(
      this._rulesCount === 0,
      'optimizeForSpeed cannot be when rules have already been inserted'
    )
    this.flush()
    this._optimizeForSpeed = bool
    this.inject()
  }

  isOptimizeForSpeed() {
    return this._optimizeForSpeed
  }

  inject() {
    invariant(!this._injected, 'sheet already injected')
    this._injected = true
    if (typeof window !== 'undefined' && this._optimizeForSpeed) {
      this._tags[0] = this.makeStyleTag(this._name)
      this._optimizeForSpeed = 'insertRule' in this.getSheet()
      if (!this._optimizeForSpeed) {
        if (!isProd) {
          console.warn(
            'StyleSheet: optimizeForSpeed mode not supported falling back to standard mode.'
          )
        }

        this.flush()
        this._injected = true
      }

      return
    }

    this._serverSheet = {
      cssRules: [],
      insertRule: (rule, index) => {
        if (typeof index === 'number') {
          this._serverSheet.cssRules[index] = { cssText: rule }
        } else {
          this._serverSheet.cssRules.push({ cssText: rule })
        }

        return index
      },
      deleteRule: index => {
        this._serverSheet.cssRules[index] = null
      }
    }
  }

  getSheetForTag(tag) {
    if (tag.sheet) {
      return tag.sheet
    }

    // this weirdness brought to you by firefox
    for (let i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].ownerNode === tag) {
        return document.styleSheets[i]
      }
    }
  }

  getSheet() {
    return this.getSheetForTag(this._tags[this._tags.length - 1])
  }

  insertRule(rule, index) {
    invariant(isString(rule), '`insertRule` accepts only strings')

    if (typeof window === 'undefined') {
      if (typeof index !== 'number') {
        index = this._serverSheet.cssRules.length
      }

      this._serverSheet.insertRule(rule, index)
      return this._rulesCount++
    }

    if (this._optimizeForSpeed) {
      const sheet = this.getSheet()
      if (typeof index !== 'number') {
        index = sheet.cssRules.length
      }

      // this weirdness for perf, and chrome's weird bug
      // https://stackoverflow.com/questions/20007992/chrome-suddenly-stopped-accepting-insertrule
      try {
        sheet.insertRule(rule, index)
      } catch (error) {
        if (!isProd) {
          console.warn(
            `StyleSheet: illegal rule: \n\n${rule}\n\nSee https://stackoverflow.com/q/20007992 for more info`
          )
        }

        return -1
      }
    } else {
      const insertionPoint = this._tags[index]
      this._tags.push(this.makeStyleTag(this._name, rule, insertionPoint))
    }

    return this._rulesCount++
  }

  replaceRule(index, rule) {
    if (this._optimizeForSpeed || typeof window === 'undefined') {
      const sheet =
        typeof window !== 'undefined' ? this.getSheet() : this._serverSheet
      if (!rule.trim()) {
        rule = this._deletedRulePlaceholder
      }

      if (!sheet.cssRules[index]) {
        // @TBD Should we throw an error?
        return index
      }

      sheet.deleteRule(index)

      try {
        sheet.insertRule(rule, index)
      } catch (error) {
        if (!isProd) {
          console.warn(
            `StyleSheet: illegal rule: \n\n${rule}\n\nSee https://stackoverflow.com/q/20007992 for more info`
          )
        }

        // In order to preserve the indices we insert a deleteRulePlaceholder
        sheet.insertRule(this._deletedRulePlaceholder, index)
      }
    } else {
      const tag = this._tags[index]
      invariant(tag, `old rule at index \`${index}\` not found`)
      tag.textContent = rule
    }

    return index
  }

  deleteRule(index) {
    if (typeof window === 'undefined') {
      this._serverSheet.deleteRule(index)
      return
    }

    if (this._optimizeForSpeed) {
      this.replaceRule(index, '')
    } else {
      const tag = this._tags[index]
      invariant(tag, `rule at index \`${index}\` not found`)
      tag.parentNode.removeChild(tag)
      this._tags[index] = null
    }
  }

  flush() {
    this._injected = false
    this._rulesCount = 0
    if (typeof window !== 'undefined') {
      this._tags.forEach(tag => tag && tag.parentNode.removeChild(tag))
      this._tags = []
    } else {
      // simpler on server
      this._serverSheet.cssRules = []
    }
  }

  cssRules() {
    if (typeof window === 'undefined') {
      return this._serverSheet.cssRules
    }

    return this._tags.reduce((rules, tag) => {
      if (tag) {
        rules = rules.concat(
          Array.prototype.map.call(this.getSheetForTag(tag).cssRules, rule =>
            rule.cssText === this._deletedRulePlaceholder ? null : rule
          )
        )
      } else {
        rules.push(null)
      }

      return rules
    }, [])
  }

  makeStyleTag(name, cssString, relativeToTag) {
    if (cssString) {
      invariant(
        isString(cssString),
        'makeStyleTag accepts only strings as second parameter'
      )
    }

    const tag = document.createElement('style')
    if (this._nonce) tag.setAttribute('nonce', this._nonce)
    tag.type = 'text/css'
    tag.setAttribute(`data-${name}`, '')

    if (cssString) {
      tag.appendChild(document.createTextNode(cssString))
    }

    const head = document.head || document.getElementsByTagName('head')[0]

    if (relativeToTag) {
      head.insertBefore(tag, relativeToTag)
    } else {
      head.appendChild(tag)
    }

    return tag
  }

  get length() {
    return this._rulesCount
  }
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`StyleSheet: ${message}.`)
  }
}
