// Packages
import test from 'ava'

// Ours
import transform from '../lib/style-transform'
import read from './_read'

test('transpile styles with attributes', async t => {
  const src = await read('./fixtures/transform.css')
  const out = await read('./fixtures/transform.out.css')

  // use an id that's a number (inside a string) so
  // that we can test that animations get correctly prefixed
  // (since CSS forbids them from starting with a number)
  t.is(transform('[data-jsx="123"]', src), out.trim())
})
