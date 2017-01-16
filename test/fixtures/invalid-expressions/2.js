export function Test(props) {
  const {darken} = props
  return (
    <div>
      <p>test</p>
      <style jsx>{`p { color: ${darken(color)} }`}</style>
    </div>
  )
}
