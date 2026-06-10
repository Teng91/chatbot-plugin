import { describe, it, expect } from 'vitest'
import { openaiAdapter } from '../../adapters/openai'
import type { Message } from '../../types'

describe('openaiAdapter.parse', () => {
  it('returns null for non-data lines', () => {
    expect(openaiAdapter.parse('')).toBeNull()
    expect(openaiAdapter.parse('event: ping')).toBeNull()
  })

  it('returns done event for [DONE]', () => {
    expect(openaiAdapter.parse('data: [DONE]')).toEqual({ type: 'done' })
  })

  it('parses text delta', () => {
    const line = 'data: ' + JSON.stringify({
      choices: [{ delta: { content: 'Hello' } }],
    })
    expect(openaiAdapter.parse(line)).toEqual({ type: 'text_delta', content: 'Hello' })
  })

  it('parses tool_call_start', () => {
    const line = 'data: ' + JSON.stringify({
      choices: [{
        delta: {
          tool_calls: [{ id: 'tc_1', function: { name: 'get_weather', arguments: '' } }],
        },
      }],
    })
    const event = openaiAdapter.parse(line)
    expect(event?.type).toBe('tool_call_start')
    if (event?.type === 'tool_call_start') {
      expect(event.tool.id).toBe('tc_1')
      expect(event.tool.name).toBe('get_weather')
    }
  })

  it('returns null for malformed JSON', () => {
    expect(openaiAdapter.parse('data: not-json')).toBeNull()
  })
})

describe('openaiAdapter.buildRequest', () => {
  it('sets method to POST', () => {
    const msgs: Message[] = []
    const req = openaiAdapter.buildRequest(msgs, { endpoint: '/api/chat', messages: msgs })
    expect(req.method).toBe('POST')
  })

  it('includes stream: true in body', () => {
    const msgs: Message[] = []
    const req = openaiAdapter.buildRequest(msgs, { endpoint: '/api/chat', messages: msgs })
    const body = JSON.parse(req.body as string)
    expect(body.stream).toBe(true)
  })

  it('merges custom headers', () => {
    const msgs: Message[] = []
    const req = openaiAdapter.buildRequest(msgs, {
      endpoint: '/api/chat',
      messages: msgs,
      headers: { Authorization: 'Bearer token' },
    })
    const headers = req.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer token')
  })
})
