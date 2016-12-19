export default class {
  renderTest() {
    return <p>test</p>
  }

  render () {
    const test = <div>{this.renderTest}</div>

    return (
      <div>
        {test}
        <style jsx>{`
          p {
            color: red;
          }
        `}</style>
      </div>
    )
  }
}
