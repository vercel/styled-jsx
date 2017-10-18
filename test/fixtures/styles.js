import css from 'styled-jsx/css'
import colors, { size } from './constants'
const color = 'red'

const bar = css`
  div {
    font-size: 3em;
  }
`

const a = css`
  div {
    font-size: ${size}em;
  }
`

const b = css`
  div {
    color: ${colors.green.light};
  }
`

export const uh = bar

export const foo = css`div { color: ${color}}`

export default css`
  div {
    font-size: 3em;
  }
  p {
    color: ${color};
  }
`
