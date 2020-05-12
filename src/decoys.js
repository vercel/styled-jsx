function notTranspiledError(name) {
  throw new Error(
    'styled-jsx/css: if you are getting this error it means that your `' +
      name +
      '` tagged template literals were not transpiled.'
  )
}

export function css() {
  notTranspiledError('css')
}

export function global() {
  notTranspiledError('global')
}

export function resolve() {
  notTranspiledError('resolve')
}
