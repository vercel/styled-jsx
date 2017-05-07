import styles from './styles'
const styles2 = require('./styles2')

export default () => (
  <div>
    <p>test</p>
    <p>woot</p>
    <style jsx global>{styles2}</style>
    <style jsx>{styles2}</style>
    <div>woot</div>
    <style jsx>{`
      p { color: red }
      div { color: green; }
    `}</style>
    <style jsx>{styles}</style>
  </div>
)
