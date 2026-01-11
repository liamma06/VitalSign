"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShinyText from './ShinyText';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Tutorial', href: '/tutorial' },
    { name: 'Connect', href: '/connect' },
    { name: 'Academy', href: '/academy' },
  ];

  return (
    <header style={{
      padding: '16px 32px',
      borderBottom: '1px solid var(--vs-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--vs-surface)',
      backdropFilter: 'blur(10px)',
      height: '70px', 
      flexShrink: 0
    }}>
      {/* Branding Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/VitalSignIcon.png"
          alt="Logo"
          style={{ width: '45px', height: '45px', borderRadius: '10px' }}
        />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          <ShinyText text="VitalSign" speed={3} />
        </h1>
      </div>

      {/* Navigation Links Section */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: isActive ? 'var(--vs-accent)' : 'var(--vs-muted)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                padding: '6px 14px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--vs-accent)' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(47, 154, 143, 0.1)' : 'transparent',
                transition: '0.2s ease'
              }}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}