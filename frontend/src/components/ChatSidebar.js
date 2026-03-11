import { useState } from 'react';
import {
  SquarePen, Trash2, PanelLeftClose, PanelLeft,
  MessageSquare, Search, Settings, Clock, X,
  Trash, Download, Info,
} from 'lucide-react';

const ICON_SIZE = 18;
const ICON_STROKE = 1.8;

function SidebarIcon({ Icon, label, onClick, active, collapsed, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%',
        background: active ? 'var(--sidebar-active)' : hover ? 'var(--sidebar-hover)' : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        color: danger && hover ? '#f87171' : active ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
        fontSize: 13, fontWeight: 500,
        fontFamily: 'var(--f-ui)',
        transition: 'background 0.15s, color 0.15s',
        outline: 'none',
      }}
    >
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </button>
  );
}

/* ── Overlay panel shell ── */
function OverlayPanel({ title, onClose, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'in 0.15s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 14px 10px', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sidebar-text)' }}>{title}</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--sidebar-text-muted)', padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center',
        }}>
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 14px' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Settings Panel ── */
function SettingsPanel({ onClose, onClearAll, conversationCount }) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <OverlayPanel title="Settings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* App info */}
        <div style={{
          padding: '12px', borderRadius: 8,
          background: 'var(--sidebar-hover)',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Info size={14} color="var(--sidebar-text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)' }}>About</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--sidebar-text-muted)', lineHeight: 1.6, margin: 0 }}>
            Stock AI provides real-time equity analysis powered by live market data from Yahoo Finance.
          </p>
          <p style={{ fontSize: 11, color: 'var(--sidebar-text-muted)', marginTop: 6, opacity: 0.7 }}>
            Version 2.0
          </p>
        </div>

        {/* Storage */}
        <div style={{
          padding: '12px', borderRadius: 8,
          background: 'var(--sidebar-hover)',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Download size={14} color="var(--sidebar-text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-text)' }}>Storage</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--sidebar-text-muted)', margin: 0 }}>
            {conversationCount} conversation{conversationCount !== 1 ? 's' : ''} saved locally
          </p>
        </div>

        {/* Clear all data */}
        <div style={{
          padding: '12px', borderRadius: 8,
          background: 'var(--sidebar-hover)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Trash size={14} color="#f87171" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>Danger Zone</span>
          </div>
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={{
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: '1px solid #ef444480',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: 500, color: '#f87171',
              fontFamily: 'var(--f-ui)', transition: 'background 0.15s',
            }}>
              Clear all conversations
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { onClearAll(); setConfirmClear(false); onClose(); }} style={{
                flex: 1, padding: '8px',
                background: '#ef4444', border: 'none', borderRadius: 6,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff',
                fontFamily: 'var(--f-ui)',
              }}>
                Confirm delete
              </button>
              <button onClick={() => setConfirmClear(false)} style={{
                flex: 1, padding: '8px',
                background: 'var(--sidebar-active)', border: 'none', borderRadius: 6,
                cursor: 'pointer', fontSize: 12, color: 'var(--sidebar-text)',
                fontFamily: 'var(--f-ui)',
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </OverlayPanel>
  );
}

/* ── History Panel ── */
function HistoryPanel({ onClose, conversations, onSelect, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OverlayPanel title="History" onClose={onClose}>
      {/* Search box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', marginBottom: 10,
        background: 'var(--sidebar-hover)', borderRadius: 8,
      }}>
        <Search size={14} color="var(--sidebar-text-muted)" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--sidebar-text)', fontSize: 13, fontFamily: 'var(--f-ui)',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--sidebar-text-muted)', padding: 0, display: 'flex',
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{
          color: 'var(--sidebar-text-muted)', fontSize: 12,
          textAlign: 'center', padding: '20px 0',
        }}>
          {search ? 'No matching conversations' : 'No conversations yet'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 10px', borderRadius: 8,
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MessageSquare size={14} strokeWidth={1.5} color="var(--sidebar-text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, color: 'var(--sidebar-text)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {conv.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sidebar-text-muted)', margin: '2px 0 0' }}>
                  {conv.messages?.length || 0} messages
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--sidebar-text-muted)', padding: 2,
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                  opacity: 0.5, borderRadius: 4,
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </OverlayPanel>
  );
}

/* ── Search Panel (filter conversations) ── */
function SearchPanel({ onClose, conversations, onSelect }) {
  const [query, setQuery] = useState('');
  const results = query.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <OverlayPanel title="Search" onClose={onClose}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', marginBottom: 10,
        background: 'var(--sidebar-hover)', borderRadius: 8,
      }}>
        <Search size={14} color="var(--sidebar-text-muted)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          autoFocus
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--sidebar-text)', fontSize: 13, fontFamily: 'var(--f-ui)',
          }}
        />
      </div>

      {!query.trim() ? (
        <p style={{ color: 'var(--sidebar-text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
          Type to search your conversations
        </p>
      ) : results.length === 0 ? (
        <p style={{ color: 'var(--sidebar-text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
          No results for "{query}"
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {results.map(conv => (
            <div
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px', borderRadius: 8, cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MessageSquare size={14} strokeWidth={1.5} color="var(--sidebar-text-muted)" />
              <span style={{
                fontSize: 13, color: 'var(--sidebar-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conv.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </OverlayPanel>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   Main Sidebar
   ═══════════════════════════════════════════════════════════════════ */
export default function ChatSidebar({
  conversations, activeId, onSelect, onNewChat, onDelete, onClearAll,
  collapsed, onToggle,
}) {
  const [hoverId, setHoverId] = useState(null);
  const [panel, setPanel] = useState(null); // 'search' | 'history' | 'settings' | null

  const width = collapsed ? 60 : 260;

  return (
    <div style={{
      width, minWidth: width,
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRight: '1px solid var(--sidebar-border)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Overlay panels */}
      {!collapsed && panel === 'search' && (
        <SearchPanel
          onClose={() => setPanel(null)}
          conversations={conversations}
          onSelect={onSelect}
        />
      )}
      {!collapsed && panel === 'history' && (
        <HistoryPanel
          onClose={() => setPanel(null)}
          conversations={conversations}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      )}
      {!collapsed && panel === 'settings' && (
        <SettingsPanel
          onClose={() => setPanel(null)}
          onClearAll={onClearAll}
          conversationCount={conversations.length}
        />
      )}

      {/* Toggle button */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 12px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--sidebar-text-muted)', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            : <PanelLeftClose size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
        </button>
      </div>

      {/* Navigation icons */}
      <div style={{
        padding: collapsed ? '4px 10px' : '4px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        flexShrink: 0,
      }}>
        <SidebarIcon Icon={SquarePen} label="New Chat" onClick={() => { setPanel(null); onNewChat(); }} collapsed={collapsed} />
        <SidebarIcon Icon={Search} label="Search" onClick={() => setPanel(p => p === 'search' ? null : 'search')} active={panel === 'search'} collapsed={collapsed} />
        <SidebarIcon Icon={Clock} label="History" onClick={() => setPanel(p => p === 'history' ? null : 'history')} active={panel === 'history'} collapsed={collapsed} />
        <SidebarIcon Icon={Settings} label="Settings" onClick={() => setPanel(p => p === 'settings' ? null : 'settings')} active={panel === 'settings'} collapsed={collapsed} />
      </div>

      {/* Divider */}
      <div style={{
        height: 1, background: 'var(--sidebar-border)',
        margin: collapsed ? '8px 10px' : '8px 12px',
        flexShrink: 0,
      }} />

      {/* Conversation list — only when expanded and no panel open */}
      {!collapsed && !panel && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {conversations.length === 0 ? (
            <p style={{
              color: 'var(--sidebar-text-muted)', fontSize: 12,
              textAlign: 'center', padding: '24px 12px', lineHeight: 1.6,
            }}>
              No conversations yet
            </p>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === activeId;
              const isHover = conv.id === hoverId;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  onMouseEnter={() => setHoverId(conv.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    padding: '9px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'var(--sidebar-active)' : isHover ? 'var(--sidebar-hover)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 2,
                    transition: 'background 0.12s',
                  }}
                >
                  <MessageSquare size={14} strokeWidth={1.5} color="var(--sidebar-text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: 13, color: 'var(--sidebar-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.title}
                  </span>
                  {(isHover || isActive) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--sidebar-text-muted)', padding: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, borderRadius: 4, opacity: 0.7,
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Spacer when collapsed or panel is open */}
      {(collapsed || panel) && <div style={{ flex: 1 }} />}

    </div>
  );
}
