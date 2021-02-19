import React, { Component } from 'react'
import {
  globalStyleSheetRegistry,
  StyleSheetRegistryContext
} from './stylesheet-registry'

export default class JSXStyle extends Component {
  constructor(props) {
    super(props)
    this.prevProps = {}
  }

  get styleSheetRegistry() {
    return this.context
  }

  static dynamic(info) {
    return info
      .map(tagInfo => {
        const baseId = tagInfo[0]
        const props = tagInfo[1]
        // It's fine te reference globalStyleSheetRegistry here since all
        // `computeId` does is calculate the classname (which is a pure function
        // of baseId and props). It's only an instance method so that it can
        // memoize the results.
        return globalStyleSheetRegistry.computeId(baseId, props)
      })
      .join(' ')
  }

  // probably faster than PureComponent (shallowEqual)
  shouldComponentUpdate(otherProps) {
    return (
      this.props.id !== otherProps.id ||
      // We do this check because `dynamic` is an array of strings or undefined.
      // These are the computed values for dynamic styles.
      String(this.props.dynamic) !== String(otherProps.dynamic)
    )
  }

  componentWillUnmount() {
    this.styleSheetRegistry.remove(this.props)
  }

  render() {
    // This is a workaround to make the side effect async safe in the "render" phase.
    // See https://github.com/zeit/styled-jsx/pull/484
    if (this.shouldComponentUpdate(this.prevProps)) {
      // Updates
      if (this.prevProps.id) {
        this.styleSheetRegistry.remove(this.prevProps)
      }

      this.styleSheetRegistry.add(this.props)
      this.prevProps = this.props
    }

    return null
  }
}

JSXStyle.contextType = StyleSheetRegistryContext

export function flush(styleSheetRegistry = globalStyleSheetRegistry) {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}
