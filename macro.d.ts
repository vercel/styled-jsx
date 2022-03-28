declare namespace css {
  function resolve(
    chunks: TemplateStringsArray,
    ...args: any[]
  ): {
    className: string
    styles: JSX.Element
  }
}

export = css
