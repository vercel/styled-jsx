const Test = () => <span>test</span>

const Test2 = () => (
  <div>
    <span>test</span>
    <style jsx>{`
      span {
        color: red;
      }
    `}</style>
  </div>
)

export default class {
  render () {
    return (
      <div>
        <p>test</p>
        <style jsx>{`
          p {
            color: red;
          }
        `}</style>
      </div>
    )
  }
}
