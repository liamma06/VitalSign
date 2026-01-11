"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import HandTracker from '../HandTracker';
import { TranscriptPanel } from '../ui/components/TranscriptPanel';
import { CameraPanel } from '../ui/components/CameraPanel';
import ShinyText from '../ui/components/ShinyText';

const VOICES = {
  male: "pNInz6obpg8n9Y48W37W",
  female: "kdmDKE6EkgrWrrykO9Qt"
};

export default function Home() {
  const [transcript, setTranscript] = useState<{ text: string; emotion: string; timestamp: number }[]>([]);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const pipelineInFlight = useRef(false);

  async function playAudioInBrowser(audioBuffer: ArrayBuffer): Promise<void> {
    if (isMuted) return;
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volume;

    return new Promise((resolve, reject) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = (error) => { URL.revokeObjectURL(url); reject(error); };
      audio.play().catch(reject);
    });
  }

  const handleSentenceComplete = (text: string, emotion?: string) => {
    void (async () => {
      const raw = (text ?? "").trim();
      if (!raw || pipelineInFlight.current) return;
      pipelineInFlight.current = true;
      const emotionLabel = (emotion ?? "Neutral").trim();
      setTranscript(prev => [...prev, { text: raw, emotion: emotionLabel, timestamp: Date.now() }]);

      try {
        const geminiResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `Rewrite this sign-language text into natural English: ${raw}` })
        });
        const geminiData = await geminiResponse.json();
        const refined = String(geminiData?.text ?? "").trim();

        if (refined) {
          setTranscript(prev => [...prev, { text: refined, emotion: emotionLabel || "AI", timestamp: Date.now() }]);
          const speakResponse = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: refined, emotion: emotionLabel, voiceId: VOICES[voiceGender] })
          });
          if (speakResponse.ok) {
            const audioBuffer = await speakResponse.arrayBuffer();
            await playAudioInBrowser(audioBuffer);
          }
        }
      } catch (e) { console.error("Pipeline error:", e); } finally { pipelineInFlight.current = false; }
    })();
  };

  return (
    <main style={{ 
      height: '100vh', 
      background: 'var(--vs-bg)', 
      color: 'var(--vs-text)', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'system-ui, sans-serif', 
      overflow: 'hidden' 
    }}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', padding: '24px', minHeight: 0 }}>
        <div style={{ background: 'var(--vs-surface)', borderRadius: '20px', border: '1px solid var(--vs-border)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <CameraPanel><HandTracker onSentenceComplete={handleSentenceComplete} compact={true} /></CameraPanel>
        </div>
        
        <div style={{ background: 'var(--vs-surface)', borderRadius: '20px', border: '1px solid var(--vs-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TranscriptPanel history={transcript} onClear={() => setTranscript([])} />
          </div>

          {/* AUDIO PREFERENCES AT THE BOTTOM */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--vs-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Added Section Title */}
            <p style={{ margin: '0', fontSize: '11px', fontWeight: '700', color: 'var(--vs-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Audio Preferences
            </p>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px' }}>
              <button onClick={() => setVoiceGender('female')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: '0.2s', background: voiceGender === 'female' ? 'var(--vs-accent)' : 'transparent', color: voiceGender === 'female' ? '#000' : '#fff' }}>Female</button>
              <button onClick={() => setVoiceGender('male')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: '0.2s', background: voiceGender === 'male' ? 'var(--vs-accent)' : 'transparent', color: voiceGender === 'male' ? '#000' : '#fff' }}>Male</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <span style={{ fontSize: '10px', color: 'var(--vs-muted)', fontWeight: '600' }}>VOL</span>
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.01" 
                   value={volume} 
                   onChange={(e) => setVolume(parseFloat(e.target.value))} 
                   style={{ 
                    width: '85%', // Slightly shorter slider
                    accentColor: 'var(--vs-accent)', 
                    cursor: 'pointer' 
                   }} 
                 />
               </div>
               
               {/* Mute Button moved to the right side of the slider */}
               <button 
                 onClick={() => setIsMuted(!isMuted)} 
                 style={{ 
                   background: isMuted ? '#ff4b4b' : 'rgba(255,255,255,0.1)', 
                   border: 'none', 
                   color: '#fff', 
                   padding: '8px 12px', 
                   borderRadius: '8px', 
                   cursor: 'pointer', 
                   fontSize: '11px', 
                   fontWeight: '700',
                   whiteSpace: 'nowrap'
                 }}
               >
                 {isMuted ? 'UNMUTE' : 'MUTE'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}