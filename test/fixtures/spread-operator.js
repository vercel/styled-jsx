const Home = () => (
  <div>
    <div {...{ id: 'foo' }}>test</div>

    <style jsx>{`
      #foo {
        background: blue;
      }
    `}</style>
  </div>
)

export default () => (
  <div>
    <div {...{ className: 'foo' }}>test</div>

    <style jsx>{`
      .foo {
        background: blue;
      }
    `}</style>
  </div>
)
