/* eslint-disable no-unused-vars */

const Test1 = () => [
  <div>Foo</div>,
  <span>Bar</span>,
  <style jsx>{`
    div {
      color: red;
    }
  `}</style>
]

const Test2 = () => [
  <p>Hello World</p>,
  <style global jsx>
    {'p { color: white }'}
  </style>
]

const Test3 = () => [
  <div>
    <p>Hello World</p>
    <style jsx>{`
      p {
        color: blue;
      }
    `}</style>
  </div>,
  <div>Hello World</div>
]

const Test4 = () => [
  <div>
    <span>Styled by root style tag</span>
    <p className="one">Lorem</p>
    <p className="two">Ipsum</p>
    <style jsx>{`
      .one {
        color: red;
      }
    `}</style>
  </div>,
  <div>
    <p className="one">Dolor</p>
    <p className="two">Sit</p>
  </div>,
  <div>
    <p className="one">Dolor</p>
    <p className="two">Sit</p>
    <style jsx global>{`
      .two {
        color: blue;
      }
      span {
        color: blue;
      }
    `}</style>
  </div>,
  <style jsx>{`
    span {
      background: magenta;
    }
  `}</style>
]

const Test5 = () => [
  <div>Foo</div>,
  <div>
    <div>
      <div className="bar">Bar</div>
    </div>
  </div>,
  <div>
    <main>
      <div>
        <div id="baz">Baz</div>
      </div>
    </main>
  </div>,
  <style jsx>{`
    main {
      color: red;
    }
    .bar {
      color: white;
    }
    .baz {
      color: blue;
    }
  `}</style>
]

export default () => (
  <div>
    <Test1 />
    <Test2 />
    <Test3 />
    <Test4 />
    <Test5 />
  </div>
)
