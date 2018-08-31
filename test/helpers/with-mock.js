export default function withMock(mockFn, testFn) {
  return t => {
    const cleanUp = mockFn(t)
    if (typeof cleanUp !== 'function') {
      throw new TypeError('mockFn should return a cleanup function')
    }
    testFn(t)
    cleanUp(t)
  }
}

export function withMockDocument(t) {
  const originalDocument = global.document
  // We need to stub a document in order to simulate the meta tag
  global.document = {
    querySelector(query) {
      t.is(query, 'meta[property="csp-nonce"]')
      return {
        getAttribute(attr) {
          t.is(attr, 'content')
          return 'test-nonce'
        }
      }
    }
  }

  return () => {
    global.document = originalDocument
  }
}
