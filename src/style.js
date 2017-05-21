import { Component } from 'react'
import render from './render'

let components = []

export default class extends Component {
  componentWillMount() {
    mount(this)
  }

  componentWillUpdate() {
    update()
  }

  componentWillUnmount() {
    unmount(this)
  }

  render() {
    return null
  }
}

function componentMap() {
  const ret = new Map()
  for (const c of components) {
    ret.set(c.props.styleId, c)
  }
  return ret
}

export function flush() {
  const ret = componentMap()
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

function update() {
  render(componentMap())
}
