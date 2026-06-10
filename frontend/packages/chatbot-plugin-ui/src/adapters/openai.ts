import type { StreamAdapter, Message, RequestOptions, StreamEvent } from '../types'

export const openaiAdapter: StreamAdapter = {
  buildRequest(messages: Message[], options: RequestOptions): RequestInit {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    }
  },

  parse(line: string): StreamEvent | null {
    if (!line.startsWith('data: ')) return null
    const data = line.slice(6).trim()
    if (data === '[DONE]') return { type: 'done' }

    try {
      const json = JSON.parse(data)
      const delta = json?.choices?.[0]?.delta
      if (!delta) return null

      if (typeof delta.content === 'string' && delta.content.length > 0) {
        return { type: 'text_delta', content: delta.content }
      }

      const tc = delta.tool_calls?.[0]
      if (tc?.function?.name) {
        return {
          type: 'tool_call_start',
          tool: {
            id: tc.id ?? crypto.randomUUID(),
            name: tc.function.name,
            arguments: {},
          },
        }
      }

      return null
    } catch {
      return null
    }
  },
}
