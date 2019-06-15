import { wrapElementWithProvider } from './stylesheet-registry-context'
import StyleSheetRegistry from './stylesheet-registry'

export class AbstractStyledJsxServer {
  constructor(reactDomServer, options) {
    this.reactDomServer = reactDomServer
    this.options = options
  }

  registry() {
    return new StyleSheetRegistry(this.options)
  }

  _callServerMethod(method, element) {
    const registry = this.registry()
    const result = this.reactDomServer[method](
      wrapElementWithProvider(element, registry)
    )
    return this.processResults(result, registry)
  }

  renderToString(element) {
    return this._callServerMethod('renderToString', element)
  }

  renderToStaticMarkup(element) {
    return this._callServerMethod('renderToStaticMarkup', element)
  }

  renderToNodeStream(element) {
    return this._callServerMethod('renderToNodeStream', element)
  }

  renderToStaticNodeStream(element) {
    return this._callServerMethod('renderToStaticNodeStream', element)
  }

  processResults() {
    throw new Error('must implement processResults function')
  }
}

export default class SimpleStyledJsxServer extends AbstractStyledJsxServer {
  processResults(result, registry) {
    return { registry, result }
  }
}
