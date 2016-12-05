import memory from './memory'
export default function flush () {
  const ret = {}
  for (let i in memory) {
    ret[i] = memory[i]
    delete memory[i]
  }
  return ret
}
