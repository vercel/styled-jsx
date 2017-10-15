# styled-jsx

[![Build Status](https://travis-ci.org/zeit/styled-jsx.svg?branch=master)](https://travis-ci.org/zeit/styled-jsx)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

Full, scoped and component-friendly CSS support for JSX (rendered on the server or the client).


 Code and docs are for v2 which we highly recommend you to try. Looking for styled-jsx v1? Switch to the [v1 branch](https://github.com/zeit/styled-jsx/tree/v1).

## Usage

Firstly, install the package:

```bash
npm install --save styled-jsx
```

Next, add `styled-jsx/babel` to `plugins` in your babel configuration:

```json
{
  "plugins": [
    "styled-jsx/babel"
  ]
}
```

Now add `<style jsx>` to your code and fill it with CSS:

```jsx
export default () => (
  <div>
    <p>only this paragraph will get the style :)</p>

    { /* you can include <Component />s here that include
         other <p>s that don't get unexpected styles! */ }

    <style jsx>{`
      p {
        color: red;
      }
    `}</style>
  </div>
)
```

## Configuration

The following are optional settings for the babel plugin.

#### `optimizeForSpeed`

Blazing fast and optimized CSS rules injection system based on the CSSOM APIs.

```
{
  "plugins": [
    ["styled-jsx/babel", { "optimizeForSpeed": true }]
  ]
}
```
When in production\* this mode is automatically enabled.<br>
Beware that when using this option source maps cannot be generated and styles cannot be edited via the devtools.

\* `process.env.NODE_ENV === 'production'`


#### `sourceMaps`

Generates source maps (default: `false`)

#### `vendorPrefixes`

Turn on/off automatic vendor prefixing (default: `true`)

## Features

- Full CSS support, no tradeoffs in power
- Runtime size of just **3kb** (gzipped, from 12kb)
- Complete isolation: Selectors, animations, keyframes
- Built-in CSS vendor prefixing
- Very fast, minimal and efficient transpilation (see below)
- High-performance runtime-CSS-injection when not server-rendering
- Future-proof: Equivalent to server-renderable "Shadow CSS"
- Source maps support
- Dynamic styles and themes support \***new**
- CSS Preprocessing via Plugins \***new**

## How It Works

The example above transpiles to the following:

```jsx
import _JSXStyle from 'styled-jsx/style'

export default () => (
  <div className='jsx-123'>
    <p className='jsx-123'>only this paragraph will get the style :)</p>
    <_JSXStyle styleId='123' css={`p.jsx-123 {color: red;}`} />
  </div>
)
```

### Why It Works Like This

Unique classnames give us style encapsulation and `_JSXStyle` is heavily optimized for:

- Injecting styles upon render
- Only injecting a certain component's style once (even if the component is included multiple times)
- Removing unused styles
- Keeping track of styles for server-side rendering

### Keeping CSS in separate files

Styles can be defined in separate JavaScript modules by tagging with `css` any template literal that contain CSS.

`css` must be imported from `styled-jsx/css`:

```js
/* styles.js */
import css from 'styled-jsx/css'

export const button = css`button { color: hotpink; }`
export default css`div { color: green; }`
```

imported as regular strings:

```jsx
import styles, { button } from './styles'

export default () => (
  <div>
    <button>styled-jsx</button>
    <style jsx>{styles}</style>
    <style jsx>{button}</style>
  </div>
)
```

Styles are automatically scoped but you can also be consumed as [globals](#global-styles).

N.B. We support CommonJS exports but you can only export one string per module:

```js
module.exports = css`div { color: green; }`

// the following won't work
// module.exports = { styles: css`div { color: green; }` }
```

### Targeting The Root

Notice that the parent `<div>` from the example above also gets a `jsx-123` classname. We do this so that
you can target the "root" element, in the same manner that
[`:host`](https://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-201/#toc-style-host) works with Shadow DOM.

If you want to target _only_ the host, we suggest you use a class:

```jsx
export default () => (
  <div className="root">
    <style jsx>{`
      .root {
        color: green;
      }
    `}</style>
  </div>
)
```

### Global styles

To skip scoping entirely, you can make the global-ness of your styles
explicit by adding _global_.

```jsx
export default () => (
  <div>
    <style jsx global>{`
      body {
        background: red
      }
    `}</style>
  </div>
)
```

The advantage of using this over `<style>` is twofold: no need
to use `dangerouslySetInnerHTML` to avoid escaping issues with CSS
and take advantage of `styled-jsx`'s de-duping system to avoid
the global styles being inserted multiple times.

### Global selectors

Sometimes it's useful to skip prefixing. We support `:global()`,
inspired by [css-modules](https://github.com/css-modules/css-modules).

This is very useful in order to, for example, generate an *unprefixed class* that
you can pass to 3rd-party components. For example, to style
`react-select` which supports passing a custom class via `optionClassName`:

```jsx
import Select from 'react-select'
export default () => (
  <div>
    <Select optionClassName="react-select" />

    <style jsx>{`
      /* "div" will be prefixed, but ".react-select" won't */

      div :global(.react-select) {
        color: red
      }
    `}</style>
  </div>
)
```

### Dynamic styles

To make a component's visual representation customizable from the outside world there are three options.

#### Via interpolated dynamic props

Any value that comes from the component's `render` method scope is treated as dynamic. This makes it possible to use `props` and `state` for example.

```jsx
const Button = (props) => (
  <button>
     { props.children }
     <style jsx>{`
        button {
          padding: ${ 'large' in props ? '50' : '20' }px;
          background: ${props.theme.background};
          color: #999;
          display: inline-block;
          font-size: 1em;
        }
     `}</style>
  </button>
)
```

New styles' injection is optimized to perform well at runtime.

That said when your CSS is mostly static we recommend to split it up in static and dynamic styles and use two separate `style` tags so that, when changing, only the dynamic parts are recomputed/rendered.

```jsx
const Button = (props) => (
  <button>
     { props.children }
     <style jsx>{`
        button {
          color: #999;
          display: inline-block;
          font-size: 2em;
        }
     `}</style>
     <style jsx>{`
        button {
          padding: ${ 'large' in props ? '50' : '20' }px;
          background: ${props.theme.background};
        }
     `}</style>
  </button>
)
```

#### Via `className` toggling

The second option is to pass properties that toggle class names.

```jsx
const Button = (props) => (
  <button className={ 'large' in props && 'large' }>
     { props.children }
     <style jsx>{`
        button {
          padding: 20px;
          background: #eee;
          color: #999
        }
        .large {
          padding: 50px
        }
     `}</style>
  </button>
)
```

Then you would use this component as either `<Button>Hi</Button>` or `<Button large>Big</Button>`.

#### Via inline `style`

\***best for animations**

Imagine that you wanted to make the padding in the button above completely customizable. You can override the CSS you configure via inline-styles:

```jsx
const Button = ({ padding, children }) => (
  <button style={{ padding }}>
     { children }
     <style jsx>{`
        button {
          padding: 20px;
          background: #eee;
          color: #999
        }
     `}</style>
  </button>
)
```

In this example, the padding defaults to the one set in `<style>` (`20`), but the user can pass a custom one via `<Button padding={30}>`.

### Constants

It is possible to use constants like so:

```jsx
import { colors, spacing } from '../theme'
import { invertColor } from '../theme/utils'

const Button = ({ children }) => (
  <button>
     { children }
     <style jsx>{`
        button {
          padding: ${ spacing.medium };
          background: ${ colors.primary };
          color: ${ invertColor(colors.primary) };
        }
     `}</style>
  </button>
)
```

Please keep in mind that constants defined outside of the component scope are treated as static styles.

## Server-Side Rendering

### `styled-jsx/server`

The main export flushes your styles to an array of `React.Element`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/server'
import flush from 'styled-jsx/server'
import App from './app'

export default (req, res) => {
  const app = ReactDOM.renderToString(<App />)
  const styles = flush()
  const html = ReactDOM.renderToStaticMarkup(<html>
    <head>{ styles }</head>
    <body>
      <div id="root" dangerouslySetInnerHTML={{__html: app}} />
    </body>
  </html>)
  res.end('<!doctype html>' + html)
}
```

We also expose `flushToHTML` to return generated HTML:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/server'
import { flushToHTML } from 'styled-jsx/server'
import App from './app'

export default (req, res) => {
  const app = ReactDOM.renderToString(<App />)
  const styles = flushToHTML()
  const html = `<!doctype html>
    <html>
      <head>${styles}</head>
      <body>
        <div id="root">${app}</div>
      </body>
    </html>`
  res.end(html)
}
```

It's **paramount** that you use one of these two functions so that
the generated styles can be diffed when the client loads and
duplicate styles are avoided.

## CSS Preprocessing via Plugins

Styles can be preprocessed via plugins.

Plugins are regular JavaScript modules that export a simple function with the following signature:

```js
(css: string, options: Object) => string
```

Basically they accept a CSS string in input, optionally modify it and finally return it.

Plugins make it possible to use popular preprocessors like SASS, Less, Stylus, PostCSS or apply custom transformations to the styles at **compile time**.

To register a plugin add an option `plugins` for `styled-jsx/babel` to your `.babelrc`. `plugins` must be an array of module names or *full* paths for local plugins.

```json
{
  "plugins": [
    [
      "styled-jsx/babel",
      { "plugins": ["my-styled-jsx-plugin-package", "/full/path/to/local/plugin"] }
    ]
  ]
}
```

<details>
  <summary>Instructions to integrate with Next.js</summary>
  In order to register styled-jsx plugins in a Next.js app you need to create a custom .babelrc file:

  ```json
  {
    "presets": [
      [
        "next/babel",
        {
          "styled-jsx": {
            "plugins": [
              "styled-jsx-plugin-postcss"
            ]
          }
        }
      ]
    ]
  }
  ```

  This is a fairly new feature so make sure that you using a version of Next.js that supports passing options to `styled-jsx`.
</details>
<br>

Plugins are applied in definition order left to right before styles are scoped.

In order to resolve local plugins paths you can use NodeJS' [require.resolve](https://nodejs.org/api/globals.html#globals_require_resolve).

N.B. when applying the plugins styled-jsx replaces template literals expressions with placeholders because otherwise CSS parsers would get invalid CSS E.g.

```css
/* `ExprNumber` is a number */
%%styled-jsx-placeholder-ExprNumber%%
```

**Plugins won't transform expressions** (eg. dynamic styles).

When publishing a plugin you may want to add the keywords: `styled-jsx` and `styled-jsx-plugin`.
We also encourage you to use the following naming convention for your plugins:

```
styled-jsx-plugin-<your-plugin-name>
```

#### Plugin options

Users can set plugin options by registering a plugin as an array that contains
the plugin path and an options object.

```json
{
  "plugins": [
    [
      "styled-jsx/babel",
      {
        "plugins": [
          ["my-styled-jsx-plugin-package", { "exampleOption":  true }]
        ],
        "sourceMaps": true
      }
    ]
  ]
}
```

Each plugin receives a `options` object as second argument which contains
the babel and user options:

```js
(css, options) => { /* ... */ }
```

The `options` object has the following shape:

```js
{
  // user options go here
  // eg. exampleOption: true

  // babel options
  babel: {
    sourceMaps: boolean,
    vendorPrefixes: boolean,
    isGlobal: boolean,
    filename: ?string, // defined only when styled-jsx/babel is used via Babel CLI,
    location: { // the original location of the CSS block in the JavaScript file
      start: {
        line: number,
        column: number,
      },
      end: {
        line: number,
        column: number,
      }
    }
  }
}
```

#### Example plugins

The following plugins are proof of concepts/sample:

* [styled-jsx-plugin-sass](https://github.com/giuseppeg/styled-jsx-plugin-sass)
* [styled-jsx-plugin-postcss](https://github.com/giuseppeg/styled-jsx-plugin-postcss)
* [styled-jsx-plugin-stylelint](https://github.com/giuseppeg/styled-jsx-plugin-stylelint)

## Syntax Highlighting

When working with template literals a common drawback is missing syntax highlighting. The following editors currently have support for highlighting CSS inside `<style jsx>` elements.

 _If you have a solution for an editor not on the list_ __please [open a PR](https://github.com/zeit/styled-jsx/pull/new/master)__ _and let us now._

### Atom

The [`language-babel`](https://github.com/gandm/language-babel) package for the [Atom editor](https://atom.io/) has an option to [extend the grammar for JavaScript tagged template literals](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions).

After [installing the package](https://github.com/gandm/language-babel#installation) add the code below to the appropriate settings entry. In a few moments you should be blessed with proper CSS syntax highlighting. ([source](https://github.com/gandm/language-babel/issues/324))

```
"(?<=<style jsx>{)|(?<=<style jsx global>{)":source.css.styled
```

![babel-language settings entry](https://cloud.githubusercontent.com/assets/2313237/22627258/6c97cb68-ebb7-11e6-82e1-60205f8b31e7.png)

### Webstorm/Idea

The IDE let you inject any language in place with _Inject language or reference_ in an _Intention Actions_ (default _alt+enter_).
Simply perform the action in the string template and select CSS.
You get full CSS highlighting and autocompletion and it will last until you close the IDE.

Additionally you can use language injection comments to enable all the IDE language features indefinitely using the language comment style:

```jsx
import { colors, spacing } from '../theme'
import { invertColor } from '../theme/utils'

const Button = ({ children }) => (
  <button>
     { children }

     { /*language=CSS*/ }
     <style jsx>{`
        button {
          padding: ${ spacing.medium };
          background: ${ colors.primary };
          color: ${ invertColor(colors.primary) };
        }
     `}</style>
  </button>
)
```

### Emmet

 If you're using Emmet you can add the following snippet to `~/emmet/snippets-styledjsx.json` This will allow you to expand `style-jsx` to a styled-jsx block.

 ```json
 {
  "html": {
    "snippets": {
      "style-jsx": "<style jsx>{`\n\t$1\n`}</style>"
    }
  }
}
```

### [Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=blanu.vscode-styled-jsx)
Launch VS Code Quick Open (⌘+P), paste the following command, and press enter.
```
ext install vscode-styled-jsx
```
#### Autocomplete
By now, this extension doesn't support autocomplete. However, you can install [ES6 Template Literal Editor](https://marketplace.visualstudio.com/items?itemName=plievone.vscode-template-literal-editor) extension to edit styles in another pane, and you will get full feature of css language service provided by VS Code.

### Vim

Install [vim-styled-jsx](https://github.com/alampros/vim-styled-jsx) with your plugin manager of choice.

## ESLint
If you're using `eslint-plugin-import`, the `css` import will generate errors, being that it's a "magic" import (not listed in package.json). To avoid these, simply add the following line to your eslint configuration:

```
"settings": {"import/core-modules": ["styled-jsx/css"] }
```

## Credits

- **Pedram Emrouznejad** ([rijs](https://github.com/rijs/fullstack)) suggested attribute selectors over my initial class prefixing idea.
- **Sunil Pai** ([glamor](https://github.com/threepointone/glamor)) inspired the use of `murmurhash2` (minimal and fast hashing) and an efficient style injection logic.
- **Sultan Tarimo** built [stylis.js](https://github.com/thysultan), a super fast and tiny CSS parser and compiler.
- **Max Stoiber** ([styled-components](https://github.com/styled-components)) proved the value of retaining the familiarity of CSS syntax and pointed me to the very efficient [stylis](https://github.com/thysultan/stylis.js) compiler (which we forked to very efficiently append attribute selectors to the user's css)
- **Yehuda Katz** ([ember](https://github.com/emberjs)) convinced me on Twitter to transpile CSS as an alternative to CSS-in-JS.
- **Evan You** ([vuejs](https://github.com/vuejs)) discussed his Vue.js CSS transformation with me.
- **Henry Zhu** ([babel](https://github.com/babel)) helpfully pointed me to some important areas of the babel plugin API.

## Authors

- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) - [▲ZEIT](https://zeit.co)
- Naoyuki Kanezawa ([@nkzawa](https://twitter.com/nkzawa)) - [▲ZEIT](https://zeit.co)
- Giuseppe Gurgone ([@giuseppegurgone](https://twitter.com/giuseppegurgone))
