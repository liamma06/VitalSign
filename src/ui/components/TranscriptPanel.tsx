import { useEffect, useRef } from "react";

interface TranscriptItem {
  text: string;
  emotion: string;
  timestamp: number;
}

interface TranscriptPanelProps {
  history: TranscriptItem[];
  onClear: () => void;
  voice: "female" | "male";
  onVoiceChange: (voice: "female" | "male") => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function TranscriptPanel({ history, onClear, voice, onVoiceChange, volume, onVolumeChange }: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <>
      <style>{`
        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 120px;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, var(--vs-accent) 0%, var(--vs-accent) ${volume}%, var(--vs-border) ${volume}%, var(--vs-border) 100%);
          outline: none;
          cursor: pointer;
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--vs-accent);
          cursor: pointer;
          border: 2px solid var(--vs-bg);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--vs-accent);
          cursor: pointer;
          border: 2px solid var(--vs-bg);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      
      {/* HEADER */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid var(--vs-border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', letterSpacing: '-0.5px' }}>Transcript</h2>
        <button 
          onClick={onClear}
          style={{ 
            background: 'rgba(var(--vs-red-rgb), 0.1)', 
            border: '1px solid rgba(var(--vs-red-rgb), 0.3)', 
            color: 'var(--vs-red)', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Clear
        </button>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--vs-muted-2)', marginTop: '60px' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>No speech detected yet.</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>Sign to the camera to begin translation.</p>
          </div>
        ) : (
          history.map((item, i) => (
            <div key={i} style={{ 
              background: 'var(--vs-surface-2)', 
              padding: '16px 18px', 
              borderRadius: '14px', 
              borderLeft: '3px solid var(--vs-red)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '10px', 
                  textTransform: 'uppercase', 
                  color: 'var(--vs-muted-2)', 
                  fontWeight: '600',
                  letterSpacing: '0.5px' 
                }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  background: item.emotion === 'Happy' ? 'rgba(var(--vs-accent-rgb), 0.15)' : item.emotion === 'Sad' ? 'rgba(var(--vs-accent-blue-rgb), 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                  padding: '4px 10px', 
                  borderRadius: '12px',
                  border: `1px solid ${item.emotion === 'Happy' ? 'rgba(var(--vs-accent-rgb), 0.3)' : item.emotion === 'Sad' ? 'rgba(var(--vs-accent-blue-rgb), 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: item.emotion === 'Happy' ? 'var(--vs-accent)' : item.emotion === 'Sad' ? 'var(--vs-accent-blue)' : 'var(--vs-muted)',
                  fontWeight: '600' 
                }}>
                  {item.emotion || "Neutral"}
                </span>
              </div>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px', color: 'rgba(248, 250, 252, 0.95)' }}>
                {item.text}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* FOOTER WITH CONTROLS */}
      <div style={{
        padding: '20px 28px',
        borderTop: '1px solid var(--vs-border)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Voice Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--vs-muted)', fontWeight: '600' }}>Voice:</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onVoiceChange('female')}
              style={{
                background: voice === 'female' ? 'var(--vs-accent)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${voice === 'female' ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                color: voice === 'female' ? '#000' : 'var(--vs-text)',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Female
            </button>
            <button
              onClick={() => onVoiceChange('male')}
              style={{
                background: voice === 'male' ? 'var(--vs-accent)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${voice === 'male' ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                color: voice === 'male' ? '#000' : 'var(--vs-text)',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Male
            </button>
          </div>
        </div>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
          <span style={{ fontSize: '18px', cursor: 'pointer' }} onClick={() => onVolumeChange(volume === 0 ? 100 : 0)}>
            {volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="volume-slider"
          />
          <span style={{ fontSize: '14px', color: 'var(--vs-muted)', fontWeight: '600', minWidth: '35px', textAlign: 'right' }}>
            {volume}%
          </span>
        </div>
      </div>
    </div>
    </>
  );
}