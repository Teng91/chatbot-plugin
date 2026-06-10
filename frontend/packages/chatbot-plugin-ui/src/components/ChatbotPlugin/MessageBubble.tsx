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
