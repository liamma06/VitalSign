"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EmotionState } from "@/src/modules/emotion";
import { createFaceEmotionDetector } from "@/src/modules/emotion";

export function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<EmotionState | null>(null);

  const supportsCamera = useMemo(() => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);

    if (!supportsCamera) {
      setError("Camera API not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = await createFaceEmotionDetector();
      setRunning(true);

      const loop = () => {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const next = detector.detect(video, performance.now());
          if (next) setEmotion(next);
        }
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);

      return () => detector.close();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to start camera.";
      setError(message);
      setRunning(false);
    }
  }

  function stop() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
  }

  return (
    <section>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {!running ? (
          <button onClick={start}>Start Camera</button>
        ) : (
          <button onClick={stop}>Stop</button>
        )}
        <div>
          <div>
            <strong>Emotion:</strong> {emotion?.tone ?? "(none)"}
          </div>
          <div>
            <strong>Confidence:</strong> {emotion ? emotion.confidence.toFixed(2) : "-"}
          </div>
        </div>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <video
        ref={videoRef}
        style={{ width: "100%", maxWidth: 720, marginTop: 12, background: "#111" }}
        playsInline
        muted
      />

      <details style={{ marginTop: 12 }}>
        <summary>Debug</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 8 }}>
          {emotion?.debug
            ? Object.entries(emotion.debug)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => `${k}: ${v.toFixed(3)}`)
                .join("\n")
            : "(no debug yet)"}
        </pre>
      </details>
    </section>
  );
}
