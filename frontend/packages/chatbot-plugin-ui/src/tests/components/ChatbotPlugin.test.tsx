import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatbotPlugin } from '../../components/ChatbotPlugin'

describe('ChatbotPlugin', () => {
  it('renders FAB button', () => {
    render(<ChatbotPlugin messages={[]} onSend={vi.fn()} />)
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument()
  })

  it('toggles chat window on FAB click', () => {
    render(<ChatbotPlugin messages={[]} onSend={vi.fn()} />)
    const fab = screen.getByRole('button', { name: /open chat/i })
    fireEvent.click(fab)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true')
  })

  it('shows unread badge when unreadCount > 0', () => {
    render(<ChatbotPlugin messages={[]} onSend={vi.fn()} unreadCount={3} />)
    expect(screen.getByLabelText('3 unread messages')).toBeInTheDocument()
  })

  it('calls onSend when message submitted', () => {
    const onSend = vi.fn()
    render(<ChatbotPlugin messages={[]} onSend={onSend} />)
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('renders custom title', () => {
    render(<ChatbotPlugin messages={[]} onSend={vi.fn()} title="My Bot" />)
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }))
    expect(screen.getByText('My Bot')).toBeInTheDocument()
  })
})
