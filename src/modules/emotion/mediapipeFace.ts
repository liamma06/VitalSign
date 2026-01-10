import type { EmotionState } from "./types";
import { toneFromBlendshapes } from "./toneMapping";

type FaceLandmarkerLike = {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => {
    faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
  };
  close?: () => void;
};

export type FaceEmotionDetector = {
  detect: (video: HTMLVideoElement, timestampMs: number) => EmotionState | null;
  close: () => void;
};

const DEFAULT_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";

const DEFAULT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

export async function createFaceEmotionDetector(options?: {
  wasmBaseUrl?: string;
  modelUrl?: string;
}): Promise<FaceEmotionDetector> {
  const wasmBaseUrl = options?.wasmBaseUrl ?? DEFAULT_WASM_BASE;
  const modelUrl = options?.modelUrl ?? DEFAULT_MODEL_URL;

  const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");

  const vision = await FilesetResolver.forVisionTasks(wasmBaseUrl);
  const landmarker = (await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: modelUrl,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true
  })) as FaceLandmarkerLike;

  return {
    detect(video, timestampMs) {
      const result = landmarker.detectForVideo(video, timestampMs);
      const blend = result.faceBlendshapes?.[0]?.categories;
      if (!blend || blend.length === 0) return null;
      return toneFromBlendshapes(blend);
    },
    close() {
      landmarker.close?.();
    }
  };
}
