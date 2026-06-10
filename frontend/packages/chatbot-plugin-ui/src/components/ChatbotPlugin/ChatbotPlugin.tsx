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
