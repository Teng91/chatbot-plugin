import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentInput } from '../../components/AgentInput'

describe('AgentInput', () => {
  it('renders input and send button', () => {
    render(<AgentInput onSend={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('calls onSend with input value on button click', () => {
    const onSend = vi.fn()
    render(<AgentInput onSend={onSend} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('calls onSend on Enter key', () => {
    const onSend = vi.fn()
    render(<AgentInput onSend={onSend} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('Test')
  })

  it('renders suggestion chips', () => {
    render(<AgentInput onSend={vi.fn()} suggestions={['Compare versions', 'List changes']} />)
    expect(screen.getByText('Compare versions')).toBeInTheDocument()
    expect(screen.getByText('List changes')).toBeInTheDocument()
  })

  it('disables send when isLoading', () => {
    render(<AgentInput onSend={vi.fn()} isLoading />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })
})
