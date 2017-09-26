import * as t from 'babel-types'
import escapeStringRegExp from 'escape-string-regexp'
import traverse from 'babel-traverse'
import { parse } from 'babylon'
import { parse as parseCss } from 'css-tree'
import { SourceMapGenerator } from 'source-map'
import convert from 'convert-source-map'

import {
  STYLE_ATTRIBUTE,
  GLOBAL_ATTRIBUTE,
  STYLE_COMPONENT_ID,
  STYLE_COMPONENT,
  STYLE_COMPONENT_CSS
} from './_constants'

export const isGlobalEl = el =>
  el.attributes.some(({ name }) => name && name.name === GLOBAL_ATTRIBUTE)

export const isStyledJsx = ({ node: el }) =>
  t.isJSXElement(el) &&
  el.openingElement.name.name === 'style' &&
  el.openingElement.attributes.some(attr => attr.name.name === STYLE_ATTRIBUTE)

export const findStyles = path => {
  if (isStyledJsx(path)) {
    const { node } = path
    return isGlobalEl(node.openingElement) ? [path] : []
  }

  return path.get('children').filter(isStyledJsx)
}

export const getExpressionText = expr => {
  const node = expr.node

  // Assume string literal
  if (t.isStringLiteral(node)) {
    return node.value
  }

  const expressions = expr.get('expressions')

  // Simple template literal without expressions
  if (expressions.length === 0) {
    return node.quasis[0].value.cooked
  }

  // Special treatment for template literals that contain expressions:
  //
  // Expressions are replaced with a placeholder
  // so that the CSS compiler can parse and
  // transform the css source string
  // without having to know about js literal expressions.
  // Later expressions are restored
  // by doing a replacement on the transformed css string.
  //
  // e.g.
  // p { color: ${myConstant}; }
  // becomes
  // p { color: %%styled-jsx-placeholder-${id}%%; }

  const replacements = expressions
    .map((e, id) => ({
      pattern: new RegExp(
        `\\$\\{\\s*${escapeStringRegExp(e.getSource())}\\s*\\}`
      ),
      replacement: `%%styled-jsx-placeholder-${id}%%`,
      initial: `$\{${e.getSource()}}`
    }))
    .sort((a, b) => a.initial.length < b.initial.length)

  const source = expr.getSource().slice(1, -1)

  const modified = replacements.reduce((source, currentReplacement) => {
    source = source.replace(
      currentReplacement.pattern,
      currentReplacement.replacement
    )
    return source
  }, source)

  return {
    source,
    modified,
    replacements
  }
}

export const restoreExpressions = (css, replacements) =>
  replacements.reduce((css, currentReplacement) => {
    css = css.replace(
      new RegExp(currentReplacement.replacement, 'g'),
      currentReplacement.initial
    )
    return css
  }, css)

export const makeStyledJsxCss = (transformedCss, isTemplateLiteral) => {
  if (!isTemplateLiteral) {
    return t.stringLiteral(transformedCss)
  }
  // Build the expression from transformedCss
  let css
  traverse(parse(`\`${transformedCss}\``), {
    TemplateLiteral(path) {
      if (!css) {
        css = path.node
      }
    }
  })
  return css
}

export const makeStyledJsxTag = (id, transformedCss, isTemplateLiteral) => {
  let css

  if (
    typeof transformedCss === 'object' &&
    (t.isIdentifier(transformedCss) || t.isMemberExpression(transformedCss))
  ) {
    css = transformedCss
  } else {
    css = makeStyledJsxCss(transformedCss, isTemplateLiteral)
  }

  return t.jSXElement(
    t.jSXOpeningElement(
      t.jSXIdentifier(STYLE_COMPONENT),
      [
        t.jSXAttribute(
          t.jSXIdentifier(STYLE_COMPONENT_ID),
          t.jSXExpressionContainer(
            typeof id === 'number' ? t.numericLiteral(id) : id
          )
        ),
        t.jSXAttribute(
          t.jSXIdentifier(STYLE_COMPONENT_CSS),
          t.jSXExpressionContainer(css)
        )
      ],
      true
    ),
    null,
    []
  )
}

