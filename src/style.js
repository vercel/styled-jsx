import { Component } from 'react'
import StyleSheet from './stylesheet'

let components = []

const styleSheet = new StyleSheet()

export default class JSXStyle extends Component {
  static dynamic(arr) {
    return arr
      .map(tagInfo => {
        const [styleId, expressions] = tagInfo
        return styleSheet.computeId(styleId, expressions)
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
    styleSheet.update(this.props, nextProps)
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
    if (props.dynamic) {
      const styleId = styleSheet.computeId(props.styleId, props.dynamic)
      ret.set(
        styleId,
        styleSheet.computeSelector(
          styleId,
          Array.isArray(props.css) ? props.css.join('\n') : props.css
        )
      )
    } else {
      ret.set(
        styleSheet.computeId(props.styleId),
        Array.isArray(props.css) ? props.css.join('\n') : props.css
      )
    }
  }
  components = []
  return ret
}

function mount(component, props) {
  styleSheet.insert(props)
  components.push(component)
}

function unmount(component, props) {
  styleSheet.remove(props)
  const i = components.indexOf(component)
  if (i < 0) {
    return
  }
  components.splice(i, 1)
}
