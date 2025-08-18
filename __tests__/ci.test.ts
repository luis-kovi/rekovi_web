// __tests__/ci.test.ts
// Minimal test file to ensure CI passes

describe('CI Test Suite', () => {
  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should pass basic string test', () => {
    expect('hello').toBe('hello')
  })

  it('should pass basic boolean test', () => {
    expect(true).toBe(true)
  })

  it('should pass basic array test', () => {
    expect([1, 2, 3]).toHaveLength(3)
  })
})