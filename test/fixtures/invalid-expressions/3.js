export function Test({color}) {
  return (
    <div>
      <p>test</p>
      <style jsx>{`p { color: ${color} }`}</style>
    </div>
  )
}
