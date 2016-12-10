import {Component} from 'react'
import render from './render'

export default class extends Component {
  componentWillMount() {
    mount(this)
  }

  componentWillUnmount() {
    unmount(this)
  }

  render() {
    return null
  }
}

const components = []
const update = typeof window === 'undefined' ? doRender : updateOnClient
let requestId

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
