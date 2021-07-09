import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends Component {
  constructor(props) {
    super(props)
    // Empty state to get style registered on first render
    this.state = {}
  }

  static dynamic(info) {
    return info
      .map(tagInfo => {
        const baseId = tagInfo[0]
        const props = tagInfo[1]
        return styleSheetRegistry.computeId(baseId, props)
      })
      .join(' ')
  }

  static getDerivedStateFromProps(props, state) {
    if (
      props.id !== state.id ||
      // We do this check because `dynamic` is an array of strings or undefined.
      // These are the computed values for dynamic styles.
      String(props.dynamic) !== String(state.dynamic)
    ) {
      if (state.id) {
        styleSheetRegistry.remove(state)
      }
      styleSheetRegistry.add(props)
      return props
    }
    return null
  }

  componentWillUnmount() {
    if (this.state.id) {
      styleSheetRegistry.remove(this.state)
    }
  }

  render() {
    return null
  }
}

export function flush() {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}
