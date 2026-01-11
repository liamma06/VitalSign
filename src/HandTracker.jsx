"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { loadEmotionModels, detectEmotion } from '@/src/modules/emotion';

export default function HandTracker({ onSentenceComplete, compact = false }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [gesture, setGesture] = useState("No Hand");
  const [sentence, setSentence] = useState("");
  const [faceEmotion, setFaceEmotion] = useState("Neutral");
  const [faceEmotionConfidence, setFaceEmotionConfidence] = useState(0);
  const emotionInFlight = useRef(false);
  const lastEmotionUpdatedAt = useRef(0);

  // RAF loop reads from refs (state values would be stale inside the loop)
  const sentenceRef = useRef("");
  const faceEmotionRef = useRef("Neutral");
  
  // HISTORY FOR DEBOUNCING AND MOTION
  const gestureHistory = useRef([]);
  const motionBuffer = useRef([]); 
  const lastTypedTime = useRef(0);
  const lastCommittedGesture = useRef(null);
  const handWasDetected = useRef(false);

  // Hand-left-frame debounce
  const noHandFrames = useRef(0);
  const lastFinalizeAt = useRef(0);

  // --- SENSITIVITY TUNING ---
  const HISTORY_SIZE = 30; 
  const MOTION_WINDOW_MS = 500; 

  const NO_HAND_FRAME_THRESHOLD = 8;
  const FINALIZE_COOLDOWN_MS = 800;

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  useEffect(() => {
    faceEmotionRef.current = faceEmotion;
  }, [faceEmotion]);

  const classifyGesture = (g) => {
    if (!g || g === "..." || g === "No Hand") {
      return { kind: "none", baseWeight: 0, minCount: Infinity, typeMinCount: Infinity, typeDelayMs: Infinity };
    }
    
    // --- SPECIAL CASE: HELLO ---
    // Dynamic gestures (movement) are harder to hold perfectly.
    // We lower the threshold (10 frames vs 20) so a quick wave registers.
    if (g === "HELLO") {
       return { kind: "word", baseWeight: 2.5, minCount: 10, typeMinCount: 10, typeDelayMs: 600 };
    }

    // Static gestures need stability (20 frames / ~0.6s)
    return { kind: "word", baseWeight: 2.5, minCount: 20, typeMinCount: 20, typeDelayMs: 600 };
  };

  const applyGestureToSentence = (prev, g) => {
    const trimRight = (s) => s.replace(/[ \t\n\r]+$/g, "");
    const ensureSpace = (s) => (s.length === 0 || /\s$/.test(s) ? s : s + " ");
    const base = ensureSpace(trimRight(prev));
    return base + g + " ";
  };

  useEffect(() => {
    const initAI = async () => {
      try {
        await loadEmotionModels();
      } catch (err) {
        console.error('Failed to load emotion models:', err);
      }

      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      const nl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1
      });
      setLandmarker(nl);
    };
    initAI();
  }, []);

  const detectFaceEmotion = async () => {
    if (emotionInFlight.current) return;
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    emotionInFlight.current = true;
    try {
      const result = await detectEmotion(video);
      if (result?.emotion) setFaceEmotion(result.emotion);
      if (typeof result?.confidence === 'number') setFaceEmotionConfidence(result.confidence);
      lastEmotionUpdatedAt.current = Date.now();
    } catch (err) {
      console.error('Emotion detection error:', err);
    } finally {
      emotionInFlight.current = false;
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;
      detectFaceEmotion();
    }, 1500);
    return () => {
      clearInterval(id);
      emotionInFlight.current = false;
    };
  }, []);

  const predict = () => {
    if (landmarker && webcamRef.current?.video?.readyState === 4) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.landmarks?.length > 0) {
        noHandFrames.current = 0;
        const lm = results.landmarks[0];
        draw(results.landmarks);
        
        motionBuffer.current.unshift({ x: lm[0].x, y: lm[0].y, z: lm[0].z || 0, time: Date.now() });
        if (motionBuffer.current.length > 30) motionBuffer.current.pop();

        const rawSign = analyzeASL(lm);
        if (rawSign !== "..." && rawSign !== "No Hand") {
          handWasDetected.current = true;
        }
        debounceAndType(rawSign);
      } else {
        noHandFrames.current += 1;

        const now = Date.now();
        const canFinalize =
          handWasDetected.current &&
          onSentenceComplete &&
          noHandFrames.current >= NO_HAND_FRAME_THRESHOLD &&
          now - lastFinalizeAt.current > FINALIZE_COOLDOWN_MS;

        if (canFinalize) {
          const currentText = sentenceRef.current.trim();
          if (currentText.length > 0) {
            onSentenceComplete(currentText, faceEmotionRef.current);
            setSentence("");
          }
          handWasDetected.current = false;
          lastFinalizeAt.current = now;
          noHandFrames.current = 0;
        }
        setGesture("No Hand");
        gestureHistory.current = [];
      }
    }
    requestAnimationFrame(predict);
  };

  const analyzeASL = (lm) => {
    const dist = (p1, p2) => Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow((p1.z || 0) - (p2.z || 0), 2)
    );
    
    const wrist = lm[0];
    const thumbT = lm[4], indexT = lm[8], middleT = lm[12], ringT = lm[16], pinkyT = lm[20];
    const indexK = lm[5], middleK = lm[9], ringK = lm[13], pinkyK = lm[17];
    
    // Normalization scale
    const handScale = dist(wrist, middleK);
  
    // Extended Logic
    const isExtended = (tip, knuckle) => dist(tip, wrist) > dist(knuckle, wrist) + (handScale * 0.25);
    
    const f1 = isExtended(indexT, indexK); 
    const f2 = isExtended(middleT, middleK); 
    const f3 = isExtended(ringT, ringK);   
    const f4 = isExtended(pinkyT, pinkyK); 
    
    const isPalmOpen = f1 && f2 && f3 && f4;
    const isSideways = Math.abs(wrist.x - middleK.x) > Math.abs(wrist.y - middleK.y);
    const fingersTogether = dist(indexT, middleT) < handScale * 0.4; 

    // --- 1. HELLO (Wave) ---
    if (isPalmOpen && !fingersTogether) {
        let velocityChanges = 0;
        let lastTrend = 0; 
        for(let i=0; i < motionBuffer.current.length - 1; i++){
            const diff = motionBuffer.current[i].x - motionBuffer.current[i+1].x;
            if (Math.abs(diff) > 0.015) {
                const currentTrend = diff > 0 ? 1 : -1;
                if (lastTrend !== 0 && currentTrend !== lastTrend) {
                    velocityChanges++;
                }
                lastTrend = currentTrend;
            }
        }
        // REDUCED REQUIREMENT: 2 swipes (Left->Right) is enough
        if (velocityChanges >= 2) {
            return "HELLO";
        }
    }

    // --- THANK YOU ---
    if (isPalmOpen && motionBuffer.current.length > 5) {
         const dy = motionBuffer.current[0].y - motionBuffer.current[5].y;
         if (dy > 0.10) return "THANK YOU";
    }

    // --- GOODBYE (Salute) ---
    if (isPalmOpen && fingersTogether && isSideways && wrist.y < 0.6) {
        return "GOODBYE";
    }

    // --- STATIC GESTURES ---

    const isSideways = Math.abs(wrist.x - middleK.x) > Math.abs(wrist.y - middleK.y);

    // Thumb distance helpers
    const thumbToWrist = dist(thumbT, wrist);
    const thumbToIndexK = dist(thumbT, indexK);
    const isThumbOut = thumbToIndexK > handScale * 0.6;

    // Thumb-tucked detection: require thumb to be relatively close to the wrist
    // and near the index knuckle; include vertical proximity to the wrist.
    const isThumbTucked =
      !isThumbOut &&
      thumbToWrist < handScale * 0.55 &&
      thumbToIndexK < handScale * 0.55 &&
      Math.abs(thumbT.y - wrist.y) < handScale * 0.4;

    // --- "HELP" (Signal for Help - Stage 1) ---
    // Primary: 4 fingers extended and thumb tucked near palm.
    // Fallbacks: if the thumb is simply not extended or is reasonably close
    // to the wrist we still accept HELP to avoid missing valid signs.
    if (isPalmOpen && !isThumbOut && (isThumbTucked || thumbToWrist < handScale * 0.7 || thumbToIndexK < handScale * 0.75)) {
      return "HELP";
    }

    // --- LOVE ---
    if (f1 && !f2 && !f3 && f4 && isThumbOut) {
        return "LOVE";
    }

    // --- CALL ---
    if (!f1 && !f2 && !f3 && f4 && isThumbOut) {
        if (isSideways) return "CALL";
    }

    // --- ME ---
    if (!f1 && !f2 && !f3 && !f4) {
        const isThumbMostlyOut = dist(thumbT, indexK) > handScale * 0.4;
        if (isThumbMostlyOut) {
            const isHorizontal = Math.abs(thumbT.y - indexK.y) < handScale * 0.5;
            const isPointingIn = Math.abs(thumbT.x - pinkyK.x) < Math.abs(thumbT.x - indexK.x) || 
                                 Math.abs(thumbT.x - wrist.x) < handScale * 0.3;
            if (isHorizontal) return "ME";
        }
    }

    // --- YES ---
    if (!f1 && !f2 && !f3 && !f4) {
        if (thumbT.y < indexK.y - (handScale * 0.2)) {
            return "YES";
        }
    }

    // --- NO ---
    if (!f1 && !f2 && !f3 && !f4) {
         if (thumbT.y > wrist.y + (handScale * 0.2)) {
             return "NO";
         }
    }

    // --- I ---
    if (!f1 && !f2 && !f3 && f4 && !isThumbOut) {
        return "I";
    }

    // --- YOU ---
    if (f1 && !f2 && !f3 && !f4) {
        return "YOU";
    }

    return "...";
  };

  const debounceAndType = (sign) => {
    gestureHistory.current.unshift(sign);
    if (gestureHistory.current.length > HISTORY_SIZE) gestureHistory.current.pop();

    const counts = {};
    gestureHistory.current.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) return;

    const best = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const count = counts[best];
    const meta = classifyGesture(best);

    const now = Date.now();
    const timeSinceLastType = now - lastTypedTime.current;
    
    if (best !== "..." && best !== "No Hand" && count >= meta.minCount && 
       (lastCommittedGesture.current !== best || timeSinceLastType > 2000)) {
       
       setSentence(prev => applyGestureToSentence(prev, best));
       setGesture(best);
       lastTypedTime.current = now;
       lastCommittedGesture.current = best;
       
       gestureHistory.current = [];
    } else if (best !== "..." && best !== "No Hand" && count >= 3) {
       setGesture(best); 
    }
  };

  const draw = (landmarks) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { width, height } = canvasRef.current;
    const conn = [[0,1,2,3,4],[0,5,6,7,8],[9,10,11,12],[13,14,15,16],[0,17,18,19,20],[5,9,13,17]];
    landmarks.forEach(hand => {
      ctx.strokeStyle = "#00FF00"; ctx.lineWidth = 5;
      conn.forEach(p => {
        ctx.beginPath();
        p.forEach((idx, i) => {
          const x = (1 - hand[idx].x) * width;
          const y = hand[idx].y * height;
          if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
      });
    });
  };

  useEffect(() => { if (landmarker) predict(); }, [landmarker]);

  const containerStyle = compact 
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#121212', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' };
  
  const videoContainerStyle = compact
    ? { position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem' }
    : { position: 'relative', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '3px solid #333' };

  const textContainerStyle = compact
    ? { position: 'absolute', bottom: '24px', left: '24px', right: '24px', background: 'rgba(39, 39, 39, 0.95)', backdropFilter: 'blur(16px)', padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' }
    : { marginTop: '20px', width: '100%', background: '#1e1e1e', padding: '25px', borderRadius: '15px', border: '1px solid #444' };

  return (
    <div style={containerStyle}>
      <div style={videoContainerStyle}>
        <Webcam ref={webcamRef}
                videoConstraints={{
                  width: 1080, 
                  height: 560,
                  facingMode: "user"
                }} 
                mirrored={true} 
                style={{ width: '100%', display: 'block' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        {!compact && (
          <>
            <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '10px' }}>
              Live Translation Engine
            </div>
            <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '10px' }}>
              Emotion: {faceEmotion} ({Math.round(faceEmotionConfidence * 100)}%)
            </div>
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#00FF7F', color: 'black', padding: '12px 35px', borderRadius: '50px', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,255,127,0.4)' }}>
              {gesture}
            </div>
          </>
        )}
      </div>
      <div style={textContainerStyle}>
        {!compact ? (
          <>
             <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Emotion</div>
               <div style={{ background: '#0b1220', color: '#c7f9d8', padding: '6px 10px', borderRadius: '8px', fontWeight: '600' }}>
                 {faceEmotion} {faceEmotionConfidence ? `(${Math.round(faceEmotionConfidence * 100)}%)` : ''}
               </div>
             </div>
             <p style={{ color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Current Sentence</p>
             <p style={{ fontSize: '32px', minHeight: '45px', margin: '0', fontWeight: '500' }}>{sentence}</p>
             <button onClick={() => { setSentence(""); }} style={{ marginTop: '20px', padding: '10px 25px', background: '#ff3b3b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Text</button>
          </>
        ) : (
          <>
             <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ color: 'var(--vs-red)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Emotion</div>
               <div style={{ background: 'rgba(47, 154, 143, 0.2)', color: 'var(--vs-accent)', padding: '5px 10px', borderRadius: '8px', fontWeight: '600', fontSize: '11px', border: '1px solid rgba(47, 154, 143, 0.35)' }}>
                 {faceEmotion} {faceEmotionConfidence ? `(${Math.round(faceEmotionConfidence * 100)}%)` : ''}
               </div>
             </div>
             <p style={{ color: 'var(--vs-red)', margin: '0 0 8px 0', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', fontWeight: '600' }}>Current Sentence</p>
             <p style={{ fontSize: '15px', minHeight: '22px', margin: '0', fontWeight: '500', color: 'var(--vs-text)', lineHeight: '1.5' }}>{sentence}</p>
          </>
        )}
      </div>
    </div>
  );
}