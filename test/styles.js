import test from 'ava'
import read from './_read'
import transform from '../lib/style-transform'

test('transpile styles with attributes', async (t) => {
  const src = await read('./fixtures/transform.css')
  const out = await read('./fixtures/transform.out.css')
  t.is(transform('woot', src), out.trim())
})
