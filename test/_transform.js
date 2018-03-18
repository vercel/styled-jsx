import path from 'path'
import { transformFile, transform } from 'babel-core'

export default (file, opts = {}) =>
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

export const transformSource = (src, opts = {}) =>
  new Promise((resolve, reject) => {
    try {
      resolve(
        // In Babel 7 this will be async
        transform(src, {
          babelrc: false,
          ...opts
        })
      )
    } catch (err) {
      reject(err)
    }
  })
