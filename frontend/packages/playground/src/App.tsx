import { useState } from 'react'
import {
  AgentInput,
  ChatbotPlugin,
  useChat,
  type Message,
} from '@Teng91/chatbot-plugin-ui'
import '@Teng91/chatbot-plugin-ui/dist/style.css'

// Mock messages for previewing without a real backend
const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'What are the breaking changes in v2?',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Let me search the changelog for you.',
    timestamp: new Date(),
  },
  {
    id: '3',
    role: 'tool',
    content: '',
    toolCall: { id: 'tc1', name: 'search_docs', arguments: { query: 'v2 breaking changes' } },
    toolResult: { toolCallId: 'tc1', content: 'Found 3 breaking changes: ...' },
    timestamp: new Date(),
  },
  {
    id: '4',
    role: 'assistant',
    content: 'There are 3 breaking changes in v2:\n1. API endpoint changed\n2. Auth header format updated\n3. Response schema modified',
    timestamp: new Date(),
  },
]

export default function App() {
  const [tab, setTab] = useState<'chat' | 'input'>('chat')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')

  // Live hook demo (no real backend — will error on send, that's expected)
  const chat = useChat({ endpoint: '/api/chat' })

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Chatbot Plugin UI — Playground</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('chat')} style={tabBtn(tab === 'chat')}>ChatbotPlugin</button>
        <button onClick={() => setTab('input')} style={tabBtn(tab === 'input')}>AgentInput</button>
        <span style={{ marginLeft: 'auto', alignSelf: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Theme:</span>
        {(['light', 'dark', 'auto'] as const).map((t) => (
          <button key={t} onClick={() => setTheme(t)} style={tabBtn(theme === t)}>{t}</button>
        ))}
      </div>

      {tab === 'chat' && (
        <ChatbotPlugin
          messages={MOCK_MESSAGES}
          onSend={(text) => console.log('[ChatbotPlugin] send:', text)}
          theme={theme}
          title="Demo Assistant"
          suggestions={['List breaking changes', 'Compare versions', 'Show migration guide']}
        />
      )}

      {tab === 'input' && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <AgentInput
            onSend={(text) => console.log('[AgentInput] send:', text)}
            isLoading={false}
            messages={MOCK_MESSAGES.filter((m) => m.role === 'tool')}
            theme={theme}
            suggestions={['Compare versions', 'List breaking changes', 'Show migration guide']}
          />
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
        <strong>useChat hook state:</strong>
        <pre style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ messages: chat.messages.length, isLoading: chat.isLoading, error: chat.error?.message ?? null }, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function tabBtn(active: boolean) {
  return {
    padding: '0.375rem 0.75rem',
    border: '1px solid ' + (active ? '#2563eb' : '#334155'),
    borderRadius: '0.375rem',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.8125rem',
  } as React.CSSProperties
}
