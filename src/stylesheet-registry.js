import React, { useState, useContext, createContext } from 'react'

import DefaultStyleSheet from './lib/stylesheet'
import { computeId, computeSelector } from './lib/hash'

function mapRulesToStyle(cssRules, options = {}) {
  return cssRules.map(args => {
    const id = args[0]
    const css = args[1]
    return React.createElement('style', {
      id: `__${id}`,
      // Avoid warnings upon render with a key
      key: `__${id}`,
      nonce: options.nonce ? options.nonce : undefined,
      dangerouslySetInnerHTML: {
        __html: css
      }
    })
  })
}
export class StyleSheetRegistry {
  constructor({ styleSheet = null, optimizeForSpeed = false } = {}) {
    this._sheet =
      styleSheet ||
      new DefaultStyleSheet({
        name: 'styled-jsx',
        optimizeForSpeed
      })

    this._sheet.inject()
    if (styleSheet && typeof optimizeForSpeed === 'boolean') {
      this._sheet.setOptimizeForSpeed(optimizeForSpeed)
      this._optimizeForSpeed = this._sheet.isOptimizeForSpeed()
    }

    this._fromServer = undefined
    this._indices = {}
    this._instancesCounts = {}
  }

  add(props) {
    if (undefined === this._optimizeForSpeed) {
      this._optimizeForSpeed = Array.isArray(props.children)
      this._sheet.setOptimizeForSpeed(this._optimizeForSpeed)
      this._optimizeForSpeed = this._sheet.isOptimizeForSpeed()
    }

    if (typeof window !== 'undefined' && !this._fromServer) {
      this._fromServer = this.selectFromServer()
      this._instancesCounts = Object.keys(this._fromServer).reduce(
        (acc, tagName) => {
          acc[tagName] = 0
          return acc
        },
        {}
      )
    }

    const { styleId, rules } = this.getIdAndRules(props)

    // Deduping: just increase the instances count.
    if (styleId in this._instancesCounts) {
      this._instancesCounts[styleId] += 1
      return
    }

    const indices = rules
      .map(rule => this._sheet.insertRule(rule))
      // Filter out invalid rules
      .filter(index => index !== -1)

    this._indices[styleId] = indices
    this._instancesCounts[styleId] = 1
  }

  remove(props) {
    const { styleId } = this.getIdAndRules(props)
    invariant(
      styleId in this._instancesCounts,
      `styleId: \`${styleId}\` not found`
    )
    this._instancesCounts[styleId] -= 1

    if (this._instancesCounts[styleId] < 1) {
      const tagFromServer = this._fromServer && this._fromServer[styleId]
      if (tagFromServer) {
        tagFromServer.parentNode.removeChild(tagFromServer)
        delete this._fromServer[styleId]
      } else {
        this._indices[styleId].forEach(index => this._sheet.deleteRule(index))
        delete this._indices[styleId]
      }

      delete this._instancesCounts[styleId]
    }
  }

  update(props, nextProps) {
    this.add(nextProps)
    this.remove(props)
  }

  flush() {
    this._sheet.flush()
    this._sheet.inject()
    this._fromServer = undefined
    this._indices = {}
    this._instancesCounts = {}
  }

  cssRules() {
    const fromServer = this._fromServer
      ? Object.keys(this._fromServer).map(styleId => [
          styleId,
          this._fromServer[styleId]
        ])
      : []
    const cssRules = this._sheet.cssRules()

    return fromServer.concat(
      Object.keys(this._indices)
        .map(styleId => [
          styleId,
          this._indices[styleId]
            .map(index => cssRules[index].cssText)
            .join(this._optimizeForSpeed ? '' : '\n')
        ])
        // filter out empty rules
        .filter(rule => Boolean(rule[1]))
    )
  }

  styles(options) {
    return mapRulesToStyle(this.cssRules(), options)
  }

  getIdAndRules(props) {
    const { children: css, dynamic, id } = props

    if (dynamic) {
      const styleId = computeId(id, dynamic)
      return {
        styleId,
        rules: Array.isArray(css)
          ? css.map(rule => computeSelector(styleId, rule))
          : [computeSelector(styleId, css)]
      }
    }

    return {
      styleId: computeId(id),
      rules: Array.isArray(css) ? css : [css]
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

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`StyleSheetRegistry: ${message}.`)
  }
}

export const StyleSheetContext = createContext(null)
StyleSheetContext.displayName = 'StyleSheetContext'

export function createStyleRegistry() {
  return new StyleSheetRegistry()
}

export function StyleRegistry({ registry: configuredRegistry, children }) {
  const rootRegistry = useContext(StyleSheetContext)
  const [registry] = useState(
    () => rootRegistry || configuredRegistry || createStyleRegistry()
  )

  return React.createElement(
    StyleSheetContext.Provider,
    { value: registry },
    children
  )
}

export function useStyleRegistry() {
  return useContext(StyleSheetContext)
}
