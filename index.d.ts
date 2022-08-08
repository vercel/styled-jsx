import React from 'react'

declare module 'react' {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
}

declare module 'styled-jsx' {
  export type StyledJsxStyleRegistry = {
    styles(options?: { nonce?: string }): JSX.Element[]
    flush(): void
    add(props: any): void
    remove(props: any): void
  }
  export function useStyleRegistry(): StyledJsxStyleRegistry
  export function StyleRegistry({
    children,
    registry
  }: {
    children: JSX.Element | React.ReactNode
    registry?: StyledJsxStyleRegistry
  }): JSX.Element
  export function createStyleRegistry(): StyledJsxStyleRegistry
}
