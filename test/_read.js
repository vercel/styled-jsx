import { resolve } from 'path'
import { readFile } from 'fs/promises'

export default async path => {
  const buffer = await readFile(resolve(__dirname, path))
  return buffer.toString()
}
