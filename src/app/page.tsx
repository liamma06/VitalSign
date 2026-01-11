"use client";

import Link from 'next/link';
import ShinyText from '@/src/ui/components/ShinyText';

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
    <>
      <style>{`
        .gesture-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
        }

        .gesture-card:hover {
          transform: scale(1.05) translateY(-5px);
          border-color: #00FF7F;
          box-shadow: 0 10px 30px -10px rgba(0, 255, 127, 0.4);
          z-index: 10;
          background: #0f172a;
        }

        main::-webkit-scrollbar { width: 10px; }
        main::-webkit-scrollbar-track { background: #0f172a; }
        main::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; }
        main::-webkit-scrollbar-thumb:hover { background: #00FF7F; }

        /* Button Hover Animation */
        .start-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: inline-block; /* Essential for transform to work on Link */
        }
        .start-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(0, 255, 127, 0.6);
        }
      `}</style>

      <main style={{
        height: '100vh',
        overflowY: 'auto',
        background: '#0f172a',
        color: 'white',
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative'
      }}>
        
        {/* Header Section */}
        <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="/VitalSignIcon.png" 
              alt="VitalSign Logo" 
              style={{ 
                width: '170px', 
                height: '170px', 
                borderRadius: '20px', 
                border: '3px solid #00FF7F',
                boxShadow: '0 0 20px rgba(0,255,127,0.2)',
                objectFit: 'cover'
              }} 
            />
          </div>

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
          margin: '0 auto',
          paddingBottom: '120px' 
        }}>
          {gestures.map((g) => (
            <div key={g.name} className="gesture-card">
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

        {/* Fixed Floating Footer */}
        <div style={{ 
          position: 'fixed', 
          bottom: '30px',
          left: '0',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none', 
          zIndex: 100
        }}>
          {/* DIRECT LINK METHOD 
             This href="/" points to src/app/page.tsx
          */}
          <Link 
            href="/" 
            className="start-btn"
            style={{
              pointerEvents: 'auto',
              textDecoration: 'none',
              background: '#00FF7F',
              color: '#000',
              padding: '14px 40px',
              borderRadius: '50px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 4px 20px rgba(0, 255, 127, 0.4)',
              cursor: 'pointer',
            }}
          >
            Start Translating →
          </Link>
        </div>
      </main>
    </>
  );
}