import { useState, useEffect } from 'react';
import { User, TrendingUp } from 'lucide-react';

/* ─── Avatar ────────────────────────────────────── */
export function Avatar({ role = 'user', size = 28 }) {
  const isUser = role === 'user';
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: isUser ? 'var(--ink)' : 'linear-gradient(135deg, #0d9488, #2563eb)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {isUser
        ? <User size={size * 0.5} color="#fff" strokeWidth={2} />
        : <TrendingUp size={size * 0.5} color="#fff" strokeWidth={2.5} />}
    </div>
  );
}

/* ─── Icon Button (circular) ────────────────────── */
export function IconBtn({ Icon, onClick, disabled, active, size = 32, title }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--ink)' : hover ? 'var(--rule)' : 'transparent',
        color: active ? '#fff' : 'var(--ink-3)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s', flexShrink: 0, outline: 'none',
      }}
    >
      {Icon && <Icon size={size * 0.5} strokeWidth={2} />}
    </button>
  );
}

/* ─── Signal helpers ─────────────────────────────── */
export const sig = {
  color:  s => s === 'BULLISH' ? 'var(--bull)'      : s === 'BEARISH' ? 'var(--bear)'      : 'var(--flat)',
  bg:     s => s === 'BULLISH' ? 'var(--bull-bg)'   : s === 'BEARISH' ? 'var(--bear-bg)'   : 'var(--flat-bg)',
  rule:   s => s === 'BULLISH' ? 'var(--bull-rule)' : s === 'BEARISH' ? 'var(--bear-rule)' : 'var(--flat-rule)',
};
export const recColor = r =>
  ['BUY','ACCUMULATE'].includes(r) ? 'var(--bull)' : r === 'SELL' ? 'var(--bear)' : 'var(--flat)';


/* ─── Animated bar ───────────────────────────────── */
export function Bar({ value = 0, color = 'var(--accent)', h = 3 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 100);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: h, background: 'var(--rule)', borderRadius: h, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${w}%`, background: color,
        borderRadius: h, transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
      }} />
    </div>
  );
}


/* ─── Inline status dot ──────────────────────────── */
export function Dot({ on, color }) {
  const c = color || (on ? 'var(--bull)' : 'var(--ink-5)');
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6,
      borderRadius: '50%', background: c,
      boxShadow: on ? `0 0 0 3px ${c}28` : 'none',
      flexShrink: 0,
    }} />
  );
}


/* ─── Chip / inline tag ──────────────────────────── */
export function Chip({ children, tone = 'neutral' }) {
  const tones = {
    bull:    { c: 'var(--bull)',    bg: 'var(--bull-bg)',   b: 'var(--bull-rule)' },
    bear:    { c: 'var(--bear)',    bg: 'var(--bear-bg)',   b: 'var(--bear-rule)' },
    flat:    { c: 'var(--flat)',    bg: 'var(--flat-bg)',   b: 'var(--flat-rule)' },
    accent:  { c: 'var(--accent)', bg: 'var(--accent-bg)', b: 'var(--accent-2)'  },
    info:    { c: 'var(--info)',    bg: 'var(--info-bg)',   b: 'var(--info-rule)' },
    neutral: { c: 'var(--ink-3)',  bg: 'var(--paper)',     b: 'var(--rule)'      },
  };
  const { c, bg, b } = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: 4,
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: c, background: bg, border: `1px solid ${b}`,
    }}>
      {children}
    </span>
  );
}


/* ─── Button ─────────────────────────────────────── */
export function Btn({ children, onClick, disabled, look = 'fill', size = 'md', Icon, full }) {
  const [hover, setHover] = useState(false);

  const sizes = {
    xs: { p: '4px 9px',   fs: 11, gap: 5 },
    sm: { p: '6px 12px',  fs: 12, gap: 5 },
    md: { p: '8px 15px',  fs: 13, gap: 6 },
    lg: { p: '10px 20px', fs: 13, gap: 7 },
  };
  const sz = sizes[size] || sizes.md;

  const looks = {
    fill:    { bg: hover ? '#B03B25' : 'var(--accent)',  c: '#fff',           b: 'transparent'     },
    outline: { bg: hover ? 'var(--rule)' : 'var(--white)', c: 'var(--ink-2)', b: 'var(--rule-2)'   },
    ghost:   { bg: hover ? 'var(--rule)' : 'transparent',  c: 'var(--ink-3)', b: 'transparent'     },
    dark:    { bg: hover ? '#2a2520' : 'var(--ink)',     c: '#fff',           b: 'transparent'     },
    danger:  { bg: hover ? '#AA1E16' : 'var(--bear)',    c: '#fff',           b: 'transparent'     },
    success: { bg: hover ? '#196038' : 'var(--bull)',    c: '#fff',           b: 'transparent'     },
  };
  const lk = looks[look] || looks.fill;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sz.gap,
        padding: sz.p, fontSize: sz.fs, fontWeight: 500,
        fontFamily: 'var(--f-ui)', letterSpacing: '0.01em',
        background: lk.bg, color: lk.c, border: `1px solid ${lk.b}`,
        borderRadius: 'var(--r)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap', width: full ? '100%' : 'auto', outline: 'none',
      }}
    >
      {Icon && <Icon size={sz.fs + 1} strokeWidth={2} />}
      {children}
    </button>
  );
}


/* ─── Spinner ────────────────────────────────────── */
export function Spinner({ size = 14, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}30`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}


/* ─── Callout banner ─────────────────────────────── */
export function Callout({ type = 'info', children, onClose }) {
  const t = {
    info:    { c: 'var(--info)',  bg: 'var(--info-bg)',  b: 'var(--info-rule)',  stripe: 'var(--info)'  },
    error:   { c: 'var(--bear)', bg: 'var(--bear-bg)',  b: 'var(--bear-rule)', stripe: 'var(--bear)'  },
    success: { c: 'var(--bull)', bg: 'var(--bull-bg)',  b: 'var(--bull-rule)', stripe: 'var(--bull)'  },
    warn:    { c: 'var(--flat)', bg: 'var(--flat-bg)',  b: 'var(--flat-rule)', stripe: 'var(--flat)'  },
  }[type] || {};
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '11px 14px',
      background: t.bg, border: `1px solid ${t.b}`,
      borderLeft: `3px solid ${t.stripe}`,
      borderRadius: 'var(--r)',
      fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6,
      animation: 'up 0.2s ease',
    }}>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0 }}>
          ×
        </button>
      )}
    </div>
  );
}
