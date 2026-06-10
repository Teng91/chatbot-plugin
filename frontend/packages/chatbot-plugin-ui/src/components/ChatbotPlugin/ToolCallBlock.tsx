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
