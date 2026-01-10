"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HandTracker() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [gesture, setGesture] = useState("Initializing...");
  const [sentence, setSentence] = useState("");

  // HISTORY FOR DEBOUNCING AND MOTION
  const gestureHistory = useRef([]);
  const motionBuffer = useRef([]); 
  const lastTypedTime = useRef(0);
  const letterStartTime = useRef(0);

  const HISTORY_SIZE = 15;
  const CONFIDENCE = 10;
  const TYPE_DELAY = 1200;

  useEffect(() => {
    const initAI = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      const nl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1
      });
      setLandmarker(nl);
    };
    initAI();
  }, []);

  const predict = () => {
    if (landmarker && webcamRef.current?.video?.readyState === 4) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.landmarks?.length > 0) {
        const lm = results.landmarks[0];
        draw(results.landmarks);
        
        // Update Motion Buffer (Track wrist)
        motionBuffer.current.unshift({ x: lm[0].x, y: lm[0].y, time: Date.now() });
        if (motionBuffer.current.length > 20) motionBuffer.current.pop();

        const rawSign = analyzeASL(lm);
        debounceAndType(rawSign);
      } else {
        setGesture("No Hand");
      }
    }
    requestAnimationFrame(predict);
  };

  const analyzeASL = (lm) => {
    const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    
    const wrist = lm[0];
    const thumbT = lm[4], indexT = lm[8], middleT = lm[12], ringT = lm[16], pinkyT = lm[20];
    const indexK = lm[5], middleK = lm[9], ringK = lm[13], pinkyK = lm[17];
    
    const handScale = dist(wrist, middleK);
    const palmWidth = dist(indexK, pinkyK);
  
    // Finger Extension Logic
    const isUp = (t, k) => t.y < (k.y - handScale * 0.1);
    const f1 = isUp(indexT, indexK), f2 = isUp(middleT, middleK);
    const f3 = isUp(ringT, ringK), f4 = isUp(pinkyT, pinkyK);
  
    // --- 1. MOTION LOGIC (HELLO, YES, BACKSPACE) ---
    const oldPos = motionBuffer.current[motionBuffer.current.length - 1] || wrist;
    const dx = wrist.x - oldPos.x;
    const dy = wrist.y - oldPos.y;
  
    // HELLO Requirement: Wide open hand (Thumb OUT) + deliberate horizontal movement
    const isThumbOut = dist(thumbT, indexK) > handScale * 0.6;
    const isHandWideOpen = f1 && f2 && f3 && f4 && isThumbOut;
  
    if (isHandWideOpen && Math.abs(dx) > 0.15) return "HELLO"; // Increased threshold
    
    // BACKSPACE: Swipe left with open hand
    if (isHandWideOpen && dx < -0.18) return "BACKSPACE";
  
    // YES: Fist nodding vertically
    if (!f1 && !f2 && !f3 && !f4 && Math.abs(dy) > 0.05 && thumbT.y < wrist.y) return "YES";
  
    // --- 2. ORIENTATION LOGIC (SPACE / NO) ---
    
    // SPACE: Thumbs Up
    if (!f1 && !f2 && !f3 && !f4 && thumbT.y < indexK.y - (handScale * 0.5)) return "SPACE";
  
    // NO: Thumbs Down
    if (!f1 && !f2 && !f3 && !f4 && thumbT.y > wrist.y + (handScale * 0.2)) return "NO";
  
    // --- 3. STATIC ALPHABET LOGIC ---
  
    // C vs B Differentiation
    if (f1 && f2 && f3 && f4) {
      const thumbToMiddle = dist(thumbT, middleT);
      const fingerLength = dist(middleT, middleK);
      // C shape: Thumb closer to tips + finger foreshortening
      if (thumbToMiddle < handScale * 0.8 && fingerLength < handScale * 0.6) return "C";
      return "B";
    }
  
    // V vs U (Spread vs Together)
    if (f1 && f2 && !f3 && !f4) {
      return dist(indexT, middleT) < palmWidth * 0.4 ? "U" : "V";
    }
  
    // Fists (A, S, T, E)
    if (!f1 && !f2 && !f3 && !f4) {
      if (thumbT.y > middleT.y) return "E";
      const thumbToPinky = dist(thumbT, pinkyK);
      // A: Thumb out to the side
      if (thumbToPinky > palmWidth * 1.2) return "A";
      // T: Thumb tucked behind index
      if (dist(thumbT, indexK) < handScale * 0.4) return "T";
      // S: Thumb over knuckles
      return "S";
    }
  
    // L, D
    if (f1 && !f2 && !f3 && !f4) {
      return dist(thumbT, indexK) > handScale * 0.7 ? "L" : "D";
    }
    
    // Y, I
    if (f4 && !f1 && !f2 && !f3) {
      return dist(thumbT, indexK) > handScale * 0.8 ? "Y" : "I";
    }
  
    return "...";
  };

  const debounceAndType = (sign) => {
    // 1. Update History
    gestureHistory.current.unshift(sign);
    if (gestureHistory.current.length > HISTORY_SIZE) gestureHistory.current.pop();

    // 2. Find most frequent sign in history (the 'stable' one)
    const counts = {};
    gestureHistory.current.forEach(s => counts[s] = (counts[s] || 0) + 1);
    const [best, count] = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b);

    // 3. Update the UI Label
    if (count >= CONFIDENCE && best !== gesture) {
      setGesture(best);
      letterStartTime.current = Date.now();
    }

    // 4. Typing Logic (Triggers after TYPE_DELAY)
    const timeHeld = Date.now() - letterStartTime.current;
    const timeSinceLastType = Date.now() - lastTypedTime.current;

    if (gesture !== "..." && gesture !== "No Hand" && timeHeld > TYPE_DELAY && timeSinceLastType > TYPE_DELAY + 500) {
      
      if (gesture === "SPACE") {
        setSentence(prev => prev + " ");
      } 
      else if (gesture === "BACKSPACE") {
        setSentence(prev => prev.slice(0, -1)); // Removes the last character
      }
      else if (gesture === "NO") {
        setSentence(prev => prev + " NO "); // Adds word with spacing
      }
      else if (gesture === "YES" || gesture === "HELLO") {
        setSentence(prev => prev + ` ${gesture} `);
      }
      else {
        // For single letters (A, B, C, etc.)
        setSentence(prev => prev + gesture);
      }

      lastTypedTime.current = Date.now();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#121212', minHeight: '100vh', padding: '20px', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '720px', borderRadius: '15px', overflow: 'hidden', border: '3px solid #333' }}>
        <Webcam ref={webcamRef} mirrored={true} style={{ width: '100%' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '10px' }}>
          Live Translation Engine
        </div>
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#00FF7F', color: 'black', padding: '12px 35px', borderRadius: '50px', fontSize: '28px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,255,127,0.4)' }}>
          {gesture}
        </div>
      </div>
      <div style={{ marginTop: '20px', width: '100%', maxWidth: '720px', background: '#1e1e1e', padding: '25px', borderRadius: '15px', border: '1px solid #444' }}>
        <p style={{ color: '#aaa', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Current Sentence</p>
        <p style={{ fontSize: '32px', minHeight: '45px', margin: '0', fontWeight: '500' }}>{sentence}</p>
        <button onClick={() => setSentence("")} style={{ marginTop: '20px', padding: '10px 25px', background: '#ff3b3b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Text</button>
      </div>
    </div>
  );
}