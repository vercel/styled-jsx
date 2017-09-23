// Packages
import test from 'ava'

// Ours
import transform from '../src/lib/style-transform'
import read from './_read'

test('transpile styles with attributes', async t => {
  const src = await read('./fixtures/transform.css')
  // Use an id that's a number (inside a string) so
  // that we can test that animations get correctly prefixed
  // (since CSS forbids them from starting with a number)
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
    'span { color: red } @font-face { font-family: test; src: url(test.woff); } div { color: red }',
    [
      'span{color:red;}',
      '@font-face{font-family:test;src:url(test.woff);}',
      'div{color:red;}'
    ]
  )

  assert('@charset "UTF-8"', ['@charset "UTF-8"'])

  assert('@import "./test.css"', ['@import "./test.css"'])

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
      '@supports (display:flex){div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}}'
    ]
  )

  // TODO - the ones below are still failing
  // assert('@namespace url(http://www.w3.org/1999/xhtml)', ['@namespace url(http://www.w3.org/1999/xhtml);'])
  // assert('@namespace svg url(http://www.w3.org/2000/svg)', ['@namespace svg url(http://www.w3.org/2000/svg)'])
  // assert('@page :first { margin: 1in; }', ['@page :first{margin:1in;}'])
})
