import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends Component {
  constructor(props) {
    super(props)

    // SeverSideRendering only
    if (typeof window === 'undefined') {
      styleSheetRegistry.add(this.props)
    }
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

  componentDidMount() {
    styleSheetRegistry.add(this.props)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.css !== nextProps.css
  }

  componentDidUpdate(prevProps) {
    styleSheetRegistry.update(prevProps, this.props)
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
  return cssRules
}
