import { useEffect, useRef } from "react";

interface TranscriptItem {
  text: string;
  emotion: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  history: TranscriptItem[];
  onClear: () => void;
}

export function TranscriptPanel({ history, onClear }: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      
      {/* HEADER */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--vs-border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Transcript</h2>
        <button 
          onClick={onClear}
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--vs-border-strong)', 
            color: 'var(--vs-muted)', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear
        </button>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--vs-muted-2)', marginTop: '40px' }}>
            <p>No speech detected yet.</p>
            <p style={{ fontSize: '12px' }}>Sign to the camera to begin translation.</p>
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} style={{ 
              background: 'var(--vs-surface-2)', 
              padding: '15px', 
              borderRadius: '12px', 
              borderLeft: '4px solid var(--vs-accent-blue)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  color: 'var(--vs-muted-2)', 
                  fontWeight: 'bold' 
                }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  background: 'var(--vs-surface)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  color: item.emotion === 'Happy' ? 'var(--vs-accent)' : item.emotion === 'Sad' ? 'var(--vs-accent-blue)' : 'var(--vs-muted)' 
                }}>
                  {item.emotion || "Neutral"}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.5', fontSize: '15px' }}>
                {item.text}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}