export default () => (
  <>
    <p>Testing!!!</p>
    <p className="foo">Bar</p>
    <div>
      <h3 id="head">Title...</h3>
    </div>
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
