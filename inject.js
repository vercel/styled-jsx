import memory from './memory'

const isBrowser = typeof window !== 'undefined'
const tags = {}

export default function inject(id, css) {
  if (isBrowser) {
    // if the tag is already present we ignore it!
    if (!tags[id]) {
      const el = makeStyleTag(css)
      tags[id] = el
      memory[id] = el
    }
  } else {
    memory[id] = css
  }
}

function makeStyleTag(str) {
  // based on implementation by glamor
  const tag = document.createElement('style')
  tag.type = 'text/css'
  tag.appendChild(document.createTextNode(str))(document.head || document.getElementsByTagName('head')[0]).appendChild(tag)
  return tag
}
