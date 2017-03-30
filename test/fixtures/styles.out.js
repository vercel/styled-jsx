const color = 'red';

export default {
  global: `
  div { font-size: 3em }
  p { color: ${color}}
`,
  local: `div[data-jsx-ext~="__styleJsxId_mock__"] {font-size: 3em}p[data-jsx-ext~="__styleJsxId_mock__"] {color: ${color}}`
};
