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
| `--cp-font-body` | `'Geist', system-ui` | <- same |
| `--cp-font-mono` | `'JetBrains Mono', monospace` | <- same |

## Publishing

This package is published to GitHub Packages. See `.github/workflows/publish-npm.yml` for the CI workflow. To trigger a release, go to **Actions → Publish to GitHub Packages → Run workflow**.
