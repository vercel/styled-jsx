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

export const mockStyleJsxId = (function () {
  const regex = new RegExp(
     `(${MARKUP_ATTRIBUTE}|${MARKUP_ATTRIBUTE_EXTERNAL}|${STYLE_COMPONENT_ID})(~?=)([\\{\\\\"]+)[^\\\\"\\}]+([\\}\\\\"]+)`,
    'g'
  )
  function wrap(chr) {
    if (chr === '{') {
      return `${chr}"`
    }
    if (chr === '}') {
      return `"${chr}`
    }
    return chr.replace(/\\/g, '\\')
  }
  return css => css.replace(regex, (_, attr, eq, l, r) => (
    `${attr}${eq}${wrap(l)}__styleJsxId_mock__${wrap(r)}`)
  )
})()
