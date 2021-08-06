import jsx from '@babel/plugin-syntax-jsx'

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

        el.attributes = el.attributes.filter(a => {
          const name = a.name.name
          return name !== 'jsx' && name !== 'global'
        })
      }
    }
  }
}
