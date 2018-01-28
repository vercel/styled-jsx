import _JSXStyle from "styled-jsx/style";

export default class {
  renderTest() {
    return <p data-jsx={"1891769468"}>test</p>
  }

  render () {
    const test = <div data-jsx={"1891769468"}>{this.renderTest}</div>

    return (
      <div data-jsx={"1891769468"}>
        {test}
        <_JSXStyle css={"p[data-jsx=\"1891769468\"] {color: red;}"} data-jsx={"1891769468"} />
      </div>
    )
  }
}
