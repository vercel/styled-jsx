// Definitions by: @types/styled-jsx <https://www.npmjs.com/package/@types/styled-jsx>

import { ReactElement } from 'react'

declare function flushToHTML(opts?: { nonce?: string }): string
declare function flushToReact<T>(opts?: {
  nonce?: string
}): Array<ReactElement<T>>

export { flushToHTML }
export default flushToReact
