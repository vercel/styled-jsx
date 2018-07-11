export default ({ level = 1 }) => {
  const Element = `h${level}`

  return (
    <Element className="root">
      <p>dynamic element</p>
      <style jsx>{`
        .root {
          background: red;
        }
      `}</style>
    </Element>
  )
}
