import {Component} from 'react'
import render from './render'

const update = typeof window === 'undefined' ? doRender : updateOnClient
let components = []
let requestId

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

export function flush() {
  const ret = {}

  for (const {props} of components) {
    ret[props.styleId] = props.css
  }

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

function updateOnClient() {
  window.cancelAnimationFrame(requestId)
  requestId = window.requestAnimationFrame(() => {
    requestId = null
    doRender()
  })
}

function doRender() {
  render(components)
}
