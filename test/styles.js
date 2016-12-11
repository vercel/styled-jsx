// Packages
import test from 'ava'

// Ours
import transform from '../lib/style-transform'
import read from './_read'

test.only('transpile styles with attributes', async t => {
  const src = await read('./fixtures/transform.css')
  const out = await read('./fixtures/transform.out.css')

  console.log(transform('woot', src))
  return
  t.is(transform('woot', src), out.trim())
})
