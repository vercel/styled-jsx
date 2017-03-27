import path from 'path'
import {transformFile} from 'babel-core'

export default (file, opts = {}) => (
  new Promise((resolve, reject) => {
    transformFile(
      path.resolve(__dirname, file),
      {
        babelrc: false,
        ...opts
      },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      }
    )
  })
)
