declare module 'react' {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
}

export type StyleRegistry = {
  styles(options: { nonce?: boolean }): JSX.Element
  flush(): void
}
export function useStyleRegistry(): StyleRegistry
export function StyleRegistry({
  children
}: {
  children: JSX.Element
}): JSX.Element
