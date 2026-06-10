import { useState, useCallback, useRef } from 'react'
import type { Message, UseChatOptions, UseChatReturn } from '../types'
import { openaiAdapter } from '../adapters/openai'

export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    endpoint,
    streamAdapter = openaiAdapter,
    initialMessages = [],
    headers,
    onBeforeToolCall,
    onAfterToolCall,
    onMessage,
    onStreamChunk,
    onStreamEnd,
    onError,
  } = options

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<Message[]>(initialMessages)

  const updateMessages = useCallback((updater: ((prev: Message[]) => Message[]) | Message[]) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      messagesRef.current = next
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }

      const requestMessages = [...messagesRef.current, userMsg]
      updateMessages(requestMessages)
      onMessage?.(userMsg)
      setIsLoading(true)
      setError(null)

      abortRef.current = new AbortController()

      try {
        const requestInit = streamAdapter.buildRequest(requestMessages, {
          endpoint,
          messages: requestMessages,
          headers,
        })

        const response = await fetch(endpoint, {
          ...requestInit,
          signal: abortRef.current.signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const assistantId = crypto.randomUUID()
        const assistantMsg: Message = {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }
        updateMessages((prev) => [...prev, assistantMsg])

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            const event = streamAdapter.parse(line.trimEnd())
            if (!event) continue

            if (event.type === 'text_delta') {
              assistantContent += event.content
              onStreamChunk?.(event.content)
              updateMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              )
            } else if (event.type === 'tool_call_start') {
              let tool = event.tool
              if (onBeforeToolCall) tool = await onBeforeToolCall(tool)
              const toolMsg: Message = {
                id: crypto.randomUUID(),
                role: 'tool',
                content: '',
                toolCall: tool,
                timestamp: new Date(),
              }
              updateMessages((prev) => [...prev, toolMsg])
              onMessage?.(toolMsg)
            } else if (event.type === 'tool_call_result') {
              let result = event.result
              if (onAfterToolCall) {
                const toolCall = messagesRef.current.find(
                  (m) => m.toolCall?.id === result.toolCallId
                )?.toolCall
                if (toolCall) result = await onAfterToolCall(toolCall, result)
              }
              updateMessages((prev) =>
                prev.map((m) =>
                  m.toolCall?.id === result.toolCallId ? { ...m, toolResult: result } : m
                )
              )
            } else if (event.type === 'done') {
              break
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
          }
        }

        onStreamEnd?.()
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        onError?.(e)
      } finally {
        setIsLoading(false)
      }
    },
    [endpoint, streamAdapter, headers, isLoading, updateMessages, onBeforeToolCall, onAfterToolCall, onMessage, onStreamChunk, onStreamEnd, onError]
  )

  const clearMessages = useCallback(() => {
    updateMessages(initialMessages)
    setError(null)
  }, [initialMessages, updateMessages])

  return { messages, sendMessage, isLoading, error, clearMessages }
}
