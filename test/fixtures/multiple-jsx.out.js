import _JSXStyle from "styled-jsx/style";
const attrs = {
  id: 'test'
};

const Test1 = () => <div data-jsx={1535297024}>
    <span {...attrs} data-test="test" data-jsx={1535297024}>test</span>
    <Component />
    <_JSXStyle styleId={1535297024} css={"span[data-jsx=\"1535297024\"] {color: red;}"} />
  </div>;

const Test2 = () => <span>test</span>;

const Test3 = () => <div data-jsx={1535297024}>
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
