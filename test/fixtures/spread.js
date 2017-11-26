import React from 'react'

const A = props => (
  <div className="a-component" {...props.red}>
    <style jsx>{`
      .a-component {
        color: red;
      }
    `}</style>
  </div>
)

export default A
