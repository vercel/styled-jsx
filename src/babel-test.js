import jsx from 'babel-plugin-syntax-jsx'

export default function() {
  return {
    inherits: jsx,
    visitor: {
      JSXOpeningElement(path) {
        const el = path.node
        const { name } = el.name || {}

        if (name !== 'style') {
          return
        }

        el.attributes = el.attributes.filter(a => a.name.name !== 'jsx')
      }
    }
  }
}
