// Packages
import React from 'react'
import renderer from 'react-test-renderer';

// Ours
import _transform from './helpers/_babeltransform'

it('renders correctly', async () => {
  expect.assertions(1)
  const { code } = await _transform('../fixtures/stateless.js')
  expect(code).toMatchSnapshot();
});