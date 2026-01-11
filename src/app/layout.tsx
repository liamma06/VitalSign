import "./globals.css";
// Add this line below:
import Navbar from "@/src/ui/components/Navbar"; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ background: 'var(--vs-bg)', color: 'var(--vs-text)' }}>
        <Navbar /> 
        {children}
      </body>
    </html>
  );
}