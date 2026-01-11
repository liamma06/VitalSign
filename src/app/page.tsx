"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import HandTracker from '../HandTracker';
import { TranscriptPanel } from '../ui/components/TranscriptPanel';
import { CameraPanel } from '../ui/components/CameraPanel';
import ShinyText from '../ui/components/ShinyText'; // <--- Added Import

async function playAudioInBrowser(audioBuffer: ArrayBuffer): Promise<void> {
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = (error) => { URL.revokeObjectURL(url); reject(error); };
    audio.play().catch(reject);
  });
}

export default function Home() {
  const [transcript, setTranscript] = useState<{ text: string; emotion: string; timestamp: number }[]>([]);
  const pipelineInFlight = useRef(false);

  const handleSentenceComplete = (text: string, emotion?: string) => {
    void (async () => {
      const raw = (text ?? "").trim();
      if (!raw) return;
      if (pipelineInFlight.current) return;
      pipelineInFlight.current = true;

      const emotionLabel = (emotion ?? "Neutral").trim();
      setTranscript(prev => [...prev, { text: raw, emotion: emotionLabel, timestamp: Date.now() }]);

      try {
        const basePrompt = 'You are a helpful assistant. Rewrite this sign-language text into natural English. Keep it brief.';
        const fullPrompt = `${basePrompt}\n\nRaw Text: ${JSON.stringify(raw)}\nEmotion: ${emotionLabel}`;
        
        const geminiResponse = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt })
        });

        if (!geminiResponse.ok) throw new Error("Gemini API Error");
        const geminiData = await geminiResponse.json();
        const refined = String(geminiData?.text ?? "").trim();

        if (refined) {
          setTranscript(prev => [...prev, { text: refined, emotion: emotionLabel || "AI", timestamp: Date.now() }]);
          
          const speakResponse = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: refined, emotion: emotionLabel })
          });

          if (speakResponse.ok) {
            const audioBuffer = await speakResponse.arrayBuffer();
            await playAudioInBrowser(audioBuffer);
          }
        }
      } catch (e) {
        console.error("Pipeline error:", e);
      } finally {
        pipelineInFlight.current = false;
      }
    })();
  };

  const clearTranscript = () => setTranscript([]);

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
      {/* HEADER */}
      <header style={{ 
        padding: '16px 32px', 
        borderBottom: '1px solid var(--vs-border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--vs-surface)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <img 
            src="/VitalSignIcon.png" 
            alt="VitalSign Logo" 
            style={{ 
              width: '45px',    
              height: '45px',   
              borderRadius: '10px', 
              objectFit: 'cover',
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 127, 0.8)) brightness(1.2)'
            }} 
          />
          
          {/* --- REPLACED STATIC TEXT WITH SHINYTEXT --- */}
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', letterSpacing: '-0.75px' }}>
            <ShinyText text="VitalSign" speed={3} />
          </h1>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/tutorial" style={{ 
            color: 'var(--vs-muted)', 
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Tutorial
          </Link>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--vs-accent)', 
            border: '1px solid var(--vs-accent)', 
            padding: '4px 10px', 
            borderRadius: '4px', 
            fontWeight: '500',
            backgroundColor: 'rgba(0, 255, 127, 0.05)' 
          }}>
            System Operational
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', padding: '24px', minHeight: 0 }}>
        <div style={{ background: 'var(--vs-surface)', borderRadius: '20px', border: '1px solid var(--vs-border)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <CameraPanel>
            <HandTracker onSentenceComplete={handleSentenceComplete} compact={true} />
          </CameraPanel>
        </div>
        <div style={{ background: 'var(--vs-surface)', borderRadius: '20px', border: '1px solid var(--vs-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <TranscriptPanel history={transcript} onClear={clearTranscript} />
        </div>
      </div>
    </main>
  );
}