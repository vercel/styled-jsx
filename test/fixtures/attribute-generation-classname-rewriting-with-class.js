import React from 'react'

class A extends React.Component {
  render() {
    return (
      <div className="a-component" {...this.props}>
        <style jsx>{`
          .a-component {
            color: red;
          }
        `}</style>
      </div>
    )
  }
}

export default A
