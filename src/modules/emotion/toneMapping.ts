import type { EmotionState } from "./types";

type Blendshape = { categoryName: string; score: number };

function getScore(shapes: Blendshape[], name: string): number {
  return shapes.find((s) => s.categoryName === name)?.score ?? 0;
}

function avg2(a: number, b: number): number {
  return (a + b) / 2;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Very simple heuristic mapping.
// We'll refine once we see real webcam output.
export function toneFromBlendshapes(shapes: Blendshape[]): EmotionState {
  const top = [...shapes].sort((a, b) => b.score - a.score).slice(0, 12);

  const smile = avg2(getScore(shapes, "mouthSmileLeft"), getScore(shapes, "mouthSmileRight"));
  const frown = avg2(getScore(shapes, "mouthFrownLeft"), getScore(shapes, "mouthFrownRight"));

  // Extra cues for better Sad/Angry separation.
  const mouthLowerDown = avg2(
    getScore(shapes, "mouthLowerDownLeft"),
    getScore(shapes, "mouthLowerDownRight")
  );
  const mouthPress = avg2(getScore(shapes, "mouthPressLeft"), getScore(shapes, "mouthPressRight"));

  const browDown = avg2(getScore(shapes, "browDownLeft"), getScore(shapes, "browDownRight"));
  const browInnerUp = getScore(shapes, "browInnerUp");

  const eyeSquint = avg2(getScore(shapes, "eyeSquintLeft"), getScore(shapes, "eyeSquintRight"));
  const noseSneer = avg2(getScore(shapes, "noseSneerLeft"), getScore(shapes, "noseSneerRight"));

  const eyeWide = avg2(getScore(shapes, "eyeWideLeft"), getScore(shapes, "eyeWideRight"));
  const jawOpen = getScore(shapes, "jawOpen");

  const sadScore = clamp01(0.55 * frown + 0.25 * mouthLowerDown + 0.2 * browInnerUp);
  const angryScore = clamp01(0.45 * browDown + 0.25 * eyeSquint + 0.2 * noseSneer + 0.1 * mouthPress);

  const urgentScore = clamp01(0.6 * eyeWide + 0.4 * jawOpen);

  const debug: Record<string, number> = {
    smile,
    frown,
    mouthLowerDown,
    mouthPress,
    browDown,
    browInnerUp,
    eyeSquint,
    noseSneer,
    eyeWide,
    jawOpen,
    sadScore,
    angryScore,
    urgentScore
  };

  for (const s of top) {
    // Expose the raw MediaPipe blendshape names and scores for calibration.
    debug[`bs:${s.categoryName}`] = s.score;
  }

  if (smile > 0.45) return { tone: "Happy", confidence: Math.min(1, smile), debug };
  if (sadScore > 0.22) return { tone: "Sad", confidence: sadScore, debug };

  if (urgentScore > 0.33) {
    return { tone: "Urgent", confidence: urgentScore, debug };
  }

  if (angryScore > 0.26) {
    return { tone: "Angry", confidence: angryScore, debug };
  }

  // If the face is very relaxed (low activation), call it Calm.
  const activation = Math.max(smile, sadScore, angryScore, urgentScore);
  if (activation < 0.08) return { tone: "Calm", confidence: 0.6, debug };

  return { tone: "Neutral", confidence: 0.5, debug };
}
