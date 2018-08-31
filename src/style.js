import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends Component {
  static dynamic(info) {
    return info
      .map(tagInfo => {
        const baseId = tagInfo[0]
        const props = tagInfo[1]
        return styleSheetRegistry.computeId(baseId, props)
      })
      .join(' ')
  }

  // probably faster than PureComponent (shallowEqual)
  shouldComponentUpdate(nextProps) {
    return (
      this.props.styleId !== nextProps.styleId ||
      // We do this check because `dynamic` is an array of strings or undefined.
      // These are the computed values for dynamic styles.
      String(this.props.dynamic) !== String(nextProps.dynamic)
    )
  }

  // Remove styles in advance.
  getSnapshotBeforeUpdate(prevProps) {
    styleSheetRegistry.remove(prevProps)
    return null
  }

  // Including this otherwise React complains that getSnapshotBeforeUpdate
  // is used without componentDidMount.
  componentDidUpdate() {}

  componentWillUnmount() {
    styleSheetRegistry.remove(this.props)
  }

  render() {
    styleSheetRegistry.add(this.props)
    return null
  }
}

export function flush() {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return cssRules
}
