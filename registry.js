module.exports = require('./dist/stylesheet-registry')

const context = require('./dist/stylesheet-registry-context').default

module.exports.RegistryProvider = context.Provider
module.exports.RegistryConsumer = context.Consumer
