import { TrendingUp, ArrowRight, BarChart3, Mic, Paperclip } from 'lucide-react';

const SAMPLES = [
  { text: 'Client has \u20B95 lakh to invest in Reliance Industries, 3-year horizon', icon: TrendingUp },
  { text: 'Should my client buy TCS at current levels?', icon: BarChart3 },
  { text: 'Client holding HDFC Bank at a loss \u2014 hold or exit?', icon: TrendingUp },
  { text: 'Is this a good time to enter a Nifty 50 index fund?', icon: BarChart3 },
];

export default function WelcomeScreen({ onSampleClick }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 400,
      padding: '40px 20px', animation: 'in 0.5s ease',
    }}>
      {/* Logo with gradient glow */}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, #0d9488, #2563eb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 8px 32px rgba(13, 148, 136, 0.2)',
      }}>
        <TrendingUp size={28} color="#fff" strokeWidth={2} />
      </div>

      <h1 style={{
        fontSize: 26, fontWeight: 600, color: 'var(--ink)',
        marginBottom: 8, fontFamily: 'var(--f-ui)',
        letterSpacing: '-0.02em',
      }}>
        Stock AI
      </h1>
      <p style={{
        fontSize: 15, color: 'var(--ink-3)', marginBottom: 40,
        textAlign: 'center', maxWidth: 440, lineHeight: 1.7,
      }}>
        Get instant equity analysis with live market data.
        Type a query, record a conversation, or upload audio.
      </p>

      {/* Capability pills */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { icon: TrendingUp, label: 'Live market data' },
          { icon: Mic, label: 'Voice input' },
          { icon: Paperclip, label: 'Audio upload' },
          { icon: BarChart3, label: 'AI analysis' },
        ].map(({ icon: Icon, label }, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'var(--white)', border: '1px solid var(--rule)',
            fontSize: 12, color: 'var(--ink-3)', fontWeight: 500,
          }}>
            <Icon size={13} strokeWidth={2} color="var(--accent)" />
            {label}
          </span>
        ))}
      </div>

      {/* Sample prompts */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, maxWidth: 640, width: '100%',
      }}>
        {SAMPLES.map(({ text, icon: Icon }, i) => (
          <button
            key={i}
            onClick={() => onSampleClick(text)}
            style={{
              padding: '14px 16px',
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              borderRadius: 14, cursor: 'pointer',
              textAlign: 'left', fontSize: 13, color: 'var(--ink-2)',
              lineHeight: 1.5, fontFamily: 'var(--f-ui)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,148,136,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--rule)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
            }}
          >
            <Icon size={16} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1 }}>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
