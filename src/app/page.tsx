import { CameraPanel } from "@/src/ui/components/CameraPanel";
import { Controls } from "@/src/ui/components/Controls";
import { TranscriptPanel } from "@/src/ui/components/TranscriptPanel";

export default function Page() {
  return (
    <main style={{ padding: 16, display: "grid", gap: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>VitalSign</h1>
      <CameraPanel />
      <TranscriptPanel />
      <Controls />
    </main>
  );
}
