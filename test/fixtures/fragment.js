export default () => (
  <>
    <p>Testing!!!</p>
    <p className="foo">Bar</p>
    <>
      <h3 id="head">Title...</h3>
      <>
        <p>hello</p>
        <>
          <p>foo</p>
          <p>bar</p>
        </>
        <p>world</p>
      </>
    </>
    <style jsx>{`
      p {
        color: cyan;
      }
      .foo {
        font-size: 18px;
        color: hotpink;
      }
      #head {
        text-decoration: underline;
      }
    `}</style>
  </>
)
