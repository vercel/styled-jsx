import css, { resolve } from '../../test/helpers/babel-test.macro'

const { className, styles } = resolve`
  div { color: red }
`

const dynamicStyles = props => resolve`
  div { color: ${props.color} }
`

const test = css.resolve`
  div { color: red }
`

const dynamicStyles2 = props => css.resolve`
  div { color: ${props.color} }
`

const ExampleComponent = props => {
  const { className, styles } = dynamicStyles(props)

  return (
    <div className={className}>
      howdy
      {styles}
    </div>
  )
}
