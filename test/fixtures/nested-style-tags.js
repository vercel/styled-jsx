import styles from './styles'

export default () => (
  <div>
    <span>
      test
      <style jsx>
        {`
          div {
            color: red;
          }
        ` /* this should not be transpiled */}
      </style>
    </span>
    <style jsx>{`
      span {
        color: red;
      }
    `}</style>
  </div>
)

export const Test = () => (
  <div>
    <span>
      test
      <style jsx>
        {`
          div {
            color: red;
          }
        ` /* this should not be transpiled */}
      </style>
      <Component>
        <style jsx>
          {`
            div {
              color: red;
            }
          ` /* this should not be transpiled */}
        </style>
        <style jsx>{styles}</style> {/* this should not be transpiled */}
      </Component>
    </span>
    <style jsx>{`
      span {
        color: red;
      }
    `}</style>
    <style jsx>{styles}</style>
  </div>
)
