import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Mic, Square, Paperclip, X, Loader } from 'lucide-react';
import { IconBtn, Spinner } from './ds';
import { transcribeBlob, transcribeFile } from '../api';

export default function ChatInput({ onSend, onSendAudio, loading }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [text]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  const canSend = text.trim() && !loading && !isRecording && !isTranscribing;

  // ── Send text ──
  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim(), 'text');
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, canSend, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Recording ──
  const startRecording = async () => {
    if (loading || isTranscribing) return;
    chunksRef.current = [];
    setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recRef.current = rec;
      rec.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          const transcript = await transcribeBlob(blob, mime);
          if (transcript?.trim()) {
            onSendAudio(transcript.trim(), 'audio-record');
          }
        } catch (err) {
          console.error('Transcription failed:', err);
        } finally {
          setIsTranscribing(false);
        }
      };
      rec.start(200);
      setIsRecording(true);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch (e) {
      console.error('Mic error:', e);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    recRef.current?.stop();
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ── File upload ──
  const handleFileSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIsTranscribing(true);
    try {
      const transcript = await transcribeFile(f);
      if (transcript?.trim()) {
        onSendAudio(transcript.trim(), 'audio-upload');
      }
    } catch (err) {
      console.error('File transcription failed:', err);
    } finally {
      setFile(null);
      setIsTranscribing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const disabled = loading || isTranscribing;

  return (
    <div style={{
      padding: '8px 16px 20px',
      background: 'var(--chat-bg)',
    }}>
      <div style={{
        maxWidth: 768, margin: '0 auto', width: '100%',
      }}>
        {/* File attachment preview */}
        {file && !isTranscribing && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', marginBottom: 6,
            background: 'var(--card)', border: '1px solid var(--rule)',
            borderRadius: 8, fontSize: 12, color: 'var(--ink-3)',
          }}>
            <Paperclip size={12} strokeWidth={2} />
            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </span>
            <button onClick={removeFile} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-4)', padding: 0, display: 'flex',
            }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Transcribing indicator */}
        {isTranscribing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginBottom: 6,
            background: 'var(--info-bg)', border: '1px solid var(--info-rule)',
            borderRadius: 8, fontSize: 13, color: 'var(--info)',
          }}>
            <Spinner size={14} color="var(--info)" />
            Transcribing audio...
          </div>
        )}

        {/* Main input container */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 4,
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 24, padding: '8px 8px 8px 16px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>

          {/* Attach button */}
          <IconBtn
            Icon={Paperclip}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isRecording}
            title="Upload audio file"
            size={32}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Textarea or recording indicator */}
          {isRecording ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', fontSize: 14, color: 'var(--bear)',
              minHeight: 24,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--bear)',
                animation: 'blink 1.2s infinite',
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--f-data)', fontWeight: 500 }}>
                {fmt(elapsed)}
              </span>
              <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>Recording...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Message Stock AI..."
              rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', fontSize: 14,
                color: 'var(--ink)', lineHeight: 1.5,
                padding: '6px 4px', maxHeight: 200,
                overflowY: 'auto', minHeight: 24,
              }}
            />
          )}

          {/* Mic button */}
          <button
            onClick={toggleRecording}
            disabled={disabled && !isRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isRecording ? 'var(--bear)' : 'transparent',
              color: isRecording ? '#fff' : 'var(--ink-3)',
              border: 'none', cursor: 'pointer',
              animation: isRecording ? 'rec-pulse 1.5s infinite' : 'none',
              transition: 'all 0.15s', flexShrink: 0, outline: 'none',
              opacity: (disabled && !isRecording) ? 0.35 : 1,
            }}
          >
            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} strokeWidth={2} />}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            title="Send message"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canSend ? 'var(--accent)' : 'var(--rule)',
              color: canSend ? '#fff' : 'var(--ink-5)',
              border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s', flexShrink: 0, outline: 'none',
            }}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}
