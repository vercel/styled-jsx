const darken = c => c
const color = 'red'
const otherColor = 'green'
const mediumScreen = '680px'
const animationDuration = '200ms'
const animationName = 'my-cool-animation'
const obj = { display: 'block' }

// eslint-disable-next-line no-unused-vars
export default ({ display }) => (
  <div>
    <p>test</p>
    <style
      jsx
    >{`p.${color} { color: ${otherColor}; display: ${obj.display} }`}</style>
    <style jsx>{'p { color: red }'}</style>
    <style jsx global>{`body { background: ${color} }`}</style>
    <style jsx global>{`body { background: ${color} }`}</style>
    <style jsx>{`p { color: ${color} }`}</style>
    <style jsx>{`p { color: ${color} }`}</style>
    <style jsx>{`p { color: ${darken(color)} }`}</style>
    <style jsx>{`p { color: ${darken(color) + 2} }`}</style>
    <style jsx>{`
      @media (min-width: ${mediumScreen}) {
        p { color: green }
        p { color: ${`red`}}
      }
      p { color: red }`}</style>
    <style jsx>{`p { animation-duration: ${animationDuration} }`}</style>
    <style jsx>{`
      p { animation: ${animationDuration} forwards ${animationName} }`}</style>
  </div>
)
