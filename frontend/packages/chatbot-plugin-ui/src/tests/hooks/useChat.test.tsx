import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from '../../hooks/useChat'
import type { StreamAdapter } from '../../types'

const mockStream = (lines: string[]) => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + '\n'))
      }
      controller.close()
    },
  })
  return new Response(stream, { status: 200 })
}

const textAdapter: StreamAdapter = {
  buildRequest: () => ({ method: 'POST', body: '{}' }),
  parse: (line) => {
    if (line.startsWith('data: [DONE]')) return { type: 'done' }
    if (line.startsWith('data: ')) return { type: 'text_delta', content: line.slice(6) }
    return null
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useChat', () => {
  it('starts with empty messages and not loading', () => {
    const { result } = renderHook(() =>
      useChat({ endpoint: '/api/chat', streamAdapter: textAdapter })
    )
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('adds user message immediately on sendMessage', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockStream(['data: [DONE]']))
    const { result } = renderHook(() =>
      useChat({ endpoint: '/api/chat', streamAdapter: textAdapter })
    )
    await act(async () => { result.current.sendMessage('Hello') })
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('Hello')
  })

  it('streams text into assistant message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockStream(['data: Hello', 'data:  world', 'data: [DONE]'])
    )
    const { result } = renderHook(() =>
      useChat({ endpoint: '/api/chat', streamAdapter: textAdapter })
    )
    await act(async () => { result.current.sendMessage('Hi') })
    const assistant = result.current.messages.find(m => m.role === 'assistant')
    expect(assistant?.content).toBe('Hello world')
  })

  it('calls onBeforeToolCall before tool execution', async () => {
    const beforeFn = vi.fn().mockImplementation(t => t)
    const toolCallLine = 'data: ' + JSON.stringify({
      choices: [{ delta: { tool_calls: [{ id: 'tc1', function: { name: 'search' } }] } }],
    })
    global.fetch = vi.fn().mockResolvedValue(mockStream([toolCallLine, 'data: [DONE]']))
    const { result } = renderHook(() =>
      useChat({
        endpoint: '/api/chat',
        onBeforeToolCall: beforeFn,
      })
    )
    await act(async () => { result.current.sendMessage('search something') })
    expect(beforeFn).toHaveBeenCalledWith(expect.objectContaining({ name: 'search' }))
  })

  it('sets error state on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() =>
      useChat({ endpoint: '/api/chat', streamAdapter: textAdapter })
    )
    await act(async () => { result.current.sendMessage('Hello') })
    expect(result.current.error?.message).toBe('network error')
    expect(result.current.isLoading).toBe(false)
  })

  it('clearMessages resets to initial messages', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockStream(['data: [DONE]']))
    const { result } = renderHook(() =>
      useChat({ endpoint: '/api/chat', streamAdapter: textAdapter })
    )
    await act(async () => { result.current.sendMessage('Hello') })
    expect(result.current.messages.length).toBeGreaterThan(0)
    act(() => { result.current.clearMessages() })
    expect(result.current.messages).toHaveLength(0)
  })
})
