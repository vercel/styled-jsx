import {Component} from 'react'
import render from './render'

const update = typeof window === 'undefined' ? doRender : updateOnClient
let components = []
let updatePromise

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
  // Debounce calls and only render once the latest promise resolves.
  // rAF causes FOUC in Safari, setTimeout causes FOUC in Chrome, Promise#then()
  // ensures micro task enqueuing of styles update before paint.
  const promise = updatePromise = Promise.resolve().then(() => {
    if (promise === updatePromise) {
      updatePromise = null
      doRender()
    }
  })
}

function doRender() {
  render(components)
}
