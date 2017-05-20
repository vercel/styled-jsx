const color = 'red';

export const foo = new String(`div {color: ${color}}`);

foo.__hash = '12372219376';
foo.__scoped = `div[data-jsx-ext~="22372219376"] {color: ${color}}`;
foo.__scopedHash = '22372219376';

var __styledJsxDefaultExport = new String(`div {font-size: 3em} p {color: ${color}}`);

__styledJsxDefaultExport.__hash = '11196972566';
__styledJsxDefaultExport.__scoped = `div[data-jsx-ext~="21196972566"] {font-size: 3em}p[data-jsx-ext~="21196972566"] {color: ${color}}`;
__styledJsxDefaultExport.__scopedHash = '21196972566';
export default __styledJsxDefaultExport;
