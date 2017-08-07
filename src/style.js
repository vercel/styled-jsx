import { Component } from 'react'
import hashString from 'string-hash'
import render from './render'

const mountedCounts = {}
const mounted = {}

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

const computeDynamic = (function memoizeComputeDynamic() {
  const cache = {}
  return function computeDynamic(id, css) {
    if (!cache[id]) {
      cache[id] = css.replace(/\[data-jsx~="\?"]/g, `[data-jsx~="${id}"]`)
    }
    return cache[id]
  }
})()

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

function getIdAndCss(props) {
  if (props.dynamic) {
    const styleId = `${props.styleId}-${hashString(props.dynamic.toString())}`
    return {
      styleId,
      css: computeDynamic(styleId, props.css)
    }
  }

  return props
}

function mount(component, props) {
  const {styleId, css} = getIdAndCss(props)
  if (mountedCounts.hasOwnProperty(styleId)) {
    mountedCounts[styleId] += 1
    return
  }
  mountedCounts[styleId] = 1
  mounted[styleId] = makeStyleTag(css)
  components.push(component)
}

function unmount(component, props) {
  const {styleId} = getIdAndCss(props)
  mountedCounts[styleId] -= 1
  if (mountedCounts[styleId] < 1) {
    delete mountedCounts[styleId]
    const t = mounted[styleId]
    delete mounted[styleId]
    t.parentNode.removeChild(t)
    const i = components.indexOf(component)
    if (i < 0) {
      return
    }
    components.splice(i, 1)
  }
}

function makeStyleTag(str) {
  // Based on implementation by glamor
  const tag = document.createElement('style')
  tag.appendChild(document.createTextNode(str))

  const head = document.head || document.getElementsByTagName('head')[0]
  head.appendChild(tag)

  return tag
}
