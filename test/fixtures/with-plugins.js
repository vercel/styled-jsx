import styles from './styles'
const color = 'red'

export default () => (
  <div>
    <p>test</p>
    <style jsx>{`
      div.${color} {
        color: ${otherColor};
      }
    `}</style>
    <style jsx>{styles}</style>
  </div>
)
