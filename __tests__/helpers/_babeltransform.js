import plugin from '../../src/babel'
import _transform from './_transform'

export default (file, opts = {}) => (
  _transform(file, {
    plugins: [plugin],
    ...opts
  })
)