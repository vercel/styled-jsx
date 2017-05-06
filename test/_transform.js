import path from 'path'
import {transformFile} from 'babel-core'

import {
  MARKUP_ATTRIBUTE,
  MARKUP_ATTRIBUTE_EXTERNAL,
  STYLE_COMPONENT_ID
} from '../src/_constants'

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
