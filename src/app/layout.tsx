import Navbar from '../ui/components/Navbar'; // <--- ADD THIS LINE
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0,
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--vs-bg)',
        fontFamily: 'system-ui, sans-serif', // Restores your font
        overflow: 'hidden' 
      }}>
        <Navbar /> {/* Now it is defined! */}
        {children}
      </body>
    </html>
  );
}