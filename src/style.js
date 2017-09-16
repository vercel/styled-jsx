import { Component } from 'react'
import StyleSheetRegistry from './stylesheet-registry'

let components = []

const styleSheetRegistry = new StyleSheetRegistry()

export default class JSXStyle extends Component {
  static dynamic(arr) {
    return arr
      .map(tagInfo => {
        const [styleId, expressions] = tagInfo
        return styleSheetRegistry.computeId(styleId, expressions)
      })
      .join(' ')
  }

  componentWillMount() {
    mount(this, this.props)
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
    unmount(this, this.props)
  }

  render() {
    return null
  }
}

export function flush() {
  const ret = new Map()
  for (const { props } of components) {
    const { styleId, rules } = styleSheetRegistry.getIdAndRules(props)
    ret.set(styleId, rules.join('\n'))
  }
  components = []
  return ret
}

function mount(component, props) {
  styleSheetRegistry.add(props)
  components.push(component)
}

function unmount(component, props) {
  styleSheetRegistry.remove(props)
  const i = components.indexOf(component)
  if (i < 0) {
    return
  }
  components.splice(i, 1)
}
