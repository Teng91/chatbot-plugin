# @Teng91/chatbot-plugin-ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@Teng91/chatbot-plugin-ui` — a React component library with `AgentInput` and `ChatbotPlugin` components, a `useChat` hook with lifecycle callbacks, and a default OpenAI-compatible stream adapter, published to GitHub Packages.

**Architecture:** Controlled components receive `messages`/`onSend`/`isLoading` from the consumer; streaming state lives in the `useChat` hook which accepts a pluggable `StreamAdapter` and lifecycle callbacks. Styling uses CSS custom properties (`--cp-*` tokens) for theming; dark mode is applied via `data-chatbot-theme="dark"` on the component root.

**Tech Stack:** React 17+, TypeScript 5, Vite 5 (library mode), Vitest + React Testing Library, CSS Modules + CSS custom properties.

---

## File Map

```
frontend/packages/chatbot-plugin-ui/
├── src/
│   ├── types.ts
│   ├── index.ts
│   ├── adapters/
│   │   └── openai.ts
│   ├── hooks/
│   │   └── useChat.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   └── base.css
│   ├── icons/
│   │   └── index.tsx
│   └── components/
│       ├── AgentInput/
│       │   ├── AgentInput.tsx
│       │   ├── AgentInput.module.css
│       │   ├── ToolCallCard.tsx
│       │   ├── ToolCallCard.module.css
│       │   └── index.ts
│       └── ChatbotPlugin/
│           ├── ChatbotPlugin.tsx
│           ├── ChatbotPlugin.module.css
│           ├── MessageBubble.tsx
│           ├── MessageBubble.module.css
│           ├── ToolCallBlock.tsx
│           ├── ToolCallBlock.module.css
│           └── index.ts
├── src/tests/
│   ├── adapters/openai.test.ts
│   ├── hooks/useChat.test.tsx
│   └── components/
│       ├── AgentInput.test.tsx
│       └── ChatbotPlugin.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

.github/workflows/publish-npm.yml
```

---

## Task 1: Package scaffolding

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/package.json`
- Create: `frontend/packages/chatbot-plugin-ui/tsconfig.json`
- Create: `frontend/packages/chatbot-plugin-ui/vite.config.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p frontend/packages/chatbot-plugin-ui/src/components/AgentInput
mkdir -p frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin
mkdir -p frontend/packages/chatbot-plugin-ui/src/adapters
mkdir -p frontend/packages/chatbot-plugin-ui/src/hooks
mkdir -p frontend/packages/chatbot-plugin-ui/src/styles
mkdir -p frontend/packages/chatbot-plugin-ui/src/icons
mkdir -p frontend/packages/chatbot-plugin-ui/src/tests/adapters
mkdir -p frontend/packages/chatbot-plugin-ui/src/tests/hooks
mkdir -p frontend/packages/chatbot-plugin-ui/src/tests/components
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "@Teng91/chatbot-plugin-ui",
  "version": "0.1.0",
  "description": "React components for AI agent chat interfaces — AgentInput and ChatbotPlugin",
  "type": "module",
  "main": "./dist/chatbot-plugin-ui.umd.cjs",
  "module": "./dist/chatbot-plugin-ui.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/chatbot-plugin-ui.js",
      "require": "./dist/chatbot-plugin-ui.umd.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./dist/style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite build --watch",
    "build": "tsc --emitDeclarationOnly && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^2.0.0"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationDir": "./dist/types",
    "outDir": "./dist",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "exclude": ["src/tests", "node_modules", "dist"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'], exclude: ['src/tests'] }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatbotPluginUI',
      fileName: 'chatbot-plugin-ui',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
})
```

- [ ] **Step 5: Write test setup file `src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Install dependencies**

```bash
cd frontend/packages/chatbot-plugin-ui && npm install
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd frontend/packages/chatbot-plugin-ui && npm run typecheck
```

