import _JSXStyle from "styled-jsx/style";
const Test = () => <span>test</span>;

const Test2 = () => <div data-jsx={1535297024}>
    <span data-jsx={1535297024}>test</span>
    <_JSXStyle styleId={1535297024} css={"span[data-jsx=\"1535297024\"] {color: red;}"} />
  </div>;

export default class {
  render() {
    return <div data-jsx={1891769468}>
        <p data-jsx={1891769468}>test</p>
        <_JSXStyle styleId={1891769468} css={"p[data-jsx=\"1891769468\"] {color: red;}"} />
      </div>;
  }
}
