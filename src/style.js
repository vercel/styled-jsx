import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

const schedule = typeof requestAnimationFrame === 'undefined' ? setTimeout : requestAnimationFrame
function remove(props) {
  const remove = () => {
    styleSheetRegistry.remove(props)
  }
  if (typeof requestIdleCallback === 'undefined') {
    setTimeout(remove, 300)
  } else {
    requestIdleCallback(
      () => {
        schedule(remove)
      },
      { timeout: 1000 }
    )
  }
}

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

  componentWillMount() {
    styleSheetRegistry.add(this.props)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.css !== nextProps.css
  }

  // To avoid FOUC, we process new changes
  // on `componentWillUpdate` rather than `componentDidUpdate`.
  componentWillUpdate(nextProps) {
    styleSheetRegistry.add(nextProps)
    remove(this.props)
  }

  componentWillUnmount() {
    remove(this.props)
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
