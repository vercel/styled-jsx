import _JSXStyle from 'styled-jsx/style';
import styles from './styles';
const styles2 = require('./styles2');
import { foo as styles3 } from './styles';

export default (() => <div data-jsx={1144769207}>
    <p data-jsx={1144769207}>test</p>
    <p data-jsx={1144769207}>woot</p>
    <_JSXStyle styleId={styles2.__hash} css={styles2} />
    <_JSXStyle styleId={styles3.__hash} css={styles3} />
    <div data-jsx={1144769207}>woot</div>
    <_JSXStyle styleId={1144769207} css={"p[data-jsx=\"1144769207\"] {color: red}div[data-jsx=\"1144769207\"] {color: green;}"} />
    <_JSXStyle styleId={styles.__hash} css={styles} />
  </div>);
