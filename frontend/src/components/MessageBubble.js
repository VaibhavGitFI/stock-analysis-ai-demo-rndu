import { Mic, Paperclip } from 'lucide-react';
import { Avatar, Callout } from './ds';
import ResultCard from './ResultCard';
import Pipeline from './Pipeline';

export default function MessageBubble({ message, stage }) {
  if (message.role === 'user') {
    return (
      <div style={{
        display: 'flex', gap: 12, animation: 'up 0.2s ease',
        maxWidth: 768, width: '100%', margin: '0 auto',
        padding: '0 20px',
      }}>
        <Avatar role="user" size={30} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>You</p>
          <div style={{
            background: 'var(--user-bubble)',
            borderRadius: '14px 14px 14px 2px',
            padding: '12px 16px',
            fontSize: 14, color: 'var(--ink)', lineHeight: 1.6,
            display: 'inline-block', maxWidth: '100%',
            wordBreak: 'break-word',
            border: '1px solid var(--rule)',
          }}>
            {message.content}
          </div>
          {(message.type === 'audio-record' || message.type === 'audio-upload') && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              marginTop: 4, fontSize: 11, color: 'var(--ink-4)',
            }}>
              {message.type === 'audio-record'
                ? <><Mic size={11} strokeWidth={2} /> Transcribed from recording</>
                : <><Paperclip size={11} strokeWidth={2} /> Transcribed from audio file</>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.role === 'assistant') {
    return (
      <div style={{
        display: 'flex', gap: 12, animation: 'up 0.2s ease',
        maxWidth: 768, width: '100%', margin: '0 auto',
        padding: '0 20px',
      }}>
        <Avatar role="assistant" size={30} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4, overflow: 'hidden' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Stock AI</p>
          {message.loading && <Pipeline stage={stage} />}
          {message.error && !message.loading && (
            <Callout type="error">{message.error}</Callout>
          )}
          {message.data && !message.loading && (
            <ResultCard r={message.data} />
          )}
        </div>
      </div>
    );
  }

  return null;
}
