import styles from './styles'

const styles2 = require('./styles2')

// external only
export const Test1 = () =>
  <div>
    <p>external only</p>
    <style jsx>
      {styles}
    </style>
    <style jsx>
      {styles2}
    </style>
  </div>

// external and static
export const Test2 = () =>
  <div>
    <p>external and static</p>
    <style jsx>{`
      p {
        color: red;
      }
    `}</style>
    <style jsx>
      {styles}
    </style>
  </div>

// external and dynamic
export const Test3 = ({ color }) =>
  <div>
    <p>external and dynamic</p>
    <style jsx>{`
      p {
        color: ${color};
      }
    `}</style>
    <style jsx>
      {styles}
    </style>
  </div>

// external, static and dynamic
export const Test4 = ({ color }) =>
  <div>
    <p>external, static and dynamic</p>
    <style jsx>{`
      p {
        display: inline-block;
      }
    `}</style>
    <style jsx>{`
      p {
        color: ${color};
      }
    `}</style>
    <style jsx>
      {styles}
    </style>
  </div>

// static only
export const Test5 = () =>
  <div>
    <p>static only</p>
    <style jsx>{`
      p {
        display: inline-block;
      }
    `}</style>
    <style jsx>{`
      p {
        color: red;
      }
    `}</style>
  </div>

// static and dynamic
export const Test6 = ({ color }) =>
  <div>
    <p>static and dynamic</p>
    <style jsx>{`
      p {
        display: inline-block;
      }
    `}</style>
    <style jsx>{`
      p {
        color: ${color};
      }
    `}</style>
  </div>

// dynamic only
export const Test7 = ({ color }) =>
  <div>
    <p>dynamic only</p>
    <style jsx>{`
      p {
        color: ${color};
      }
    `}</style>
  </div>
