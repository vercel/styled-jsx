import _JSXStyle from 'styled-jsx/style';
const color = 'red';

export default (() => <div data-jsx={1748646287}>
    <p data-jsx={1748646287}>test</p>
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"1748646287\"] {color: red }"} />
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"1748646287\"] {color: red }"} />
    <_JSXStyle styleId={806016056} css={`body { background: ${ color } }`} />
    <_JSXStyle styleId={924167211} css={`p[data-jsx="1748646287"] {color: ${ color }}`} />
    <_JSXStyle styleId={3469794077} css={`p[data-jsx="1748646287"] {color: ${ darken(color) }}`} />
    <_JSXStyle styleId={945380644} css={`p[data-jsx="1748646287"] {color: ${ darken(color) + 2 }}`} />
  </div>);
