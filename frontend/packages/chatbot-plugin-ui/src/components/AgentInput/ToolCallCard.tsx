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
