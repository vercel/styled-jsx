import styles from './styles'
import styles2 from './styles2'

export default () => (
  <div>
    <p>test</p>
    <p>woot</p>
    <style jsx global>{styles2}</style>
    <div>woot</div>
    <style jsx>{`
      p { color: red }
      div { color: green; }
    `}</style>
    <style jsx>{styles}</style>
  </div>
)
