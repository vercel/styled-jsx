// Definitions by: @types/styled-jsx <https://www.npmjs.com/package/@types/styled-jsx>

import 'react'

export * from './server'
export * from './css'

declare module 'react' {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
}
