"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShinyText from './ShinyText';

export default function Navbar() {
    const pathname = usePathname();
  
    return (
      <header style={{ 
        padding: '16px 16px', 
        borderBottom: '1px solid var(--vs-border)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--vs-surface)',
        backdropFilter: 'blur(10px)',
        height: '70px',
        flexShrink: 0
      }}>
        {/* SPECIFY NEGATIVE MARGIN HERE */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0px',
          marginLeft: '-15px' // <--- Adjust this value (e.g., -10px, -20px) to balance the offset
        }}>
          <img 
            src="/VitalSignIcon2.png" 
            alt="VitalSign Logo"
            style={{ 
              width: '75px',    
              height: '75px',   
              borderRadius: '0px', 
              objectFit: 'cover',
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 127, 0.8)) brightness(1.2)'
            }} 
          />
        </div>
  
        {/* ... rest of the navbar code ... */}
      </header>
    );
}