// __tests__/sample.test.ts
describe('Sample Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 42 }
    expect(obj).toHaveProperty('name')
    expect(obj.value).toBe(42)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })
})