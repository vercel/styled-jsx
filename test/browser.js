import test from 'ava'
import React from 'react'
import ReactJSDOM from 'react-jsdom'
// eslint-disable-next-line no-unused-vars
import JSXStyle from '../src/style'

const getStyles = () => [].slice.call(document.querySelectorAll('style'))

const getCSS = () => getStyles().map(s => s.textContent).join('\n')

test('Renders styles and updates them', t => {
  // eslint-disable-next-line no-unused-vars
  class Component extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        styleId: '345',
        css: 'div { font-size: 10px }'
      }
    }
    getExpectedStyles() {
      const { styleId, css } = this.state
      return ['/*123*/div { color: red }', `/*${styleId}*/${css}`].join('\n')
    }
    componentDidMount() {
      t.is(getCSS(), this.getExpectedStyles(), 'styles not rendered correctly')

      // Now update styles
      this.setState({
        styleId: 678,
        css: 'div { font-size: 30px }'
      })
    }
    componentDidUpdate() {
      t.is(getCSS(), this.getExpectedStyles(), 'styles not updated correctly')
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
})
