import {resolve} from 'path'
import {readFile} from 'fs-promise'

export default async path => {
  const buffer = await readFile(resolve(__dirname, path))
  return buffer.toString()
}
