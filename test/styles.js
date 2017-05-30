// Packages
import test from 'ava'

// Ours
import transform from '../lib/style-transform'
import read from './_read'

test('transpile styles with attributes', async t => {
  const src = await read('./fixtures/transform.css')
  // Use an id that's a number (inside a string) so
  // that we can test that animations get correctly prefixed
  // (since CSS forbids them from starting with a number)
  t.snapshot(transform('[data-jsx="123"]', src))
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
    t.throws(() => transform('[data-jsx="123"]', fixture))
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
    t.notThrows(() => transform('[data-jsx="123"]', fixture))
  })
})
