import type { Metadata } from "next";
import Navbar from "../ui/components/Navbar"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalSign",
  description: "AI-Powered Sign Language Translator",
  icons: {
    icon: '/VitalSignIcon.png', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {}
      <body suppressHydrationWarning>
        <Navbar /> {}
        {children}
      </body>
    </html>
  );
}