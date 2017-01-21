const c = 'red'
const color = i => i

export const Test1 = () => (
  <div>
    <span>test</span>
    <span>test</span>
    <p></p><p></p><p></p><p></p><p></p><p></p><p></p>
    <p><span></span></p><p><span></span></p><p><span></span></p>
    <p></p><p></p><p></p><p></p><p></p><p></p><p></p>
    <p><span></span></p><p><span></span></p><p><span></span></p>
    <p></p><p></p><p></p><p></p><p></p><p></p><p></p>
    <p><span></span></p><p><span></span></p><p><span></span></p>
    <Component />
    <style jsx>{`
      span { color: red; }
      p { color: ${c}; }
    `}</style>
  </div>
)

export const Test2 = () => <span>test</span>

export default class {
  render() {
    return (
      <div>
        <p>test</p>
        <style jsx>{`
          p { color: ${color(c)}; }
        `}</style>
        <style jsx>{`
          p { color: red; }
        `}</style>
        <style jsx>{`
          p { color: red; }
        `}</style>
      </div>
    )
  }
}
