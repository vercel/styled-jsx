import { Component } from 'react'
import RegistryContext from './stylesheet-registry-context'

export default class JSXStyle extends Component {
  constructor(props) {
    super(props)
    this.prevProps = {}
  }

  // probably faster than PureComponent (shallowEqual)
  shouldComponentUpdate(otherProps) {
    return (
      this.props.id !== otherProps.id ||
      // We do this check because `dynamic` is an array of strings or undefined.
      // These are the computed values for dynamic styles.
      String(this.props.dynamic) !== String(otherProps.dynamic)
    )
  }

  componentWillUnmount() {
    this.context.remove(this.props)
  }

  render() {
    // This is a workaround to make the side effect async safe in the "render" phase.
    // See https://github.com/zeit/styled-jsx/pull/484
    if (this.shouldComponentUpdate(this.prevProps)) {
      // Updates
      if (this.prevProps.id) {
        this.context.remove(this.prevProps)
      }

      this.context.add(this.props)
      this.prevProps = this.props
    }

    return null
  }
}

JSXStyle.contextType = RegistryContext
