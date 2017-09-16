const isBrowser = typeof window !== 'undefined'
const isProd = process.env && process.env.NODE_ENV === 'production'

export default class StyleSheet {
  constructor({ name = 'stylesheet', optimizeForSpeed = isProd } = {}) {
    invariant(typeof name === 'string', '`name` must be a string')
    this._name = name

    invariant(
      typeof optimizeForSpeed === 'boolean',
      '`optimizeForSpeed` must be a boolean'
    )
    this._optimizeForSpeed = optimizeForSpeed

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
      !this._injected,
      'optimizeForSpeed cannot be set after the sheet has been injected'
    )
    this._optimizeForSpeed = bool
  }

  inject() {
    invariant(!this._injected, 'sheet already injected')
    this._injected = true
    if (isBrowser) {
      this._tags[0] = this.makeStyleTag(this._name)
      this._optimizeForSpeed =
        this._optimizeForSpeed && this.getSheet().insertRule
      return
    }

    this._serverSheet = {
      cssRules: [],
      insertRule: rule => {
        this._serverSheet.cssRules.push({ cssText: rule })
      }
    }
  }

  getSheet() {
    const tag = this._tags[this._tags.length - 1]
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

  insertRule(rule) {
    invariant(typeof rule === 'string', '`insertRule` accepts only strings')

    if (!isBrowser) {
      this._serverSheet.insertRule(
        rule,
        rule.indexOf('@import') === -1 ? this._serverSheet.cssRules.length : 0
      )
      return this._rulesCount++
    }

    if (this._optimizeForSpeed) {
      const sheet = this.getSheet()
      // this weirdness for perf, and chrome's weird bug
      // https://stackoverflow.com/questions/20007992/chrome-suddenly-stopped-accepting-insertrule
      try {
        sheet.insertRule(
          rule,
          rule.indexOf('@import') === -1 ? sheet.cssRules.length : 0
        )
      } catch (err) {
        if (!isProd) {
          console.warn(
            `StyleSheet: illegal rule: \n\n${rule}\n\nSee https://stackoverflow.com/q/20007992 for more info`
          ) // eslint-disable-line no-console
        }
      }
    } else {
      const insertionPoint =
        this._tags[0] && rule.indexOf('@import') === -1
          ? undefined
          : this._tags[0]
      this._tags.push(this.makeStyleTag(this._name, rule, insertionPoint))
    }

    return this._rulesCount++
  }

  replaceRule(index, rule) {
    if (this._optimizeForSpeed) {
      const sheet = this.getSheet()
      rule = rule.trim() ? rule : '#___stylesheet-empty-rule____{}'
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
    this.replaceRule(index, '')
  }

  flush() {
    this._injected = false
    if (isBrowser) {
      this._tags.forEach(tag => tag.parentNode.removeChild(tag))
      this._tags = []
      this._rulesCount = 0
    } else {
      // simpler on server
      this._serverSheet.cssRules = []
    }
  }

  cssRules() {
    if (!isBrowser) {
      return this._serverSheet.cssRules
    }
    if (this._optimizeForSpeed) {
      return Array.from(this.getSheet().cssRules)
    }
    return this._tags.map(tag => tag.textContent)
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
    tag.appendChild(document.createTextNode(cssString || ''))
    const head = document.head || document.getElementsByTagName('head')[0]
    if (relativeToTag) {
      head.insertBefore(tag, relativeToTag)
    } else {
      head.appendChild(tag)
    }
    return tag
  }
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`StyleSheet: ${message}`)
  }
}
