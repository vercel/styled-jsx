const Element = props => <p className={props.className}>{props.children}</p>

const Element2 = props => (
  <Element className={props.className}>
    {props.children}
    <style jsx>{`
      .${props.className} {
        background: green;
      }
    `}</style>
  </Element>
)

export default () => (
  <div>
    <Element className="test">test</Element>
    <Element2 className="test">test2</Element2>
    <style jsx>{`
      .test {
        background: red;
      }
    `}</style>
  </div>
)
