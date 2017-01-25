import _JSXStyle from 'styled-jsx/style';
const color = 'red';
const otherColor = 'green';
const mediumScreen = '680px';

export default (() => <div data-jsx={2520901095}>
    <p data-jsx={2520901095}>test</p>
    <_JSXStyle styleId={414042974} css={`p.${color}[data-jsx="2520901095"] {color: ${otherColor} }`} />
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"2520901095\"] {color: red }"} />
    <_JSXStyle styleId={806016056} css={`body { background: ${color} }`} />
    <_JSXStyle styleId={924167211} css={`p[data-jsx="2520901095"] {color: ${color} }`} />
    <_JSXStyle styleId={3469794077} css={`p[data-jsx="2520901095"] {color: ${darken(color)} }`} />
    <_JSXStyle styleId={945380644} css={`p[data-jsx="2520901095"] {color: ${darken(color) + 2} }`} />
    <_JSXStyle styleId={4106311606} css={`@media (min-width: ${mediumScreen}) {p[data-jsx="2520901095"] {color: green }p[data-jsx="2520901095"] {color ${`red`}}}p[data-jsx="2520901095"] {color: red }`} />
  </div>);
