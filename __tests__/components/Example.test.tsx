// __tests__/components/Example.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Componente de exemplo para demonstrar testes
function ExampleComponent({ 
  title = 'Example Title',
  onButtonClick = () => {},
  showButton = true 
}: {
  title?: string
  onButtonClick?: () => void
  showButton?: boolean
}) {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      {showButton && (
        <button onClick={onButtonClick}>Action Button</button>
      )}
    </div>
  )
}

describe('ExampleComponent', () => {
  it('deve renderizar com props padrão', () => {
    render(<ExampleComponent />)
    
    expect(screen.getByText('Example Title')).toBeInTheDocument()
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })

  it('deve renderizar com título customizado', () => {
    render(<ExampleComponent title="Custom Title" />)
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('deve incrementar contador ao clicar', async () => {
    const user = userEvent.setup()
    render(<ExampleComponent />)
    
    const incrementButton = screen.getByText('Increment')
    
    await user.click(incrementButton)
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
    
    await user.click(incrementButton)
    expect(screen.getByText('Count: 2')).toBeInTheDocument()
  })

  it('deve chamar callback ao clicar no botão de ação', async () => {
    const mockCallback = jest.fn()
    const user = userEvent.setup()
    
    render(<ExampleComponent onButtonClick={mockCallback} />)
    
    const actionButton = screen.getByText('Action Button')
    await user.click(actionButton)
    
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('não deve renderizar botão de ação quando showButton é false', () => {
    render(<ExampleComponent showButton={false} />)
    
    expect(screen.queryByText('Action Button')).not.toBeInTheDocument()
  })

  it('deve funcionar com fireEvent (alternativa ao userEvent)', () => {
    render(<ExampleComponent />)
    
    const incrementButton = screen.getByText('Increment')
    
    fireEvent.click(incrementButton)
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })

  describe('Testes de Snapshot', () => {
    it('deve corresponder ao snapshot', () => {
      const { container } = render(
        <ExampleComponent title="Snapshot Test" />
      )
      
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})