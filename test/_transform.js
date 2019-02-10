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
      (error, data) => {
        if (error) {
          return reject(error)
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
      (error, result) => {
        if (error) {
          return reject(error)
        }

        resolve(result)
      }
    )
  })
