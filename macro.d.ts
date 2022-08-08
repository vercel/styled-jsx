declare module 'styled-jsx/marco' {
  namespace marco {
    function resolve(
      chunks: TemplateStringsArray,
      ...args: any[]
    ): {
      className: string
      styles: JSX.Element
    }
  }

  export = marco
}
