import { resolve } from 'path'
import { promises as fs } from 'fs'

export default async path => {
  const buffer = await fs.readFile(resolve(__dirname, path))
  return buffer.toString()
}
