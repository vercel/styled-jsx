const color = 'red';

export default {
  global: `
  div { font-size: 3em }
  p { color: ${color}}
`,
  local: `div[data-jsx-ext~="__styleJsxId_mock__"] {font-size: 3em}p[data-jsx-ext~="__styleJsxId_mock__"] {color: ${color}}
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0eWxlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFZSxBQUVNLCtDQUNGIiwiZmlsZSI6InN0eWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNvbG9yID0gJ3JlZCdcblxuZXhwb3J0IGRlZmF1bHQgYFxuICBkaXYgeyBmb250LXNpemU6IDNlbSB9XG4gIHAgeyBjb2xvcjogJHtjb2xvcn19XG5gXG4iXX0= */
/*@ sourceURL=styles.js */`
};
