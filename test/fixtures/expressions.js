const color = 'red'

export default () => (
  <div>
    <p>test</p>
    <style jsx>{`p { color: red }`}</style>
    <style jsx>{'p { color: red }'}</style>
    <style jsx global>{`body { background: ${color} }`}</style>
    <style jsx>{`p { color: ${color} }`}</style>
    <style jsx>{`p { color: ${darken(color)} }`}</style>
    <style jsx>{`p { color: ${darken(color) + 2} }`}</style>
  </div>
)

