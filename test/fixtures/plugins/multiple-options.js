export default (css, settings) => {
  console.log(settings)
  return `.test { content: "${JSON.stringify(settings)}"; }`
}
