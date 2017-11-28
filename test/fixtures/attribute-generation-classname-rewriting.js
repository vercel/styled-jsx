export default () => (
  <div>
    <div className="test" {...test.test} />
    <div className="test" {...test.test.test} />
    <div className="test" {...this.test.test} />
    <div data-test="test" />
    <div className="test" />
    <div className={'test'} />
    <div className={`test`} />
    <div className={`test${true ? ' test2' : ''}`} />
    <div className={'test ' + test} />
    <div className={['test', 'test2'].join(' ')} />
    <div className={true && 'test'} />
    <div className={test ? 'test' : null} />
    <div className={test} />
    <div className={test && 'test'} />
    <div className={test && test('test')} />
    <div className={undefined} />
    <div className={null} />
    <div className={false} />
    <div className={'test'} data-test />
    <div data-test className={'test'} />
    <div className={'test'} data-test="test" />
    <div className={'test'} {...props} />
    <div className={'test'} {...props} {...rest} />
    <div className={`test ${test ? 'test' : ''}`} {...props} />
    <div className={test && test('test')} {...props} />
    <div className={test && test('test') && 'test'} {...props} />
    <div className={test && test('test') && test2('test')} {...props} />
    <div {...props} className={'test'} />
    <div {...props} {...rest} className={'test'} />
    <div {...props} className={'test'} {...rest} />
    <div {...props} />
    <div {...props} {...rest} />
    <div {...props} data-foo {...rest} />
    <div {...props} className={'test'} data-foo {...rest} />
    <style jsx>{'div { color: red }'}</style>
  </div>
)
