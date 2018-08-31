import { PureComponent } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends PureComponent {
  static dynamic(info) {
    return info
      .map(tagInfo => {
        const baseId = tagInfo[0]
        const props = tagInfo[1]
        return styleSheetRegistry.computeId(baseId, props)
      })
      .join(' ')
  }

  componentDidUpdate(prevProps) {
    styleSheetRegistry.update(prevProps, this.props)
  }

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
