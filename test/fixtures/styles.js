const color = 'red'

export const foo = `div { color: ${color}}`

export default `
  div { font-size: 3em }
  p { color: ${color}}
`

const expr = 'test'

export const expressionsTest = `
  div {
  display: ${expr};
    color: ${expr};
    ${expr};
    ${expr};
    background: red;
  animation: ${expr} 10s ease-out;
  }

  @media (${expr}) {
   div.${expr} {
    color: red;
   }
  ${expr} {
    color: red;
  }
  }

  @media (min-width: ${expr}) {
   div.${expr} {
    color: red;
   }
  all${expr} {
    color: red;
  }
  }

  @font-face {
    ${expr}
  }
`
