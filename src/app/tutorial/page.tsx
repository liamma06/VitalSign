"use client";

import Link from 'next/link';
import ShinyText from '@/src/ui/components/ShinyText';

// Define the gestures supported by your HandTracker.jsx
const gestures = [
  { name: "HELLO", icon: "👋", desc: "Wave your hand side-to-side (at least 2 swipes)." },
  { name: "THANK YOU", icon: "🙏", desc: "Hold palm open, then move hand down vertically." },
  { name: "GOODBYE", icon: "🫡", desc: "Salute! Flat hand, fingers together, near your head." },
  { name: "HELP", icon: "🆘", desc: "Palm open with your Thumb tucked in." },
  { name: "YES", icon: "👍", desc: "Thumbs Up." },
  { name: "NO", icon: "👎", desc: "Thumbs Down." },
  { name: "LOVE", icon: "🤟", desc: "Index + Pinky + Thumb extended (ILY sign)." },
  { name: "CALL", icon: "🤙", desc: "Thumb + Pinky extended, held sideways." },
  { name: "ME", icon: "👈", desc: "Point at yourself with your thumb." },
  { name: "YOU", icon: "🫵", desc: "Point at the screen with your index finger." },
  { name: "I", icon: "ℹ️", desc: "Pinky finger extended up." },
];

export default function TutorialPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>
          <ShinyText text="Gesture Library" speed={3} />
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>
          Master the signals to communicate with VitalSign AI.
        </p>
      </div>

      {/* Grid of Gestures */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {gestures.map((g) => (
          <div key={g.name} style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '25px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>{g.icon}</div>
            <h3 style={{ 
              color: '#00FF7F', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {g.name}
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: '1.5' }}>
              {g.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div style={{ textAlign: 'center', marginTop: '60px' }}>
        <Link href="/" style={{
          background: '#00FF7F',
          color: '#000',
          padding: '12px 30px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 0 20px rgba(0, 255, 127, 0.4)'
        }}>
          Start Translating →
        </Link>
      </div>
    </main>
  );
}