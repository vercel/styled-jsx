export default (css, settings) => {
  let { babel, ...s } = settings
  let { filename, ...b } = babel
  s.babel = b
  if (!filename) {
    throw new Error('filename should be defined')
  }
  return `.test { content: "${JSON.stringify(s)}"; }`
}
