const color = 'red';

export default {
  global: `
  div { font-size: 3em }
  p { color: ${color}}
`,
  local: `div[data-jsx~="626947301"] {font-size: 3em}p[data-jsx~="626947301"] {color: ${color}}`
};
