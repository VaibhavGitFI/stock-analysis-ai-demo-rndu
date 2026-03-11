import { useState, useEffect, useRef, useCallback } from 'react';
import { UserCircle, TrendingUp, LogOut } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatThread from './components/ChatThread';
import ChatInput from './components/ChatInput';
import { analyzeTranscript } from './api';

const uid = () => crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2);

const makeTitle = (text) => {
  const t = text.trim();
  return t.length > 40 ? t.slice(0, 40) + '...' : t;
};

export default function App() {
  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockai-conversations') || '[]'); }
    catch { return []; }
  });
  const [activeId, setActiveId] = useState(() => {
    try { return localStorage.getItem('stockai-active') || null; }
    catch { return null; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(-1);
  const timerRef = useRef(null);

  // Persist
  useEffect(() => {
    localStorage.setItem('stockai-conversations', JSON.stringify(conversations));
  }, [conversations]);
  useEffect(() => {
    if (activeId) localStorage.setItem('stockai-active', activeId);
  }, [activeId]);

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages || [];

  const newChat = useCallback(() => {
    const id = uid();
    setConversations(prev => [
      { id, title: 'New conversation', createdAt: new Date().toISOString(), messages: [] },
      ...prev,
    ]);
    setActiveId(id);
  }, []);

  const sendMessage = useCallback(async (text, source = 'text') => {
    if (loading || !text.trim()) return;

    let convId = activeId;

    if (!convId || (activeConv && activeConv.messages.length > 0)) {
      convId = uid();
      const newConv = { id: convId, title: makeTitle(text), createdAt: new Date().toISOString(), messages: [] };
      setConversations(prev => [newConv, ...prev]);
      setActiveId(convId);
    }

    const userMsg = {
      id: uid(), role: 'user', type: source,
      content: text.trim(), timestamp: new Date().toISOString(),
    };
    const assistantMsgId = uid();
    const assistantMsg = {
      id: assistantMsgId, role: 'assistant', type: 'analysis',
      content: '', data: null, error: null, loading: true,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? {
            ...c,
            title: c.messages.length === 0 ? makeTitle(text) : c.title,
            messages: [...c.messages, userMsg, assistantMsg],
          }
        : c
    ));

    setLoading(true);
    setStage(0);
    let s = 0;
    timerRef.current = setInterval(() => {
      s++;
      if (s < 4) setStage(s);
      else clearInterval(timerRef.current);
    }, 900);

    try {
      const data = await analyzeTranscript(text.trim());
      clearInterval(timerRef.current);
      setStage(4);
      await new Promise(r => setTimeout(r, 350));

      setConversations(prev => prev.map(c =>
        c.id === convId
          ? {
              ...c,
              title: data.ticker ? `${data.ticker} — ${makeTitle(text)}` : c.title,
              messages: c.messages.map(m =>
                m.id === assistantMsgId ? { ...m, loading: false, data } : m
              ),
            }
          : c
      ));
    } catch (e) {
      clearInterval(timerRef.current);
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMsgId ? { ...m, loading: false, error: e.message } : m
              ),
            }
          : c
      ));
    } finally {
      setLoading(false);
      setStage(-1);
    }
  }, [activeId, activeConv, loading]);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveId(null);
    localStorage.removeItem('stockai-conversations');
    localStorage.removeItem('stockai-active');
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveId(id);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ Header ═══ */}
      <header style={{
        height: 50, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--sidebar-border)',
        zIndex: 10,
      }}>
        {/* Left — logo + title (shrinks with sidebar) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(135deg, #0d9488, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: 15, fontWeight: 700, color: '#f3f4f6', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            opacity: sidebarOpen ? 1 : 0,
            width: sidebarOpen ? 'auto' : 0,
            overflow: 'hidden',
            transition: 'opacity 0.2s ease, width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            Stock AI
          </span>
        </div>

        {/* Right — profile */}
        <button
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af', flexShrink: 0,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#f3f4f6'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sidebar-border)'; e.currentTarget.style.color = '#9ca3af'; }}
          title="Profile"
        >
          <UserCircle size={18} strokeWidth={1.8} />
        </button>
      </header>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--chat-bg)' }}>

        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNewChat={newChat}
          onDelete={deleteConversation}
          onClearAll={clearAllConversations}
          collapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
        />

        {/* Main chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ChatThread
            messages={messages}
            stage={stage}
            onSampleClick={(text) => sendMessage(text, 'text')}
          />
          <ChatInput
            onSend={(text, source) => sendMessage(text, source)}
            onSendAudio={(text, source) => sendMessage(text, source)}
            loading={loading}
          />
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <footer style={{
        height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
        background: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--sidebar-border)',
        fontSize: 11, color: '#6b7280',
        position: 'relative',
      }}>
        {/* Left — Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('stockai-conversations');
            localStorage.removeItem('stockai-active');
            window.location.reload();
          }}
          style={{
            position: 'absolute', left: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)',
            cursor: 'pointer',
            color: '#9ca3af', fontSize: 11, fontWeight: 500, fontFamily: 'var(--f-ui)',
            padding: '5px 14px 5px 10px', borderRadius: 20,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--sidebar-active)';
            e.currentTarget.style.borderColor = '#4b5563';
            e.currentTarget.style.color = '#f3f4f6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--sidebar-hover)';
            e.currentTarget.style.borderColor = 'var(--sidebar-border)';
            e.currentTarget.style.color = '#9ca3af';
          }}
          title="Logout"
        >
          <LogOut size={13} strokeWidth={1.8} />
          <span>Logout</span>
        </button>

        {/* Center — branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ opacity: 0.7 }}>Developed By</span>
          <span style={{
            fontWeight: 700,
            background: 'linear-gradient(90deg, #0d9488, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.03em',
          }}>
            Fristine Infotech
          </span>
        </div>
      </footer>
    </div>
  );
}
