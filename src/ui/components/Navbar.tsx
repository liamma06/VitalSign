"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShinyText from './ShinyText';

export default function Navbar() {
  const pathname = usePathname();

  // 1. RESTORE THE MISSING LINKS ARRAY
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tutorial', href: '/tutorial' },
    { name: 'Connect', href: '/connect' },
    { name: 'Academy', href: '/academy' },
  ];

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
      {/* 2. ICON SECTION WITH YOUR NEGATIVE MARGIN */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0px',
        marginLeft: '-15px' 
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

      {/* 3. RESTORE THE MISSING NAVIGATION OPTIONS */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className="nav-item"
              style={{ 
                color: isActive ? 'var(--vs-accent)' : 'var(--vs-muted)', 
                textDecoration: 'none', 
                fontSize: '13px', 
                fontWeight: '600',
                padding: '6px 14px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--vs-accent)' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(0, 255, 127, 0.05)' : 'transparent',
                transition: '0.3s ease'
              }}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* 4. RESTORE HOVER ANIMATION */}
      <style jsx>{`
        .nav-item:hover {
          color: var(--vs-accent) !important;
          background-color: rgba(0, 255, 127, 0.1) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </header>
  );
}