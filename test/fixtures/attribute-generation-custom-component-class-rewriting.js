import test from 'ava'

export default () => {
  const Element = 'custom-component'
  return (
    <custom-component>
      <custom-component class="test" {...test.test} />
      <style jsx>{'custom-component { color: red }'}</style>
    </custom-component>
  )
}
