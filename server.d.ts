// Definitions by: @types/styled-jsx <https://www.npmjs.com/package/@types/styled-jsx>

import * as React from 'react'

export declare class StyleSheetRegistry {
  constructor()

  // These exist just to enforce the shape of StyleSheetRegistry without
  // actually having to type the returns of these functions. This essentially
  // just prevents users from passing in arbitrary objects in place of
  // StyleSheetRegistry.
  cssRules
  flush
  flushRules
}

export declare const StyleSheetRegistryContext: React.Context<
  StyleSheetRegistry
>

export interface FlushOpts {
  nonce?: string
  registry?: StyleSheetRegistry
}

export declare function flushToHTML(opts?: FlushOpts): string

declare function flushToReact<T>(opts?: FlushOpts): Array<React.ReactElement<T>>
export default flushToReact
