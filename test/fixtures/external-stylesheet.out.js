import _JSXStyle from 'styled-jsx/style';
import styles from './styles';
const styles2 = require('./styles2');

export default (() => <div data-jsx={"__styleJsxId_mock__"} data-jsx-ext={"__styleJsxId_mock__"}>
    <p data-jsx={"__styleJsxId_mock__"} data-jsx-ext={"__styleJsxId_mock__"}>test</p>
    <p data-jsx={"__styleJsxId_mock__"} data-jsx-ext={"__styleJsxId_mock__"}>woot</p>
    <_JSXStyle styleId={"__styleJsxId_mock__"} css={styles2.global} />
    <div data-jsx={"__styleJsxId_mock__"} data-jsx-ext={"__styleJsxId_mock__"}>woot</div>
    <_JSXStyle styleId={"__styleJsxId_mock__"} css={"p[data-jsx=\"__styleJsxId_mock__\"] {color: red}div[data-jsx=\"__styleJsxId_mock__\"] {color: green;}"} />
    <_JSXStyle styleId={"__styleJsxId_mock__"} css={styles.local} />
  </div>);
