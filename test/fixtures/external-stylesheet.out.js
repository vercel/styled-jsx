import _JSXStyle from 'styled-jsx/style';
import styles from './styles';
const styles2 = require('./styles2');
import { foo as styles3 } from './styles';

export default (() => <div data-jsx={1144769207} data-jsx-ext={`${styles3.__scopedHash} ${styles.__scopedHash}`}>
    <p data-jsx={1144769207} data-jsx-ext={`${styles3.__scopedHash} ${styles.__scopedHash}`}>test</p>
    <p data-jsx={1144769207} data-jsx-ext={`${styles3.__scopedHash} ${styles.__scopedHash}`}>woot</p>
    <_JSXStyle styleId={styles2.__hash} css={styles2} />
    <_JSXStyle styleId={styles3.__scopedHash} css={styles3.__scoped} />
    <div data-jsx={1144769207} data-jsx-ext={`${styles3.__scopedHash} ${styles.__scopedHash}`}>woot</div>
    <_JSXStyle styleId={1144769207} css={"p[data-jsx=\"1144769207\"] {color: red}div[data-jsx=\"1144769207\"] {color: green;}"} />
    <_JSXStyle styleId={styles.__scopedHash} css={styles.__scoped} />
  </div>);
