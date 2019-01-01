import path from 'path'
import { transform, transformFile } from '@babel/core'

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
    transform(
      src,
      {
        babelrc: false,
        ...opts
      },
      (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      }
    )
  })
