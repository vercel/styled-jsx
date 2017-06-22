# styled-jsx

[![Build Status](https://travis-ci.org/zeit/styled-jsx.svg?branch=master)](https://travis-ci.org/zeit/styled-jsx)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)

Full, scoped and component-friendly CSS support for JSX (rendered on the server or the client).

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

## Features

- Full CSS support, no tradeoffs in power
- Runtime size of just **2kb** (gzipped, from 6kb)
- Complete isolation: Selectors, animations, keyframes
- Built-in CSS vendor prefixing
- Very fast, minimal and efficient transpilation (see below)
- High-performance runtime-CSS-injection when not server-rendering
- Future-proof: Equivalent to server-renderable "Shadow CSS"
- Works like the deprecated `<style scoped>`, but the styles get injected only once per component

## How It Works

The example above transpiles to the following:

```jsx
import _JSXStyle from 'styled-jsx/style'

export default () => (
  <div data-jsx='cn2o3j'>
    <p data-jsx='cn2o3j'>only this paragraph will get the style :)</p>
    <_JSXStyle styleId='cn2o3j' css={`p[data-jsx=cn2o3j] {color: red;}`} />
  </div>
)
```

### Why It Works Like This

Data attributes give us style encapsulation and `_JSXStyle` is heavily optimized for:

- Injecting styles upon render
- Only injecting a certain component's style once (even if the component is included multiple times)
- Removing unused styles
- Keeping track of styles for server-side rendering (discussed in the next section)

### Keeping CSS in separate files

Styles can be defined in separate JavaScript modules e.g.

```js
/* styles.js */

export const button = `button { color: hotpink; }`
export default `div { color: green; }`
```

and imported as regular strings

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

Styles are automatically scoped but if you want you can also consume them as [globals](#global-styles).

N.B. We support CommonJS exports but you can only export one string per module:

```js
module.exports = `div { color: green; }`

// the following won't work
// module.exports = { styles: `div { color: green; }` }
```

### Targeting The Root

Notice that the parent `<div>` above also gets a `data-jsx` attribute. We do this so that
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

#### Via `className` toggling

To make a component's visual representation customizable from the outside world, there are two options. The first one is to pass properties that toggle class names.

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

### Constants and Config

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

N.B. Only constants defined outside of the component scope are allowed here.
If you want to use or toggle dynamic values depending on the component `state` or `props` then we recommend to use one of the techniques from the [Dynamic styles section](#dynamic-styles)

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
