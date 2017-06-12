import { Component } from 'react'
import render from './render'

let components = []

export default class extends Component {
  componentWillMount() {
    mount(this)
  }

  componentWillUpdate(nextProps) {
    update({
      instance: this,
      id: nextProps.styleId,
      css: nextProps.css
    })
  }

  componentWillUnmount() {
    unmount(this)
  }

  render() {
    return null
  }
}

function styleMap(updated) {
  const ret = new Map()
  for (const c of components) {
    if (updated && c === updated.instance) {
      // Use styleId and css from upated component rather than reading props
      // from the component since they haven't been updated yet
      ret.set(updated.styleId, updated.css)
    } else {
      ret.set(c.props.styleId, c.props.css)
    }
  }
  return ret
}

export function flush() {
  const ret = styleMap()
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
  render(styleMap(updates))
}