// We only allow constants to be used in template literals.
// The following visitor ensures that MemberExpressions and Identifiers
// are not in the scope of the current Method (render) or function (Component).
export const validateExpressionVisitor = {
  MemberExpression(path, scope) {
    const { node } = path
    if (
      (t.isIdentifier(node.property) &&
        (t.isThisExpression(node.object) &&
          (node.property.name === 'props' ||
            node.property.name === 'state'))) ||
      (t.isIdentifier(node.object) && scope.hasOwnBinding(node.object.name))
    ) {
      throw path.buildCodeFrameError(
        `Expected a constant ` +
          `as part of the template literal expression ` +
          `(eg: <style jsx>{\`p { color: $\{myColor}\`}</style>), ` +
          `but got a MemberExpression: this.${node.property.name}`
      )
    }
  },
  Identifier(path, scope) {
    if (t.isMemberExpression(path.parentPath)) {
      return
    }
    const { name } = path.node
    if (scope.hasOwnBinding(name)) {
      throw path.buildCodeFrameError(
        `Expected \`${name}\` ` +
          `to not come from the closest scope.\n` +
          `Styled JSX encourages the use of constants ` +
          `instead of \`props\` or dynamic values ` +
          `which are better set via inline styles or \`className\` toggling. ` +
          `See https://github.com/zeit/styled-jsx#dynamic-styles`
      )
    }
  }
}

export const validateExpression = (expr, scope) =>
  expr.traverse(validateExpressionVisitor, scope)

export const generateAttribute = (name, value) =>
  t.jSXAttribute(t.jSXIdentifier(name), t.jSXExpressionContainer(value))

export const isValidCss = str => {
  try {
    parseCss(
      // Replace the placeholders with some valid CSS
      // so that parsing doesn't fail for otherwise valid CSS.
      str
        // Replace all the placeholders with `all`
        .replace(
          // `\S` (the `delimiter`) is to match
          // the beginning of a block `{`
          // a property `:`
          // or the end of a property `;`
          /(\S)?\s*%%styled-jsx-placeholder-[^%]+%%(?:\s*(\}))?/gi,
          (match, delimiter, isBlockEnd) => {
            // The `end` of the replacement would be
            let end

            if (delimiter === ':' && isBlockEnd) {
              // ';}' single property block without semicolon
              // E.g. { color: all;}
              end = `;}`
            } else if (delimiter === '{' || isBlockEnd) {
              // ':;' when we are at the beginning or the end of a block
              // E.g. { all:; ...otherstuff
              // E.g. all:; }
              end = `:;${isBlockEnd || ''}`
            } else if (delimiter === ';') {
              // ':' when we are inside of a block
              // E.g. color: red; all:; display: block;
              end = ':'
            } else {
              // Otherwise empty
              end = ''
            }

            return `${delimiter || ''}all${end}`
          }
        )
        // Replace block placeholders before media queries
        // E.g. all @media (all) {}
        .replace(/all\s*([@])/g, (match, delimiter) => `all {} ${delimiter}`)
        // Replace block placeholders at the beginning of a media query block
        // E.g. @media (all) { all:; div { ... }}
        .replace(/@media[^{]+{\s*all:;/g, '@media (all) { ')
    )
    return true
  } catch (err) {}
  return false
}

export const makeSourceMapGenerator = file => {
  const filename = file.opts.sourceFileName
  const generator = new SourceMapGenerator({
    file: filename,
    sourceRoot: file.opts.sourceRoot
  })

  generator.setSourceContent(filename, file.code)
  return generator
}

export const addSourceMaps = (code, generator, filename) =>
  [
    code,
    convert.fromObject(generator).toComment({ multiline: true }),
    `/*@ sourceURL=${filename} */`
  ].join('\n')

export const combinePlugins = (plugins, opts) => {
  if (!plugins) {
    return css => css
  }

  if (
    !Array.isArray(plugins) ||
    plugins.some(p => !Array.isArray(p) && typeof p !== 'string')
  ) {
    throw new Error(
      '`plugins` must be an array of plugins names (string) or an array `[plugin-name, {options}]`'
    )
  }

  return plugins
    .map((plugin, i) => {
      let options = {}
      if (Array.isArray(plugin)) {
        options = plugin[1] || {}
        plugin = plugin[0]
      }

      // eslint-disable-next-line import/no-dynamic-require
      let p = require(plugin)
      if (p.default) {
        p = p.default
      }

      const type = typeof p
      if (type !== 'function') {
        throw new Error(
          `Expected plugin ${plugins[i]} to be a function but instead got ${type}`
        )
      }
      return {
        plugin: p,
        settings: {
          ...opts,
          options
        }
      }
    })
    .reduce(
      (previous, { plugin, settings }) => css =>
        plugin(previous ? previous(css) : css, settings),
      null
    )
}
