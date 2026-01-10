import type { ToneTag } from "@/src/contracts/types";

export type EmotionState = {
  tone: ToneTag;
  confidence: number; // 0-1
  debug?: Record<string, number>;
};
