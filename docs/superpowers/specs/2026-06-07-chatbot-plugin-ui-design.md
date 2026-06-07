# Design: @Teng91/chatbot-plugin-ui npm package

**Date:** 2026-06-07  
**Status:** Approved

## Overview

An npm package published to GitHub Packages Registry (`@Teng91/chatbot-plugin-ui`) that exports two React components — `AgentInput` and `ChatbotPlugin` — plus a `useChat` hook and an OpenAI-compatible stream adapter. Visual designs are defined by the HTML prototypes in `frontend/stitch/`.

## Package Identity

- **Name:** `@Teng91/chatbot-plugin-ui`
- **Registry:** GitHub Packages (`https://npm.pkg.github.com`)
- **Peer dependencies:** `react >= 17`, `react-dom >= 17`
- **Runtime dependencies:** none
- **Build tool:** Vite in library mode

## Package Structure

```
frontend/
└── packages/
    └── chatbot-plugin-ui/
        ├── src/
        │   ├── components/
        │   │   ├── AgentInput/
        │   │   │   ├── AgentInput.tsx       # rainbow-border search bar + results area
        │   │   │   ├── ToolCallCard.tsx     # collapsible MCP tool call card
        │   │   │   └── index.ts
        │   │   ├── ChatbotPlugin/
        │   │   │   ├── ChatbotPlugin.tsx    # FAB + floating chat window
        │   │   │   ├── MessageBubble.tsx    # bot/user message bubble
        │   │   │   ├── ToolCallBlock.tsx    # inline tool call block in chat
        │   │   │   └── index.ts
        │   │   └── icons/                  # inline SVG React components
        │   ├── hooks/
        │   │   ├── useChat.ts              # core streaming + lifecycle hook
        │   │   └── useStreamAdapter.ts     # adapter runner
        │   ├── adapters/
        │   │   └── openai.ts              # OpenAI-compatible SSE adapter
        │   ├── styles/
        │   │   ├── tokens.css             # CSS custom properties (design tokens)
        │   │   └── base.css              # component base styles
        │   ├── types.ts                  # all exported types
        │   └── index.ts                 # public API
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        └── README.md
```

## Components

### AgentInput

The full-page AI search bar from `agent_input.html`. Renders as an embeddable section (not a full page): rainbow-border animated input + collapsible tool call cards below + suggestion chips.

**Props:**
```ts
interface AgentInputProps {
  onSend: (text: string) => void          // required
  isLoading?: boolean
  messages?: Message[]                    // tool call + reasoning events for the *current* query only (not full history)
  theme?: 'light' | 'dark' | 'auto'      // auto = prefers-color-scheme
  className?: string
  placeholder?: string
  suggestions?: string[]
  onSuggestionClick?: (text: string) => void
  sendIcon?: React.ReactNode              // icon slot
  searchIcon?: React.ReactNode            // icon slot
}
```

### ChatbotPlugin

The floating chatbot widget from `chatbot_plugin.html`. Renders a fixed-position FAB in the bottom-right corner; clicking opens a 380×520px chat window with message history and tool call blocks.

**Props:**
```ts
interface ChatbotPluginProps {
  messages: Message[]                     // required
  onSend: (text: string) => void          // required
  isLoading?: boolean
  unreadCount?: number
  theme?: 'light' | 'dark' | 'auto'
  className?: string
  title?: string
  placeholder?: string
  fabIcon?: React.ReactNode               // icon slot
  headerAvatar?: React.ReactNode          // icon slot
  emptyState?: React.ReactNode           // slot for empty chat state
  width?: number | string                 // defaults to 380px, overridable
  height?: number | string               // defaults to 520px, overridable
}
```

## useChat Hook

Core hook that manages streaming state and exposes lifecycle callbacks. Default adapter is OpenAI-compatible SSE.

```ts
interface UseChatOptions {
  endpoint: string
  streamAdapter?: StreamAdapter          // defaults to openaiAdapter
  initialMessages?: Message[]
  headers?: Record<string, string>

  // Lifecycle hooks
  onBeforeToolCall?: (tool: ToolCall) => ToolCall | Promise<ToolCall>
  onAfterToolCall?: (tool: ToolCall, result: ToolCallResult) => ToolCallResult | Promise<ToolCallResult>
  onMessage?: (message: Message) => void
  onStreamChunk?: (chunk: string) => void
  onStreamEnd?: () => void
  onError?: (error: Error) => void
}

interface UseChatReturn {
  messages: Message[]
  sendMessage: (text: string) => void
  isLoading: boolean
  error: Error | null
  clearMessages: () => void
}
```

`onBeforeToolCall` can return a modified `ToolCall` to alter the call, or throw to cancel it. `onAfterToolCall` can return a modified `ToolCallResult` to alter what the AI sees.

## StreamAdapter Interface

```ts
interface StreamAdapter {
  parse: (chunk: string) => StreamEvent | null
  buildRequest: (messages: Message[], options: RequestOptions) => RequestInit
}

type StreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call_start'; tool: ToolCall }
  | { type: 'tool_call_result'; result: ToolCallResult }
  | { type: 'done' }
  | { type: 'error'; error: string }
```

## Styling System

CSS custom properties (defined in `tokens.css`) are the theming interface. Dark mode uses `[data-theme="dark"]` on the component root element, with `prefers-color-scheme` fallback when `theme="auto"`.

Consumers override tokens to customise:
```css
/* in their own CSS */
[data-chatbot-theme] {
  --cp-primary: #7c3aed;
  --cp-surface: #fafafa;
}
```

Light and dark token sets match the color palettes in the HTML prototypes.

## Font Handling

The package does **not** bundle fonts. Components declare `font-family` via CSS tokens with system-ui fallbacks:

```css
--cp-font-body: 'Geist', system-ui, sans-serif;
--cp-font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

Users who want the exact design-spec fonts load them separately (e.g. Google Fonts link tag). Users who skip this get reasonable system font fallbacks automatically.

## Icon System

Built-in inline SVG components for required icons (search, send, terminal, smart_toy, close, chat_bubble, expand_more). Each component has an icon slot prop (`sendIcon`, `fabIcon`, etc.) that replaces the default SVG when provided.

## Public API Exports

```ts
export { AgentInput } from './components/AgentInput'
export { ChatbotPlugin } from './components/ChatbotPlugin'
export { useChat } from './hooks/useChat'
export { openaiAdapter } from './adapters/openai'
export type {
  Message, ToolCall, ToolCallResult,
  StreamAdapter, StreamEvent,
  UseChatOptions, UseChatReturn,
  AgentInputProps, ChatbotPluginProps,
}
```

## GitHub Actions — Publish Workflow

Location: `.github/workflows/publish-npm.yml`

Trigger: **`workflow_dispatch` only** (manual trigger from GitHub Actions UI). Does not run on push or PR. When ready to automate, change trigger to `push: tags: ['v*']`.

The workflow accepts a `version_bump` input (`patch` / `minor` / `major`), bumps the version, builds, and publishes to GitHub Packages using `GITHUB_TOKEN`.

The workflow runs from the `frontend/packages/chatbot-plugin-ui/` directory.
