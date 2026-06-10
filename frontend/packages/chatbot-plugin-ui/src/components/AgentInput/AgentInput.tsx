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
