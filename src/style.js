import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends Component {
  static dynamic(info) {
    return info
      .map(tagInfo => {
        const [baseId, props] = tagInfo
        return styleSheetRegistry.computeId(baseId, props)
      })
      .join(' ')
  }

  componentWillMount() {
    styleSheetRegistry.add(this.props)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.css !== nextProps.css
  }

  // To avoid FOUC, we process new changes
  // on `componentWillUpdate` rather than `componentDidUpdate`.
  componentWillUpdate(nextProps) {
    styleSheetRegistry.update(this.props, nextProps)
  }

  componentWillUnmount() {
    styleSheetRegistry.remove(this.props)
  }

  render() {
    return null
  }
}

export function flush() {
  const cssRules = styleSheetRegistry.cssRules()
  styleSheetRegistry.flush()
  return new Map(cssRules)
}
