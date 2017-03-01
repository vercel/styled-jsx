import _JSXStyle from 'styled-jsx/style';
const color = 'red';
const otherColor = 'green';
const mediumScreen = '680px';
const animationDuration = '200ms';

export default (() => <div data-jsx={2226644152}>
    <p data-jsx={2226644152}>test</p>
    <_JSXStyle styleId={414042974} css={`p.${color}[data-jsx="2226644152"] {color: ${otherColor} }`} />
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"2226644152\"] {color: red }"} />
    <_JSXStyle styleId={806016056} css={` body {background: ${color} }`} />
    <_JSXStyle styleId={2278229016} css={` body {background: ${color} }`} />
    <_JSXStyle styleId={924167211} css={`p[data-jsx="2226644152"] {color: ${color} }`} />
    <_JSXStyle styleId={1586014475} css={`p[data-jsx="2226644152"] {color: ${color} }`} />
    <_JSXStyle styleId={3469794077} css={`p[data-jsx="2226644152"] {color: ${darken(color)} }`} />
    <_JSXStyle styleId={945380644} css={`p[data-jsx="2226644152"] {color: ${darken(color) + 2} }`} />
    <_JSXStyle styleId={1110687739} css={`@media (min-width: ${mediumScreen}) {p[data-jsx="2226644152"] {color: green }p[data-jsx="2226644152"] {color ${`red`}}}p[data-jsx="2226644152"] {color: red }`} />
    <_JSXStyle styleId={2369334310} css={`p[data-jsx="2226644152"] {-webkit-animation-duration:${animationDuration};animation-duration:${animationDuration};`} />
  </div>);