import memory from './memory'

export default function flush() {
  const ret = {}

  for (const i in memory) {
    if (!{}.hasOwnProperty.call(memory, i)) {
      continue
    }

    ret[i] = memory[i]
    delete memory[i]
  }

  return ret
}
