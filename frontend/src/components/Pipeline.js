const STEPS = [
  'Understanding your query',
  'Identifying the stock',
  'Fetching live market data',
  'Analyzing indicators',
  'Preparing response',
];

export default function Pipeline({ stage }) {
  const label = STEPS[Math.min(stage, STEPS.length - 1)] || STEPS[0];

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '4px 0',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Thinking dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--ink-4)',
                animation: `bounce-dots 1.4s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
        {/* Current step label */}
        <p style={{
          fontSize: 13, color: 'var(--ink-3)', margin: 0,
          animation: 'in 0.3s ease',
        }}>
          {label}...
        </p>
      </div>
    </div>
  );
}
