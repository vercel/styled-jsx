const color = 'red';

export const foo = new String(`div { color: ${color}}`);

foo.__hash = '14202509072';
foo.__scoped = `div[data-jsx-ext~="24202509072"] {color: ${color}}`;
foo.__scopedHash = '24202509072';

var __styledJsxDefaultExport = new String(`
  div { font-size: 3em }
  p { color: ${color}}
`);

__styledJsxDefaultExport.__hash = '12695824182';
__styledJsxDefaultExport.__scoped = `div[data-jsx-ext~="22695824182"] {font-size: 3em}p[data-jsx-ext~="22695824182"] {color: ${color}}`;
__styledJsxDefaultExport.__scopedHash = '22695824182';
export default __styledJsxDefaultExport;
