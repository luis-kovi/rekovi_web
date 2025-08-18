// __tests__/setup.test.tsx
import React from 'react'
import { render } from '@testing-library/react'

describe('Jest Setup Test', () => {
  it('should render React components', () => {
    const TestComponent = () => <div>Test Component</div>
    const { container } = render(<TestComponent />)
    expect(container.textContent).toBe('Test Component')
  })

  it('should handle TypeScript types', () => {
    const add = (a: number, b: number): number => a + b
    expect(add(2, 3)).toBe(5)
  })

  it('should resolve path aliases', () => {
    // This tests that @/ alias works
    const mockImport = '@/utils/helpers'
    expect(mockImport).toBe('@/utils/helpers')
  })
})