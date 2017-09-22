import test from 'ava'
import React from 'react'
import ReactJSDOM from 'react-jsdom'

test('Renders styles and updates them', t => {
  // Workaround so that JSXStyle works as if it was running on a browser.
  const originalWindow = global.window
  global.window = true
  // eslint-disable-next-line no-unused-vars
  const JSXStyle = require('../src/style').default

  // eslint-disable-next-line no-unused-vars
  class Component extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        styleId: '345',
        css: 'div { font-size: 10px }'
      }
    }
    getStyles() {
      return [].slice
        .call(document.querySelectorAll('style'))
        .map(s => s.textContent)
        .join('\n')
    }
    getExpectedStyles() {
      const { styleId, css } = this.state
      return ['/*123*/div { color: red }', `/*${styleId}*/${css}`].join('\n')
    }
    componentDidMount() {
      t.is(
        this.getStyles(),
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
        this.getStyles(),
        this.getExpectedStyles(),
        'styles not updated correctly'
      )
    }
    render() {
      const { styleId, css } = this.state
      return (
        <div>
          <JSXStyle styleId={'123'} css={'/*123*/div { color: red }'} />
          <JSXStyle styleId={styleId} css={`/*${styleId}*/${css}`} />
        </div>
      )
    }
  }

  ReactJSDOM.render(<Component />)
  global.window = originalWindow
})
