import _JSXStyle from 'styled-jsx/style';
const color = 'red';
const otherColor = 'green';
const mediumScreen = '680px';
const animationDuration = '200ms';

export default (() => <div data-jsx={3422891701}>
    <p data-jsx={3422891701}>test</p>
    <_JSXStyle styleId={414042974} css={`p.${color}[data-jsx="3422891701"] {color: ${otherColor} }`} />
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"3422891701\"] {color: red }"} />
    <_JSXStyle styleId={806016056} css={`body { background: ${color} }`} />
    <_JSXStyle styleId={2278229016} css={`body { background: ${color} }`} />
    <_JSXStyle styleId={924167211} css={`p[data-jsx="3422891701"] {color: ${color} }`} />
    <_JSXStyle styleId={1586014475} css={`p[data-jsx="3422891701"] {color: ${color} }`} />
    <_JSXStyle styleId={3469794077} css={`p[data-jsx="3422891701"] {color: ${darken(color)} }`} />
    <_JSXStyle styleId={945380644} css={`p[data-jsx="3422891701"] {color: ${darken(color) + 2} }`} />
    <_JSXStyle styleId={4106311606} css={`@media (min-width: ${mediumScreen}) {p[data-jsx="3422891701"] {color: green }p[data-jsx="3422891701"] {color ${`red`}}}p[data-jsx="3422891701"] {color: red }`} />
    <_JSXStyle styleId={2369334310} css={`p[data-jsx="3422891701"] {-webkit-animation-duration:${animationDuration};-moz-animation-duration:${animationDuration};animation-duration:${animationDuration};`} />
  </div>);
