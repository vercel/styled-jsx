import { Component } from 'react'
import hashString from 'string-hash'
import render from './render'

let components = []

function hashArray(arr) {
  return hashString(arr.join(','))
}

export default class extends Component {
  static dynamic(arr) {
    return arr
      .map(tagInfo => {
        const [styleId, expressions] = tagInfo
        const hash = hashArray(expressions)
        return `${styleId}-${hash}`
      })
      .join(' ')
  }

  componentWillMount() {
    mount(this)
  }

  // To avoid FOUC, we process new changes
  // on `componentWillUpdate` rather than `componentDidUpdate`.
  componentWillUpdate(nextProps) {
    update({
      instance: this,
      styleId: nextProps.styleId,
      css: nextProps.css,
      dynamic: nextProps.dynamic
    })
  }

  componentWillUnmount() {
    unmount(this)
  }

  render() {
    return null
  }
}

function stylesMap(updated) {
  const ret = new Map()
  for (const c of components) {
    // On `componentWillUpdate`
    // we use `styleId` and `css` from updated component rather than reading `props`
    // from the component since they haven't been updated yet.
    const props = updated && c === updated.instance ? updated : c.props

    if (props.dynamic) {
      const styleId = `${props.styleId}-${hashArray(props.dynamic)}`
      ret.set(styleId, computeDynamic(styleId, props.css))
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

function mount(component) {
  components.push(component)
  update()
}

function unmount(component) {
  const i = components.indexOf(component)
  if (i < 0) {
    return
  }

  components.splice(i, 1)
  update()
}

function update(updates) {
  render(stylesMap(updates))
}

function computeDynamic(id, css) {
  return css.replace(/\[data-jsx~="\?"]/g, `[data-jsx~="${id}"]`)
}
