import test from 'ava'
import React from 'react'
import ReactDOM from 'react-dom'
// eslint-disable-next-line no-unused-vars
import JSXStyle from '../src/style'

test('Renders styles and updates them', t => {
  const mountPoint = document.createElement('div')
  document.body.appendChild(mountPoint)

  const getStyles = () =>
    [].slice
      .call(document.querySelectorAll('style'))
      .map(s => s.textContent)
      .join('\n')

  // eslint-disable-next-line no-unused-vars
  class Component extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        styleId: 345,
        css: 'div { font-size: 10px }'
      }
    }
    getExpectedStyles() {
      const { styleId, css } = this.state
      return ['/*123*/div { color: red }', `/*${styleId}*/${css}`].join('\n')
    }
    componentDidMount() {
      t.is(
        getStyles(),
        this.getExpectedStyles(),
        'styles not rendered correctly'
      )

      // Now update styles
      this.setState({
        styleId: 678,
        css: 'div { font-size: 30px }'
      })
    }
    componentDidUpdate() {
      t.is(
        getStyles(),
        this.getExpectedStyles(),
        'styles not updated correctly'
      )
      // @TODO(giuseppeg) very hackish way to do clean up, find a better way to do so.
      document.documentElement.innerHTML = ''
    }
    render() {
      const { styleId, css } = this.state
      return (
        <div>
          <JSXStyle styleId={123} css={'/*123*/div { color: red }'} />
          <JSXStyle styleId={styleId} css={`/*${styleId}*/${css}`} />
        </div>
      )
    }
  }
  ReactDOM.render(<Component />, mountPoint)
})