Expected: exits 0 (no src files yet, that's fine)

- [ ] **Step 8: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/
git commit -m "feat: scaffold @Teng91/chatbot-plugin-ui package"
```

---

## Task 2: Types

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
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
```

- [ ] **Step 2: Verify types compile**

```bash
cd frontend/packages/chatbot-plugin-ui && npm run typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: CSS design tokens

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/styles/tokens.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/styles/base.css`

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
/* Light mode — default */
[data-chatbot-theme] {
  --cp-font-body: 'Geist', system-ui, sans-serif;
  --cp-font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --cp-primary: #004ac6;
  --cp-on-primary: #ffffff;
  --cp-primary-container: #2563eb;
  --cp-on-primary-container: #eeefff;

  --cp-surface: #ffffff;
  --cp-surface-container-lowest: #ffffff;
  --cp-surface-container-low: #f3f3f4;
  --cp-surface-container: #eeeeee;
  --cp-surface-container-high: #e8e8e8;

  --cp-on-surface: #1a1c1c;
  --cp-on-surface-variant: #434655;
  --cp-outline: #737686;
  --cp-outline-variant: #c3c6d7;

  --cp-secondary-container: #e3e1ec;
  --cp-on-secondary-container: #63646c;

  --cp-error: #ba1a1a;

  --cp-radius-sm: 0.5rem;
  --cp-radius-md: 0.75rem;
  --cp-radius-lg: 1rem;
  --cp-radius-full: 9999px;

  --cp-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode */
[data-chatbot-theme='dark'] {
  --cp-primary: #c0c1ff;
  --cp-on-primary: #1000a9;
  --cp-primary-container: #4338ca;
  --cp-on-primary-container: #e0e7ff;

  --cp-surface: #060e20;
  --cp-surface-container-lowest: #060e20;
  --cp-surface-container-low: #131b2e;
  --cp-surface-container: #1c253d;
  --cp-surface-container-high: #283149;

  --cp-on-surface: #dae2fd;
  --cp-on-surface-variant: #94a3b8;
  --cp-outline: #475569;
  --cp-outline-variant: #334155;

  --cp-secondary-container: #1e293b;
  --cp-on-secondary-container: #f1f5f9;

  --cp-error: #ef4444;
}

/* Auto: respect OS preference */
@media (prefers-color-scheme: dark) {
  [data-chatbot-theme='auto'] {
    --cp-primary: #c0c1ff;
    --cp-on-primary: #1000a9;
    --cp-primary-container: #4338ca;
    --cp-on-primary-container: #e0e7ff;

    --cp-surface: #060e20;
    --cp-surface-container-lowest: #060e20;
    --cp-surface-container-low: #131b2e;
    --cp-surface-container: #1c253d;
    --cp-surface-container-high: #283149;

    --cp-on-surface: #dae2fd;
    --cp-on-surface-variant: #94a3b8;
    --cp-outline: #475569;
    --cp-outline-variant: #334155;

    --cp-secondary-container: #1e293b;
    --cp-on-secondary-container: #f1f5f9;

    --cp-error: #ef4444;
  }
}
```

- [ ] **Step 2: Write `src/styles/base.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

[data-chatbot-theme] button {
  cursor: pointer;
}

[data-chatbot-theme] input,
[data-chatbot-theme] textarea {
  font-family: var(--cp-font-body);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/styles/
git commit -m "feat: add CSS design token system"
```

---

## Task 4: SVG icon components

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/icons/index.tsx`

- [ ] **Step 1: Write `src/icons/index.tsx`**

```tsx
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
})

export function SearchIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" />
    </svg>
  )
}

export function SendIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

export function TerminalIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 14H4V6h16zm-2-2h-6v-2h6zM7.5 8 6 9.5 8.5 12 6 14.5 7.5 16l4-4z" />
    </svg>
  )
}

export function BotIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5m7.5 5H9v-2h6zm-.5-3.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5" />
    </svg>
  )
}

export function CloseIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

export function ChatBubbleIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2" />
    </svg>
  )
}

export function ChevronDownIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  )
}

export function ChevronUpIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/icons/
git commit -m "feat: add inline SVG icon components"
```

---

## Task 5: OpenAI stream adapter + tests

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/adapters/openai.ts`
- Create: `frontend/packages/chatbot-plugin-ui/src/tests/adapters/openai.test.ts`

- [ ] **Step 1: Write the failing tests first**

```ts
// src/tests/adapters/openai.test.ts
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
```

- [ ] **Step 2: Run tests — expect failure (file not found)**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test -- src/tests/adapters/openai.test.ts
```

Expected: FAIL — `Cannot find module '../../adapters/openai'`

- [ ] **Step 3: Write `src/adapters/openai.ts`**

```ts
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test -- src/tests/adapters/openai.test.ts
```

Expected: all green

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/adapters/ frontend/packages/chatbot-plugin-ui/src/tests/adapters/
git commit -m "feat: add OpenAI-compatible stream adapter with tests"
```

---

## Task 6: useChat hook + tests

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/hooks/useChat.ts`
- Create: `frontend/packages/chatbot-plugin-ui/src/tests/hooks/useChat.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/tests/hooks/useChat.test.tsx
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
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test -- src/tests/hooks/useChat.test.tsx
```

Expected: FAIL — `Cannot find module '../../hooks/useChat'`

- [ ] **Step 3: Write `src/hooks/useChat.ts`**

```ts
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
  // Ref keeps latest messages accessible inside async callbacks without stale closures
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test -- src/tests/hooks/useChat.test.tsx
```

Expected: all green

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/hooks/ frontend/packages/chatbot-plugin-ui/src/tests/hooks/
git commit -m "feat: add useChat hook with lifecycle callbacks and tests"
```

---

## Task 7: ToolCallCard (AgentInput sub-component)

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/components/AgentInput/ToolCallCard.module.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/AgentInput/ToolCallCard.tsx`

- [ ] **Step 1: Write `ToolCallCard.module.css`**

```css
.card {
  background: var(--cp-surface-container-low);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-md);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  gap: 0.75rem;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.iconWrap {
  width: 2rem;
  height: 2rem;
  background: color-mix(in srgb, var(--cp-primary) 12%, transparent);
  border-radius: var(--cp-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cp-primary);
  flex-shrink: 0;
}

.name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cp-on-surface);
  font-family: var(--cp-font-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  font-size: 0.6875rem;
  font-family: var(--cp-font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.5rem;
  border-radius: var(--cp-radius-full);
}

.badge--running {
  background: color-mix(in srgb, var(--cp-primary) 15%, transparent);
  color: var(--cp-primary);
}

.badge--done {
  background: #dcfce7;
  color: #166534;
}

.badge--error {
  background: color-mix(in srgb, var(--cp-error) 15%, transparent);
  color: var(--cp-error);
}

.chevron {
  color: var(--cp-outline);
  flex-shrink: 0;
  transition: transform var(--cp-transition);
}

.chevron--open {
  transform: rotate(180deg);
}

.body {
  border-top: 1px solid var(--cp-outline-variant);
  padding: 0.75rem 1rem;
}

.code {
  background: var(--cp-surface-container);
  border-radius: var(--cp-radius-sm);
  padding: 0.625rem 0.75rem;
  font-family: var(--cp-font-mono);
  font-size: 0.8125rem;
  color: var(--cp-on-surface-variant);
  overflow-x: auto;
  white-space: pre;
  display: block;
}

.result {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--cp-on-surface-variant);
  font-family: var(--cp-font-body);
  line-height: 1.5;
}
```

- [ ] **Step 2: Write `ToolCallCard.tsx`**

```tsx
import { useState } from 'react'
import { TerminalIcon, ChevronDownIcon } from '../../icons'
import type { Message } from '../../types'
import styles from './ToolCallCard.module.css'

interface ToolCallCardProps {
  message: Message
  defaultOpen?: boolean
}

export function ToolCallCard({ message, defaultOpen = false }: ToolCallCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const { toolCall, toolResult } = message

  if (!toolCall) return null

  const status = toolResult
    ? toolResult.isError
      ? 'error'
      : 'done'
    : 'running'

  const badgeLabel = status === 'running' ? 'Running' : status === 'done' ? 'Done' : 'Error'

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => setOpen((v) => !v)} role="button" aria-expanded={open}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrap}>
            <TerminalIcon size={16} />
          </div>
          <span className={styles.name}>{toolCall.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`${styles.badge} ${styles[`badge--${status}`]}`}>{badgeLabel}</span>
          <div className={`${styles.chevron} ${open ? styles['chevron--open'] : ''}`}>
            <ChevronDownIcon size={16} />
          </div>
        </div>
      </div>
      {open && (
        <div className={styles.body}>
          <code className={styles.code}>{JSON.stringify(toolCall.arguments, null, 2)}</code>
          {toolResult && (
            <p className={styles.result}>{toolResult.content}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/components/AgentInput/ToolCallCard*
git commit -m "feat: add collapsible ToolCallCard component"
```

---

## Task 8: AgentInput component

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/components/AgentInput/AgentInput.module.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/AgentInput/AgentInput.tsx`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/AgentInput/index.ts`
- Create: `frontend/packages/chatbot-plugin-ui/src/tests/components/AgentInput.test.tsx`

- [ ] **Step 1: Write `AgentInput.module.css`**

```css
.root {
  width: 100%;
  font-family: var(--cp-font-body);
  color: var(--cp-on-surface);
}

.rainbowWrap {
  position: relative;
  padding: 1.5px;
  border-radius: var(--cp-radius-md);
  background: linear-gradient(90deg, #2563eb, #9333ea, #db2777, #2563eb);
  background-size: 300% 300%;
  animation: rainbowFlow 4s ease infinite;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform var(--cp-transition), box-shadow var(--cp-transition);
}

.rainbowWrap:focus-within {
  transform: scale(1.01);
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.15);
}

@keyframes rainbowFlow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.inputInner {
  background: var(--cp-surface);
  border-radius: calc(var(--cp-radius-md) - 1.5px);
  display: flex;
  align-items: center;
  padding: 0.875rem 1.25rem;
  gap: 0.75rem;
}

.iconSlot {
  color: var(--cp-outline);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--cp-font-body);
  font-size: 1rem;
  color: var(--cp-on-surface);
  min-width: 0;
}

.input::placeholder {
  color: var(--cp-outline);
  opacity: 0.6;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
}

.sendButton {
  background: var(--cp-primary);
  color: var(--cp-on-primary);
  border: none;
  border-radius: var(--cp-radius-sm);
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: var(--cp-font-body);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: opacity var(--cp-transition), transform var(--cp-transition);
  white-space: nowrap;
}

.sendButton:hover:not(:disabled) { opacity: 0.9; }
.sendButton:active:not(:disabled) { transform: scale(0.95); }
.sendButton:disabled { opacity: 0.5; cursor: not-allowed; }

.toolCallsArea {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestions {
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.chip {
  background: var(--cp-surface-container-low);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-full);
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-family: var(--cp-font-body);
  color: var(--cp-on-surface-variant);
  transition: background var(--cp-transition);
  cursor: pointer;
}

.chip:hover { background: var(--cp-surface-container); }
```

- [ ] **Step 2: Write `AgentInput.tsx`**

```tsx
import { useState, useRef, type KeyboardEvent } from 'react'
import '../../styles/base.css'
import { SearchIcon, SendIcon } from '../../icons'
import { ToolCallCard } from './ToolCallCard'
import type { AgentInputProps } from '../../types'
import styles from './AgentInput.module.css'

export function AgentInput({
  onSend,
  isLoading = false,
  messages = [],
  theme = 'auto',
  className = '',
  placeholder = 'Ask the AI agent...',
  suggestions = [],
  onSuggestionClick,
  sendIcon,
  searchIcon,
}: AgentInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const text = value.trim()
    if (!text || isLoading) return
    onSend(text)
    setValue('')
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toolMessages = messages.filter((m) => m.role === 'tool')

  return (
    <div data-chatbot-theme={theme} className={`${styles.root} ${className}`}>
      <div className={styles.rainbowWrap}>
        <div className={styles.inputInner}>
          <span className={styles.iconSlot}>
            {searchIcon ?? <SearchIcon size={20} />}
          </span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Agent input"
          />
          <div className={styles.actions}>
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={isLoading || !value.trim()}
              aria-label="Send"
            >
              {sendIcon ?? <SendIcon size={16} />}
              {isLoading ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
      </div>

      {toolMessages.length > 0 && (
        <div className={styles.toolCallsArea}>
          {toolMessages.map((m) => (
            <ToolCallCard key={m.id} message={m} defaultOpen />
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => {
                onSuggestionClick ? onSuggestionClick(s) : onSend(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
export { AgentInput } from './AgentInput'
export { ToolCallCard } from './ToolCallCard'
```

- [ ] **Step 4: Write smoke tests**

```tsx
// src/tests/components/AgentInput.test.tsx
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
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
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
```

- [ ] **Step 5: Run tests**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test -- src/tests/components/AgentInput.test.tsx
```

Expected: all green

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/components/AgentInput/
git commit -m "feat: add AgentInput component with rainbow border and tool call cards"
```

---

## Task 9: ChatbotPlugin sub-components

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/MessageBubble.module.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/MessageBubble.tsx`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/ToolCallBlock.module.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/ToolCallBlock.tsx`

- [ ] **Step 1: Write `MessageBubble.module.css`**

```css
.wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 85%;
}

.wrap--user {
  align-self: flex-end;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: var(--cp-outline);
  font-family: var(--cp-font-body);
}

.bubble {
  padding: 0.75rem 1rem;
  border-radius: var(--cp-radius-lg);
  font-size: 0.875rem;
  line-height: 1.5;
  font-family: var(--cp-font-body);
  word-break: break-word;
}

.bubble--assistant {
  background: var(--cp-secondary-container);
  color: var(--cp-on-secondary-container);
  border-top-left-radius: 0.25rem;
}

.bubble--user {
  background: var(--cp-primary);
  color: var(--cp-on-primary);
  border-top-right-radius: 0.25rem;
}
```

- [ ] **Step 2: Write `MessageBubble.tsx`**

```tsx
import type { Message } from '../../types'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`${styles.wrap} ${isUser ? styles['wrap--user'] : ''}`}>
      {!isUser && (
        <div className={styles.meta}>
          <span>Agent</span>
          <span>{time}</span>
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles['bubble--user'] : styles['bubble--assistant']}`}>
        {message.content || <span style={{ opacity: 0.4 }}>…</span>}
      </div>
      {isUser && (
        <div className={`${styles.meta}`} style={{ alignSelf: 'flex-end' }}>
          <span>{time}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `ToolCallBlock.module.css`**

```css
.block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem;
  background: var(--cp-surface-container-low);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-md);
  font-family: var(--cp-font-body);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--cp-primary);
}

.title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cp-on-surface);
}

.status {
  font-size: 0.625rem;
  font-family: var(--cp-font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.5rem;
  border-radius: var(--cp-radius-full);
}

.status--running {
  background: color-mix(in srgb, var(--cp-primary) 12%, transparent);
  color: var(--cp-primary);
}

.status--done {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status--error {
  background: color-mix(in srgb, var(--cp-error) 12%, transparent);
  color: var(--cp-error);
}

.code {
  background: var(--cp-surface-container);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-sm);
  padding: 0.5rem 0.75rem;
  font-family: var(--cp-font-mono);
  font-size: 0.75rem;
  color: var(--cp-on-surface-variant);
  overflow-x: auto;
  white-space: pre;
  display: block;
}

.resultText {
  font-size: 0.75rem;
  color: var(--cp-on-surface-variant);
  line-height: 1.5;
}
```

- [ ] **Step 4: Write `ToolCallBlock.tsx`**

```tsx
import { TerminalIcon } from '../../icons'
import type { Message } from '../../types'
import styles from './ToolCallBlock.module.css'

interface ToolCallBlockProps {
  message: Message
}

export function ToolCallBlock({ message }: ToolCallBlockProps) {
  const { toolCall, toolResult } = message
  if (!toolCall) return null

  const status = toolResult ? (toolResult.isError ? 'error' : 'done') : 'running'
  const statusLabel = { running: 'Running', done: 'Executed', error: 'Error' }[status]

  return (
    <div className={styles.block}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <TerminalIcon size={16} />
          <span className={styles.title}>MCP Tool: {toolCall.name}</span>
        </div>
        <span className={`${styles.status} ${styles[`status--${status}`]}`}>{statusLabel}</span>
      </div>
      <code className={styles.code}>{JSON.stringify(toolCall.arguments, null, 2)}</code>
      {toolResult && <p className={styles.resultText}>{toolResult.content}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/MessageBubble*
git add frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/ToolCallBlock*
git commit -m "feat: add MessageBubble and ToolCallBlock sub-components"
```

---

## Task 10: ChatbotPlugin main component

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/ChatbotPlugin.module.css`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/ChatbotPlugin.tsx`
- Create: `frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/index.ts`
- Create: `frontend/packages/chatbot-plugin-ui/src/tests/components/ChatbotPlugin.test.tsx`

- [ ] **Step 1: Write `ChatbotPlugin.module.css`**

```css
.wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
  font-family: var(--cp-font-body);
}

.fab {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  background: var(--cp-primary);
  color: var(--cp-on-primary);
  border: none;
  border-radius: var(--cp-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--cp-transition);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.fab:hover { transform: scale(1.07); }
.fab:active { transform: scale(0.95); }

.badge {
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  min-width: 1.1rem;
  height: 1.1rem;
  background: var(--cp-error);
  color: #fff;
  border-radius: var(--cp-radius-full);
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--cp-surface);
}

.chatWindow {
  background: var(--cp-surface);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-lg);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.chatWindow[data-open='true'] {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}

.chatWindow[data-open='false'] {
  transform: scale(0.88);
  opacity: 0;
  pointer-events: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--cp-outline-variant);
  background: var(--cp-surface);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--cp-primary-container);
  border-radius: var(--cp-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cp-on-primary);
  position: relative;
  flex-shrink: 0;
}

.onlineDot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.7rem;
  height: 0.7rem;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid var(--cp-surface);
}

.headerTitle {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cp-on-surface);
  font-family: var(--cp-font-body);
}

.headerSub {
  font-size: 0.6875rem;
  color: var(--cp-outline);
  font-family: var(--cp-font-body);
}

.closeBtn {
  background: none;
  border: none;
  padding: 0.375rem;
  border-radius: var(--cp-radius-full);
  color: var(--cp-on-surface-variant);
  display: flex;
  align-items: center;
  transition: background var(--cp-transition);
}

.closeBtn:hover { background: var(--cp-surface-container-low); }

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb {
  background: var(--cp-outline-variant);
  border-radius: 10px;
}

.emptyState {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cp-outline);
  font-size: 0.875rem;
  font-family: var(--cp-font-body);
  padding: 2rem;
  text-align: center;
}

.typingWrap {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--cp-secondary-container);
  border-radius: var(--cp-radius-lg);
  border-top-left-radius: 0.25rem;
  width: fit-content;
}

.dot {
  width: 0.4rem;
  height: 0.4rem;
  background: var(--cp-primary);
  border-radius: 50%;
  animation: typingBounce 1.2s ease infinite;
}
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.footer {
  padding: 0.875rem;
  border-top: 1px solid var(--cp-outline-variant);
  background: var(--cp-surface);
}

.inputRow {
  position: relative;
}

.chatInput {
  width: 100%;
  background: var(--cp-surface-container-low);
  border: 1px solid var(--cp-outline-variant);
  border-radius: var(--cp-radius-md);
  padding: 0.625rem 2.75rem 0.625rem 0.875rem;
  font-family: var(--cp-font-body);
  font-size: 0.875rem;
  color: var(--cp-on-surface);
  outline: none;
  transition: border-color var(--cp-transition), box-shadow var(--cp-transition);
  box-sizing: border-box;
}

.chatInput:focus {
  border-color: var(--cp-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cp-primary) 20%, transparent);
}

.chatInput::placeholder { color: var(--cp-outline); opacity: 0.7; }

.chatSendBtn {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.85rem;
  height: 1.85rem;
  background: var(--cp-primary);
  color: var(--cp-on-primary);
  border: none;
  border-radius: var(--cp-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--cp-transition);
}

.chatSendBtn:hover:not(:disabled) { opacity: 0.9; }
.chatSendBtn:active:not(:disabled) { transform: translateY(-50%) scale(0.93); }
.chatSendBtn:disabled { opacity: 0.45; cursor: not-allowed; }
```

- [ ] **Step 2: Write `ChatbotPlugin.tsx`**

```tsx
import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import '../../styles/base.css'
import { BotIcon, ChatBubbleIcon, CloseIcon, SendIcon } from '../../icons'
import { MessageBubble } from './MessageBubble'
import { ToolCallBlock } from './ToolCallBlock'
import type { ChatbotPluginProps } from '../../types'
import styles from './ChatbotPlugin.module.css'

const DEFAULT_EMPTY_STATE = (
  <p>Start a conversation with the AI agent.</p>
)

export function ChatbotPlugin({
  messages,
  onSend,
  isLoading = false,
  unreadCount,
  theme = 'auto',
  className = '',
  title = 'AI Assistant',
  placeholder = 'Ask a question...',
  fabIcon,
  headerAvatar,
  emptyState = DEFAULT_EMPTY_STATE,
  width = 380,
  height = 520,
}: ChatbotPluginProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = () => {
    const text = value.trim()
    if (!text || isLoading) return
    onSend(text)
    setValue('')
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const windowStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div data-chatbot-theme={theme} className={`${styles.wrapper} ${className}`}>
      {/* Chat window */}
      <div
        className={styles.chatWindow}
        data-open={open ? 'true' : 'false'}
        style={windowStyle}
        role="dialog"
        aria-label="Chat with AI assistant"
        aria-hidden={!open}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {headerAvatar ?? <BotIcon size={20} />}
              <div className={styles.onlineDot} />
            </div>
            <div>
              <div className={styles.headerTitle}>{title}</div>
              <div className={styles.headerSub}>Online</div>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {/* Messages */}
        <div className={styles.messages} role="log">
          {messages.length === 0 ? (
            <div className={styles.emptyState}>{emptyState}</div>
          ) : (
            messages.map((m) =>
              m.role === 'tool' ? (
                <ToolCallBlock key={m.id} message={m} />
              ) : (
                <MessageBubble key={m.id} message={m} />
              )
            )
          )}
          {isLoading && (
            <div className={styles.typingWrap} aria-label="Agent is typing">
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.inputRow}>
            <input
              className={styles.chatInput}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              disabled={isLoading}
              aria-label="Type a message"
            />
            <button
              className={styles.chatSendBtn}
              onClick={handleSend}
              disabled={isLoading || !value.trim()}
              aria-label="Send message"
            >
              <SendIcon size={14} />
            </button>
          </div>
        </footer>
      </div>

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        {fabIcon ?? (open ? <CloseIcon size={24} /> : <ChatBubbleIcon size={24} />)}
        {!open && unreadCount != null && unreadCount > 0 && (
          <div className={styles.badge} aria-label={`${unreadCount} unread messages`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
export { ChatbotPlugin } from './ChatbotPlugin'
export { MessageBubble } from './MessageBubble'
export { ToolCallBlock } from './ToolCallBlock'
```

- [ ] **Step 4: Write smoke tests**

```tsx
// src/tests/components/ChatbotPlugin.test.tsx
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
```

- [ ] **Step 5: Run all tests**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test
```

Expected: all green

- [ ] **Step 6: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/components/ChatbotPlugin/
git add frontend/packages/chatbot-plugin-ui/src/tests/components/ChatbotPlugin.test.tsx
git commit -m "feat: add ChatbotPlugin floating widget component"
```

---

## Task 11: Public exports + build verification

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/src/index.ts`

- [ ] **Step 1: Write `src/index.ts`**

```ts
export { AgentInput } from './components/AgentInput'
export { ToolCallCard } from './components/AgentInput'
export { ChatbotPlugin } from './components/ChatbotPlugin'
export { MessageBubble } from './components/ChatbotPlugin'
export { ToolCallBlock } from './components/ChatbotPlugin'
export { useChat } from './hooks/useChat'
export { openaiAdapter } from './adapters/openai'

export type {
  Message,
  ToolCall,
  ToolCallResult,
  StreamEvent,
  StreamAdapter,
  RequestOptions,
  UseChatOptions,
  UseChatReturn,
  AgentInputProps,
  ChatbotPluginProps,
} from './types'
```

- [ ] **Step 2: Run full build**

```bash
cd frontend/packages/chatbot-plugin-ui && npm run build
```

Expected: `dist/` directory created with `chatbot-plugin-ui.js`, `chatbot-plugin-ui.umd.cjs`, `style.css`, and `types/` declaration files.

- [ ] **Step 3: Run all tests**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test
```

Expected: all green

- [ ] **Step 4: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/src/index.ts
git commit -m "feat: wire up public API exports and verify build"
```

---

## Task 12: README

**Files:**
- Create: `frontend/packages/chatbot-plugin-ui/README.md`

- [ ] **Step 1: Write `README.md`**

(See the actual README content below — write it verbatim.)

````markdown
# @Teng91/chatbot-plugin-ui

React components for embedding AI agent chat interfaces into any web app.

## Components

- **`AgentInput`** — Full-width AI search bar with animated rainbow border, collapsible MCP tool call cards, and suggestion chips
- **`ChatbotPlugin`** — Floating chatbot widget (bottom-right FAB) with a slide-up chat window, message bubbles, and inline tool call blocks

Both components support **light / dark / auto** theming via CSS custom properties.

## Installation

```bash
# Requires GitHub Packages auth — add to .npmrc:
# @Teng91:registry=https://npm.pkg.github.com
npm install @Teng91/chatbot-plugin-ui
```

Import the stylesheet once in your app root:

```ts
import '@Teng91/chatbot-plugin-ui/dist/style.css'
```

Optional — load recommended fonts (components fall back to system fonts without them):

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

## Quick Start

```tsx
import { ChatbotPlugin, useChat } from '@Teng91/chatbot-plugin-ui'

function App() {
  const { messages, sendMessage, isLoading } = useChat({
    endpoint: '/api/chat',
  })

  return (
    <ChatbotPlugin
      messages={messages}
      onSend={sendMessage}
      isLoading={isLoading}
      title="My Assistant"
    />
  )
}
```

## AgentInput

```tsx
import { AgentInput, useChat } from '@Teng91/chatbot-plugin-ui'

function SearchPage() {
  const { messages, sendMessage, isLoading } = useChat({
    endpoint: '/api/chat',
  })

  return (
    <AgentInput
      onSend={sendMessage}
      isLoading={isLoading}
      messages={messages}
      placeholder="Ask the AI agent..."
      suggestions={['Compare versions', 'List breaking changes']}
      theme="auto"
    />
  )
}
```

## Props

### AgentInputProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSend` | `(text: string) => void` | required | Called when user submits |
| `isLoading` | `boolean` | `false` | Disables input, shows loading state |
| `messages` | `Message[]` | `[]` | Tool call events shown below the input |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color scheme |
| `placeholder` | `string` | `'Ask the AI agent...'` | Input placeholder |
| `suggestions` | `string[]` | `[]` | Clickable suggestion chips |
| `onSuggestionClick` | `(text: string) => void` | `onSend` | Custom chip click handler |
| `searchIcon` | `ReactNode` | built-in SVG | Replace the search icon |
| `sendIcon` | `ReactNode` | built-in SVG | Replace the send icon |
| `className` | `string` | `''` | Extra class on root element |

### ChatbotPluginProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `messages` | `Message[]` | required | Chat history to display |
| `onSend` | `(text: string) => void` | required | Called when user sends a message |
| `isLoading` | `boolean` | `false` | Shows typing indicator |
| `unreadCount` | `number` | — | Badge count on FAB |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color scheme |
| `title` | `string` | `'AI Assistant'` | Header title |
| `placeholder` | `string` | `'Ask a question...'` | Input placeholder |
| `fabIcon` | `ReactNode` | built-in SVG | Replace the FAB icon |
| `headerAvatar` | `ReactNode` | built-in bot icon | Replace the header avatar |
| `emptyState` | `ReactNode` | default message | Content shown when no messages |
| `width` | `number \| string` | `380` | Chat window width (px or CSS value) |
| `height` | `number \| string` | `520` | Chat window height (px or CSS value) |
| `className` | `string` | `''` | Extra class on root element |

## useChat Hook

```tsx
const { messages, sendMessage, isLoading, error, clearMessages } = useChat({
  endpoint: '/api/chat',

  // Optional: replace the default OpenAI-compatible adapter
  streamAdapter: myCustomAdapter,

  // Optional: pre-populate conversation
  initialMessages: [],

  // Optional: extra headers (e.g. Authorization)
  headers: { Authorization: `Bearer ${token}` },

  // Lifecycle hooks
  onBeforeToolCall: async (toolCall) => {
    await confirmWithUser(toolCall)  // can throw to cancel
    return toolCall                  // or return modified toolCall
  },
  onAfterToolCall: async (toolCall, result) => {
    await logToAuditTrail(toolCall, result)
    return result
  },
  onMessage: (message) => console.log('new message', message),
  onStreamChunk: (chunk) => console.log('chunk', chunk),
  onStreamEnd: () => console.log('stream done'),
  onError: (error) => console.error(error),
})
```

## Custom Backend Adapter

To use a backend that isn't OpenAI-compatible, implement the `StreamAdapter` interface:

```ts
import type { StreamAdapter } from '@Teng91/chatbot-plugin-ui'

const myAdapter: StreamAdapter = {
  buildRequest(messages, options) {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify({ history: messages }),
    }
  },

  parse(line) {
    if (!line.startsWith('data:')) return null
    const data = line.slice(5).trim()
    if (data === 'END') return { type: 'done' }
    return { type: 'text_delta', content: data }
  },
}

useChat({ endpoint: '/api/my-chat', streamAdapter: myAdapter })
```

## Theming

Override CSS custom properties to customise colors:

```css
[data-chatbot-theme] {
  --cp-primary: #7c3aed;
  --cp-on-primary: #ffffff;
  --cp-surface: #ffffff;
  --cp-error: #dc2626;
}
```

Full token reference:

| Token | Light default | Dark default |
|-------|--------------|-------------|
| `--cp-primary` | `#004ac6` | `#c0c1ff` |
| `--cp-on-primary` | `#ffffff` | `#1000a9` |
| `--cp-surface` | `#ffffff` | `#060e20` |
| `--cp-on-surface` | `#1a1c1c` | `#dae2fd` |
| `--cp-outline` | `#737686` | `#475569` |
| `--cp-outline-variant` | `#c3c6d7` | `#334155` |
| `--cp-error` | `#ba1a1a` | `#ef4444` |
| `--cp-font-body` | `'Geist', system-ui` | ← same |
| `--cp-font-mono` | `'JetBrains Mono', monospace` | ← same |

## Publishing

This package is published to GitHub Packages. See `.github/workflows/publish-npm.yml` for the CI workflow. To trigger a release, go to **Actions → Publish to GitHub Packages → Run workflow**.
````

- [ ] **Step 2: Commit**

```bash
git add frontend/packages/chatbot-plugin-ui/README.md
git commit -m "docs: add README for @Teng91/chatbot-plugin-ui"
```

---

## Task 13: GitHub Actions publish workflow

**Files:**
- Create: `.github/workflows/publish-npm.yml`

- [ ] **Step 1: Write `.github/workflows/publish-npm.yml`**

```yaml
name: Publish to GitHub Packages

on:
  workflow_dispatch:
    inputs:
      version_bump:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

defaults:
  run:
    working-directory: frontend/packages/chatbot-plugin-ui

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write

    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@Teng91'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Bump version
        run: npm version ${{ inputs.version_bump }} --no-git-tag-version

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit version bump
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json
          git commit -m "chore: bump package version [skip ci]"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish-npm.yml
git commit -m "ci: add manual publish workflow for @Teng91/chatbot-plugin-ui"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd frontend/packages/chatbot-plugin-ui && npm test
```

Expected: all tests pass

- [ ] **Step 2: Run full build**

```bash
cd frontend/packages/chatbot-plugin-ui && npm run build
```

Expected: `dist/` produced with JS + CSS + `.d.ts` files

- [ ] **Step 3: Verify exports exist in dist**

```bash
node -e "
const pkg = require('./dist/chatbot-plugin-ui.umd.cjs');
console.log(Object.keys(pkg));
"
```

Expected output includes: `AgentInput`, `ChatbotPlugin`, `useChat`, `openaiAdapter`

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete @Teng91/chatbot-plugin-ui prototype"
```
