import _JSXStyle from 'styled-jsx/style';
const color = 'red';
const otherColor = 'green';

const A = () => <div data-jsx={924167211}>
    <p data-jsx={924167211}>test</p>
    <_JSXStyle styleId={924167211} css={`p[data-jsx="924167211"] {color: ${color} }`} />
  </div>;

const B = () => <div data-jsx={45234319}>
    <p data-jsx={45234319}>test</p>
    <_JSXStyle styleId={45234319} css={`p[data-jsx="45234319"] {color: ${otherColor} }`} />
  </div>;

export default (() => <div>
    <A />
    <B />
  </div>);

