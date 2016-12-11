# styled-jsx

[![Build Status](https://travis-ci.org/zeit/styled-jsx.svg?branch=master)](https://travis-ci.org/zeit/styled-jsx)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat)
[![npm](https://img.shields.io/npm/v/styled-jsx.svg)](https://www.npmjs.com/package/styled-jsx)

Full, scoped and component-friendly CSS support for JSX (rendered on the server or the client).

## Usage

Firstly, install the package:

```bash
$ npm install --save styled-jsx
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

```js
export default () => (
  <div>
    <p>only this paragraph will get the style :O</p>
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
- Runtime size of just **500 bytes**
- Complete isolation: Selectors, animations, keyframes
- Built-in CSS-prefixing
- Very fast, minimal and efficient transpilation (see below)
- High-performance runtime-CSS-injection when not server-rendering
- Future-proof: Equivalent to server-renderable "Shadow CSS"
- Works like the deprecated `<style scoped>`, but the styles get injected only once per component

## How It Works

The example above transpiles to the following:

```js
import _jsxStyleInject from 'styled-jsx/inject'

export default () => (
  <div data-jsx='cn2o3j'>
    <p data-jsx='cn2o3j'>only this paragraph will get the style :O</p>
    { _jsxStyleInject('cn2o3j', `p[data-jsx=cn2o3j] {color: red;}`) }
  </div>
)
```

### Why It Works Like This

Data attributes give us style encapsulation and `_jsxStyleInject` is heavily optimized for:

- Injecting styles upon render
- Only injecting a certain component's style once (even if the component is included multiple times)
- Keeping track of styles for server-side rendering (discussed in the next section)

### Targetting The Root

Notice that the parent `<div>` above also gets a `data-jsx` atribute. We do this so that
you can target the "root" element, in the same manner that
[`:host`](https://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-201/#toc-style-host) works with Shadow DOM.

If you want to target _only_ the host, we suggest you use a class:

```js
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

```js
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

### Global (piercing) selectors

Sometimes it's useful to skip prefixing. We support `:global()`
similarly to how [css-modules](https://github.com/css-modules/css-modules) work.

This is very useful in order to generate a class that you can pass to
3rd-party components. For example, to style `react-select` which
supports passing a custom class via `optionClassName`:

```js
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

## Server-Side Rendering

In the server rendering pipeline, you can obtain the entire CSS of all components by invoking `flush`:

```js
import flush from 'styled-jsx/flush'

// …
// <render here>
// …

const styles = flush()

for (let id in styles) {
  const css = styles[id]
  console.log(id, css)
}
```

This API is also available on the client: Instead of returning the CSS text, it returns a reference to the automatically generated `<style>` tag.

This is useful for performing diffs of elements between top-level `render()` calls, and ditching style elements that are no longer being used.

## Credits

- **Pedram Emrouznejad** ([rijs](https://github.com/rijs/fullstack)) suggested attribute selectors over my initial class prefixing idea.
- **Sunil Pai** ([glamor](https://github.com/threepointone/glamor)) inspired the use of `murmurhash2` (minimal and fast hashing) and an efficient style injection logic.
- **Sultan Tarimo** built [stylis.js](https://github.com/thysultan), a super fast and tiny CSS parser and compiler.
- **Max Stoiber** ([styled-components](https://github.com/styled-components)) proved the value of retaining the familiarity of CSS syntax and pointed me to the very efficient [stylis](https://github.com/thysultan/stylis.js) compiler (which we forked to very efficiently append attribute selectors to the user's css)
- **Yehuda Katz** ([ember](https://github.com/ember)) convinced me on Twitter to transpile CSS as an alternative to CSS-in-JS.
- **Evan You** ([vuejs](https://github.com/vuejs)) discussed his Vue.js CSS transformation with me.
- **Henry Zhu** ([babel](https://github.com/babel)) helpfully pointed me to some important areas of the babel plugin API.

## Author

Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) - [▲ZEIT](https://zeit.co)
