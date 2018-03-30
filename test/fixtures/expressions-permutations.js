;`
// selector selector selector
${expr} ${expr} ${expr},
div {
  // value
  display: ${expr};
  // value
  color: ${expr};
  // declaration
  ${expr};
  // declaration
  ${expr}
  // declaration
  ${expr};
  background: red;
  // value
  animation: ${expr} 10s ease-out;
  // value
  animation: foo ${expr} ease-out;
  // value
  padding: 10px ${expr};
  // value value
  padding: ${expr} ${expr};
  // value value value
  padding: ${expr} ${expr} ${expr};
}

div {
  color: red;
  // declaration
  ${expr}
}

// media
@media (${expr}) {

  // selector
  ${expr}
  // selector
  span.${expr} {
    color: red;
  }

  // selector
  ${expr}

  // selector
  ${expr} {
    color: red;
  }

  // selector, selector
  ${expr}, ${expr} {
    color: red;
  }

  // selector
  ${expr}
  // selector
  div, ${expr} {
    color: red;
  }
}

div {
  // property
  ${expr}: red;
}

// value
@media (min-width: ${expr}) {
  // selector
  div.${expr} {
    color: red;
  }

  // selector
  all${expr} {
    // declaration
    ${expr}
    color: red;
  }
}

@font-face {
  // declaration
  ${expr}
}`
