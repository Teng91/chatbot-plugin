import type { ReactNode } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCall?: ToolCall
  toolResult?: ToolCallResult
  timestamp: Date
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolCallResult {
  toolCallId: string
  content: string
  isError?: boolean
}

export type StreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call_start'; tool: ToolCall }
  | { type: 'tool_call_result'; result: ToolCallResult }
  | { type: 'done' }
  | { type: 'error'; error: string }

export interface RequestOptions {
  endpoint: string
  messages: Message[]
  headers?: Record<string, string>
}

export interface StreamAdapter {
  parse: (line: string) => StreamEvent | null
  buildRequest: (messages: Message[], options: RequestOptions) => RequestInit
}

export interface UseChatOptions {
  endpoint: string
  streamAdapter?: StreamAdapter
  initialMessages?: Message[]
  headers?: Record<string, string>
  onBeforeToolCall?: (tool: ToolCall) => ToolCall | Promise<ToolCall>
  onAfterToolCall?: (tool: ToolCall, result: ToolCallResult) => ToolCallResult | Promise<ToolCallResult>
  onMessage?: (message: Message) => void
  onStreamChunk?: (chunk: string) => void
  onStreamEnd?: () => void
  onError?: (error: Error) => void
}

export interface UseChatReturn {
  messages: Message[]
  sendMessage: (text: string) => void
  isLoading: boolean
  error: Error | null
  clearMessages: () => void
}

export interface AgentInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
  messages?: Message[]
  theme?: 'light' | 'dark' | 'auto'
  className?: string
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (text: string) => void
  sendIcon?: ReactNode
  searchIcon?: ReactNode
}

export interface ChatbotPluginProps {
  messages: Message[]
  onSend: (text: string) => void
  isLoading?: boolean
  unreadCount?: number
  theme?: 'light' | 'dark' | 'auto'
  className?: string
  title?: string
  placeholder?: string
  fabIcon?: ReactNode
  headerAvatar?: ReactNode
  emptyState?: ReactNode
  width?: number | string
  height?: number | string
}
