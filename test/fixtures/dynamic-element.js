export default ({ level = 1 }) => {
  const Element = `h${level}`

  return (
    <Element styled-jsx className="root">
      <p>dynamic element</p>
      <style jsx>{`
        .root {
          background: red;
        }
      `}</style>
    </Element>
  )
}
