"use client";

import HandTracker from '../../HandTracker';

export default function BroadcastPage() {
  return (
    <main style={{ 
      margin: 0, 
      padding: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'black', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <HandTracker 
        onSentenceComplete={() => {}} 
        compact={false} 
        broadcast={true} // This triggers the subtitle overlay mode
      />
    </main>
  );
}