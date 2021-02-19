// Definitions by: @types/styled-jsx <https://www.npmjs.com/package/@types/styled-jsx>

import { ReactElement } from 'react'

export declare class StyleSheetRegistry {
  constructor()

  // These are marked private just so that we don't have to deal with specifying
  // their return types (but they need to be here so that users don't just pass
  // arbitrary objects in its place).
  private cssRules()
  private flush()
}

export interface FlushOpts {
  nonce?: string
  registry?: StyleSheetRegistry
}

export declare function flushToHTML(opts?: FlushOpts): string

declare function flushToReact<T>(opts?: FlushOpts): Array<ReactElement<T>>
export default flushToReact
