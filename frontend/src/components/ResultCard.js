import { useState } from 'react';
import { Copy, Check, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, ChevronDown, ChevronUp, ExternalLink, Database } from 'lucide-react';
import { sig, recColor, Bar, Chip } from './ds';

function Metric({ label, value, color }) {
  if (!value || value === 'N/A') return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--rule)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600, color: color || 'var(--ink)',
        fontFamily: 'var(--f-data)',
      }}>
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--f-data)' }}>{value}</span>
      </div>
      <Bar value={value} color={color} h={4} />
    </div>
  );
}

export default function ResultCard({ r }) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const sc = sig.color(r.signal);
  const SIcon = r.signal === 'BULLISH' ? TrendingUp : r.signal === 'BEARISH' ? TrendingDown : Minus;
  const signalTone = r.signal === 'BULLISH' ? 'bull' : r.signal === 'BEARISH' ? 'bear' : 'flat';
  const recTone = ['BUY', 'ACCUMULATE'].includes(r.recommendation) ? 'bull' : r.recommendation === 'SELL' ? 'bear' : 'flat';

  const copy = () => {
    navigator.clipboard.writeText(r.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: '100%' }}>

      {/* Analyst response — natural flowing text */}
      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.75 }}>
        {r.response}
      </div>

      {/* Quick action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={copy}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', fontSize: 12, fontWeight: 500,
            background: copied ? 'var(--bull-bg)' : 'var(--white)',
            border: `1px solid ${copied ? 'var(--bull-rule)' : 'var(--rule)'}`,
            borderRadius: 20, cursor: 'pointer',
            color: copied ? 'var(--bull)' : 'var(--ink-3)',
            fontFamily: 'var(--f-ui)', transition: 'all 0.15s',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Stock summary card */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}>

        {/* Header — ticker + price + signal */}
        <div style={{
          padding: '16px 20px',
          background: sig.bg(r.signal),
          borderBottom: `1px solid ${sig.rule(r.signal)}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--f-data)', fontSize: 22, fontWeight: 700,
                  color: 'var(--ink)', letterSpacing: '-0.01em',
                }}>
                  {r.ticker}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{r.exchange}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>{r.companyName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontFamily: 'var(--f-data)', fontSize: 22, fontWeight: 700,
                color: 'var(--ink)', margin: 0,
              }}>
                {r.price}
              </p>
              <p style={{
                fontSize: 13, fontWeight: 600,
                color: r.changePositive ? 'var(--bull)' : 'var(--bear)',
                margin: '2px 0 0', display: 'flex', alignItems: 'center',
                gap: 3, justifyContent: 'flex-end',
              }}>
                <SIcon size={13} strokeWidth={2.5} />
                {r.change}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <Chip tone={signalTone}>{r.signal}</Chip>
            <Chip tone={recTone}>{r.recommendation}</Chip>
            <Chip tone='neutral'>{r.confidence}% confidence</Chip>
          </div>
        </div>

        {/* Key levels */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid var(--rule)',
        }}>
          {[
            { k: 'Target', v: r.targetPrice, c: 'var(--accent)' },
            { k: 'Support', v: r.support || '--', c: 'var(--bull)' },
            { k: 'Resistance', v: r.resistance || '--', c: 'var(--bear)' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{item.k}</p>
              <p style={{ fontFamily: 'var(--f-data)', fontSize: 15, fontWeight: 600, color: item.c, margin: 0 }}>{item.v}</p>
            </div>
          ))}
        </div>

        {/* Risk & Catalyst */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ padding: '12px 16px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <AlertTriangle size={12} color='var(--bear)' strokeWidth={2.5} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>{r.keyRisk}</p>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Zap size={12} color='var(--bull)' strokeWidth={2.5} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catalyst</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>{r.catalyst}</p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(p => !p)}
          style={{
            width: '100%', padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, color: 'var(--ink-3)',
            fontFamily: 'var(--f-ui)', borderBottom: showDetails ? '1px solid var(--rule)' : 'none',
          }}
        >
          <span>{showDetails ? 'Hide details' : 'View fundamentals & indicators'}</span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div style={{ animation: 'up 0.2s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Fundamentals */}
              <div style={{ padding: '14px 18px', borderRight: '1px solid var(--rule)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Fundamentals</p>
                <Metric label='Price' value={r.price} color={r.changePositive ? 'var(--bull)' : 'var(--bear)'} />
                <Metric label='P/E Ratio' value={r.peRatio} />
                <Metric label='Market Cap' value={r.marketCap} />
                <Metric label='52W High' value={r.weekHigh52} color='var(--bull)' />
                <Metric label='52W Low' value={r.weekLow52} color='var(--bear)' />
                <Metric label='EPS (TTM)' value={r.eps} />
                <Metric label='Div. Yield' value={r.dividendYield} />
                <Metric label='Beta' value={r.beta} />
                <Metric label="Volume" value={r.volume} />
              </div>

              {/* Indicators */}
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Indicators</p>
                <ScoreBar label='Momentum' value={r.momentumScore} color='var(--bull)' />
                <ScoreBar label='Sentiment' value={r.sentimentScore} color='var(--info)' />
                <ScoreBar label='Volume' value={r.volumeScore} color='#7c3aed' />
                <ScoreBar label='Institutional' value={r.institutionalScore} color='var(--flat)' />
                {r.technicalScore && <ScoreBar label='Technical' value={r.technicalScore} color='var(--info)' />}
                {r.fundamentalScore && <ScoreBar label='Fundamental' value={r.fundamentalScore} color='var(--bull)' />}
              </div>
            </div>
          </div>
        )}

        {/* Data source footer */}
        <div style={{
          padding: '10px 20px',
          background: 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid var(--rule)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-4)' }}>
            <Database size={12} strokeWidth={2} />
            <span>
              Source: <strong style={{ color: 'var(--ink-3)' }}>
                {r.dataSource?.includes('Yahoo') ? 'Yahoo Finance' : r.dataSource || 'Yahoo Finance'}
              </strong>
              {r.dataSource?.includes('live') && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px', borderRadius: 10,
                  background: 'var(--bull-bg)', color: 'var(--bull)',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  border: '1px solid var(--bull-rule)',
                }}>
                  Live
                </span>
              )}
            </span>
          </div>
          {r.lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--ink-5)', fontFamily: 'var(--f-data)' }}>
              {r.lastUpdated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
