const isProd = process.env && process.env.NODE_ENV === 'production'

export default class StyleSheet {
  constructor(
    {
      name = 'stylesheet',
      optimizeForSpeed = isProd,
      isBrowser = typeof window !== 'undefined'
    } = {}
  ) {
    invariant(typeof name === 'string', '`name` must be a string')
    this._name = name
    this._deletedRulePlaceholder = `#${name}-deleted-rule____{}`

    invariant(
      typeof optimizeForSpeed === 'boolean',
      '`optimizeForSpeed` must be a boolean'
    )
    this._optimizeForSpeed = optimizeForSpeed
    this._isBrowser = isBrowser

    this._serverSheet = undefined
    this._tags = []
    this._injected = false
    this._rulesCount = 0
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

  inject() {
    invariant(!this._injected, 'sheet already injected')
    this._injected = true
    if (this._isBrowser && this._optimizeForSpeed) {
      this._tags[0] = this.makeStyleTag(this._name)
      this._optimizeForSpeed = 'insertRule' in this.getSheet()
      if (!this._optimizeForSpeed) {
        if (!isProd) {
          console.warn(
            'StyleSheet: optimizeForSpeed mode not supported falling back to standard mode.'
          ) // eslint-disable-line no-console
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
    invariant(typeof rule === 'string', '`insertRule` accepts only strings')

    if (!this._isBrowser) {
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
      } catch (err) {
        if (!isProd) {
          console.warn(
            `StyleSheet: illegal rule: \n\n${rule}\n\nSee https://stackoverflow.com/q/20007992 for more info`
          ) // eslint-disable-line no-console
        }
      }
    } else {
      const insertionPoint = this._tags[index]
      this._tags.push(this.makeStyleTag(this._name, rule, insertionPoint))
    }

    return this._rulesCount++
  }

  replaceRule(index, rule) {
    if (this._optimizeForSpeed || !this._isBrowser) {
      const sheet = this._isBrowser ? this.getSheet() : this._serverSheet
      rule = rule.trim() ? rule : this._deletedRulePlaceholder
      sheet.deleteRule(index)
      sheet.insertRule(rule, index)
    } else {
      const tag = this._tags[index]
      invariant(tag, `old rule at index \`${index}\` not found`)
      tag.textContent = rule
    }
    return index
  }

  deleteRule(index) {
    if (!this._isBrowser) {
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
      // {
      //   sheet: {
      //     cssRules: [{ cssText: '' }]
      //   }
      // }
    }
  }

  flush() {
    this._injected = false
    if (this._isBrowser) {
      this._tags.forEach(tag => tag && tag.parentNode.removeChild(tag))
      this._tags = []
      this._rulesCount = 0
    } else {
      // simpler on server
      this._serverSheet.cssRules = []
    }
  }

  cssRules() {
    if (!this._isBrowser) {
      return this._serverSheet.cssRules.filter(Boolean)
    }
    const rules = []
    this._tags
      .filter(Boolean)
      .forEach(tag =>
        rules.splice(
          rules.length,
          0,
          ...Array.from(
            this.getSheetForTag(tag).cssRules.filter(
              rule => rule.cssText !== this._deletedRulePlaceholder
            )
          )
        )
      )
    return rules
  }

  makeStyleTag(name, cssString, relativeToTag) {
    if (cssString) {
      invariant(
        typeof cssString === 'string',
        'makeStyleTag acceps only strings as second parameter'
      )
    }
    const tag = document.createElement('style')
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
    throw new Error(`StyleSheet: ${message}`)
  }
}
