export class Test {
  test() {
    const aaaa = 'red'
    return (
      <div>
        <p>test</p>
        <style jsx>{`p { color: ${aaaa} }`}</style>
      </div>
    )
  }

  render() {
    return (
      <div>
        <p>test</p>
        <style jsx>{`p { color: ${this.props.color} }`}</style>
      </div>
    )
  }
}
