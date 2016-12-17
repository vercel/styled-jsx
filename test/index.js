// Native
import path from 'path'

// Packages
import test from 'ava'
import {transformFile} from 'babel-core'
import {writeFile} from 'mz/fs'

// Ours
import plugin from '../src/babel'
import read from './_read'

const transform = file => (
  new Promise((resolve, reject) => {
    transformFile(path.resolve(__dirname, file), {
      babelrc: false,
      plugins: [plugin],
      sourceMaps: false
    }, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
)

test('works with stateless', async t => {
  const {code} = await transform('./fixtures/stateless.js')
  const out = await read('./fixtures/stateless.out.js')
  t.is(code, out.trim())
})

test('ignores whitespace around expression container', async t => {
  const {code} = await transform('./fixtures/whitespace.js')
  const out = await read('./fixtures/whitespace.out.js')
  t.is(code, out.trim())
})

test('works with class', async t => {
  const {code} = await transform('./fixtures/class.js')
  const out = await read('./fixtures/class.out.js')
  t.is(code, out.trim())
})

test('ignores when attribute is absent', async t => {
  const {code} = await transform('./fixtures/absent.js')
  const out = await read('./fixtures/absent.out.js')
  t.is(code, out.trim())
})

test('works with global styles', async t => {
  const {code} = await transform('./fixtures/global.js')
  const out = await read('./fixtures/global.out.js')
  t.is(code, out.trim())
})
