import _JSXStyle from 'styled-jsx/style';
const color = 'red';
const otherColor = 'green';
const mediumScreen = '680px';
const animationDuration = '200ms';
const animationName = 'my-cool-animation';

export default (() => <div data-jsx={2422200148}>
    <p data-jsx={2422200148}>test</p>
    <_JSXStyle styleId={414042974} css={`p.${color}[data-jsx="2422200148"] {color: ${otherColor}}`} />
    <_JSXStyle styleId={188072295} css={"p[data-jsx=\"2422200148\"] {color: red}"} />
    <_JSXStyle styleId={806016056} css={`body { background: ${color} }`} />
    <_JSXStyle styleId={2278229016} css={`body { background: ${color} }`} />
    <_JSXStyle styleId={924167211} css={`p[data-jsx="2422200148"] {color: ${color}}`} />
    <_JSXStyle styleId={1586014475} css={`p[data-jsx="2422200148"] {color: ${color}}`} />
    <_JSXStyle styleId={3469794077} css={`p[data-jsx="2422200148"] {color: ${darken(color)}}`} />
    <_JSXStyle styleId={945380644} css={`p[data-jsx="2422200148"] {color: ${darken(color) + 2}}`} />
    <_JSXStyle styleId={4106311606} css={`@media (min-width: ${mediumScreen}) {p[data-jsx="2422200148"] {color: green}p[data-jsx="2422200148"] {color ${`red`}}}p[data-jsx="2422200148"] {color: red}`} />
    <_JSXStyle styleId={2369334310} css={`p[data-jsx="2422200148"] {-webkit-animation-duration:${animationDuration};animation-duration:${animationDuration};}`} />
    <_JSXStyle styleId={3168033860} css={`p[data-jsx="2422200148"] {-webkit-animation:${animationDuration} forwards ${animationName};animation:${animationDuration} forwards ${animationName};}`} />
  </div>);
