import { Component } from 'react'
import hashString from 'string-hash'
import styleSheet from './stylesheet'

let components = []

export default class extends Component {
  static dynamic(arr) {
    return arr
      .map(tagInfo => {
        const [styleId, expressions] = tagInfo
        const hash = hashString(expressions.toString())
        return `${styleId}-${hash}`
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
    mount(this, nextProps)
    unmount(this, this.props)
  }

  componentWillUnmount() {
    unmount(this, this.props)
  }

  render() {
    return null
  }
}

function stylesMap(updated) {
  const ret = new Map()
  let c
  let i = 0
  const len = components.length
  for (; i < len; i++) {
    c = components[i]
    // On `componentWillUpdate`
    // we use `styleId` and `css` from updated component rather than reading `props`
    // from the component since they haven't been updated yet.
    const props = updated && c === updated.instance ? updated : c.props

    if (props.dynamic) {
      const styleId = `${props.styleId}-${hashString(props.dynamic.toString())}`
      ret.set(styleId, styleSheet.computeDynamic(styleId, props.css))
    } else {
      ret.set(props.styleId, props.css)
    }
  }
  return ret
}

export function flush() {
  const ret = stylesMap()
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
