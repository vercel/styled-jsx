// Packages
import test from 'ava'

// Ours
import transform from '../src/lib/style-transform'
import read from './_read'

test('transpile styles with attributes', async t => {
  const src = await read('./fixtures/transform.css')
  t.snapshot(transform('.jsx-123', src))
})

test('throws when using nesting', t => {
  const fixtures = [
    `div { &:hover { color: red } }`,
    `div {
      color: green;
      &:hover { color: red } }`,
    `:hover { div { color: red } }`,
    `@media all {
      div {
        &:hover { color: red }
      }
    }`,
    `* { div { color: red }
      &.test {
        color: red;
      }
    }`,
    `span {}
      .test {
        color: red;
      div& {
        color: red;
      }
    }`
  ]

  fixtures.forEach(fixture => {
    t.throws(() => transform('', fixture))
    t.throws(() => transform('.jsx-123', fixture))
  })
})

test("doesn't throw when using at-rules", t => {
  const fixtures = [
    '@media (min-width: 480px) { div { color: red } }',
    `span {}
      @media (min-width: 480px) { div { color: red } }`,
    `@media (min-width: 480px) { div { color: red } }
    span {}`,
    `:hover {}
      @media (min-width: 480px) { div { color: red } }`,
    `:hover { color: green }
      @media (min-width: 480px) { div { color: red } }`,
    `@media (min-width: 480px) { div {} }`,
    `@keyframes foo {
      0% { opacity: 0 }
      100% { opacity: 1}
    }
    `,
    // Line with one space before @rule
    `div { color: red; }
 
     @media screen and (min-width: 480px) {
       div { color: red; }
     }
     `,
    // Line with one tab before @rule
    `div { color: red; }
	
     @media screen and (min-width: 480px) {
       div { color: red; }
     }
    `
  ]

  fixtures.forEach(fixture => {
    t.notThrows(() => transform('', fixture))
    t.notThrows(() => transform('.jsx-123', fixture))
  })
})

test('splits rules for `optimizeForSpeed`', t => {
  function assert(input, expected, prefix = '') {
    t.deepEqual(transform(prefix, input, { splitRules: true }), expected)
  }

  assert('div { color: red }', ['div{color:red;}'])

  assert('div { color: red } .p { color: red }', [
    'div{color:red;}',
    '.p{color:red;}'
  ])

  assert('div, span { color: red } a > .p { color: red }', [
    'div,span{color:red;}',
    'a>.p{color:red;}'
  ])

  assert(
    '@media (min-width: 400px) { div, span { color: red } } a > .p { color: red }',
    ['@media (min-width:400px){div,span{color:red;}}', 'a>.p{color:red;}']
  )

  assert(
    '@media (min-width: 400px) { div { color: red } span { color: red } } a > .p { color: red }',
    [
      '@media (min-width:400px){div{color:red;}span{color:red;}}',
      'a>.p{color:red;}'
    ]
  )

  assert(
    `@media (min-width: 1px) and (max-width: 768px) {
      [class*='test__test--'] {
        color: red;
      }
    }`,
    [
      `@media (min-width:1px) and (max-width:768px){[class*='test__test--']{color:red;}}`
    ]
  )

  assert(
    'span { color: red } @font-face { font-family: test; src: url(test.woff); } div { color: red }',
    [
      '@font-face{font-family:test;src:url(test.woff);}',
      'span{color:red;}',
      'div{color:red;}'
    ]
  )

  assert('@charset "UTF-8"', ['@charset "UTF-8";'])

  assert('@import "./test.css"', ['@import "./test.css";'])

  assert(
    `
    @keyframes test {
      0% { opacity: 0 }
      100% { opacity: 1 }
    }
  `,
    [
      '@-webkit-keyframes test{0%{opacity:0;}100%{opacity:1;}}',
      '@keyframes test{0%{opacity:0;}100%{opacity:1;}}'
    ]
  )

  assert(
    `
    @supports (display: flex) {
      div { display: flex; }
    }
  `,
    [
      '@supports (display:-webkit-box) or (display:-webkit-flex) or (display:-ms-flexbox) or (display:flex){div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}}'
    ]
  )

  assert(
    `
    @import "./test.css";
    @supports (display: flex) {
      div { display: flex; }
    }
    div { color: red }
    a, div { color: red }
    @import "./test.css";
    @media (min-width: 400px) { div, span { color: red } }
    @container (min-width: 400px) { span { color: red } }
  `,
    [
      '@import "./test.css";',
      '@import "./test.css";',
      '@supports (display:-webkit-box) or (display:-webkit-flex) or (display:-ms-flexbox) or (display:flex){div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}}',
      'div{color:red;}',
      'a,div{color:red;}',
      '@media (min-width:400px){div,span{color:red;}}',
      '@container (min-width:400px){span{color:red;}}'
    ]
  )

  assert('@namespace url(http://www.w3.org/1999/xhtml)', [
    '@namespace url(http://www.w3.org/1999/xhtml);'
  ])
  assert('@namespace svg url(http://www.w3.org/2000/svg)', [
    '@namespace svg url(http://www.w3.org/2000/svg);'
  ])
  assert('@page :first { margin: 1in; }', ['@page :first{margin:1in;}'])

  assert(
    `
    div {
      animation: fade-in ease-in 1;
      animation-fill-mode: forwards;
      animation-duration: 500ms;
      opacity: 0;
    }
    @keyframes fade-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }
  `,
    [
      'div.jsx-123{-webkit-animation:fade-in-jsx-123 ease-in 1;animation:fade-in-jsx-123 ease-in 1;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-duration:500ms;animation-duration:500ms;opacity:0;}',
      '@-webkit-keyframes fade-in-jsx-123{from{opacity:0;}to{opacity:1;}}',
      '@keyframes fade-in-jsx-123{from{opacity:0;}to{opacity:1;}}'
    ],
    '.jsx-123'
  )

  assert(
    `
    div {
      animation: fade-in ease-in 1;
      animation-fill-mode: forwards;
      animation-duration: 500ms;
      opacity: 0;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }
  `,
    [
      'div{-webkit-animation:fade-in ease-in 1;animation:fade-in ease-in 1;-webkit-animation-fill-mode:forwards;animation-fill-mode:forwards;-webkit-animation-duration:500ms;animation-duration:500ms;opacity:0;}',
      '@-webkit-keyframes fade-in{from{opacity:0;}to{opacity:1;}}',
      '@keyframes fade-in{from{opacity:0;}to{opacity:1;}}'
    ]
  )

  assert(
    `div { color: red } ::placeholder { color: green }`,
    [
      'div.jsx-123{color:red;}',
      '.jsx-123::-webkit-input-placeholder{color:green;}',
      '.jsx-123::-moz-placeholder{color:green;}',
      '.jsx-123:-ms-input-placeholder{color:green;}',
      '.jsx-123::placeholder{color:green;}'
    ],
    '.jsx-123'
  )
})
