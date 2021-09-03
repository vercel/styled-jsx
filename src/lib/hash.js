import hashString from 'string-hash'

const sanitize = rule => rule.replace(/\/style/gi, '\\/style')
const cache = {}

/**
 * computeId
 *
 * Compute and memoize a jsx id from a basedId and optionally props.
 */
export function computeId(baseId, props) {
  if (!props) {
    return `jsx-${baseId}`
  }

  const propsToString = String(props)
  const key = baseId + propsToString

  if (!cache[key]) {
    cache[key] = `jsx-${hashString(`${baseId}-${propsToString}`)}`
  }

  return cache[key]
}

/**
 * computeSelector
 *
 * Compute and memoize dynamic selectors.
 */
export function computeSelector(id, css) {
  const selectoPlaceholderRegexp = /__jsx-style-dynamic-selector/g
  // Sanitize SSR-ed CSS.
  // Client side code doesn't need to be sanitized since we use
  // document.createTextNode (dev) and the CSSOM api sheet.insertRule (prod).
  if (typeof window === 'undefined') {
    css = sanitize(css)
  }

  const idcss = id + css
  if (!cache[idcss]) {
    cache[idcss] = css.replace(selectoPlaceholderRegexp, id)
  }

  return cache[idcss]
}
