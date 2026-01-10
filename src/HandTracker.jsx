"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function HandTracker() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [landmarker, setLandmarker] = useState(null);
  const [gesture, setGesture] = useState("Waiting...");

  useEffect(() => {
    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const newLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setLandmarker(newLandmarker);
    };
    createLandmarker();
  }, []);

  const predictWebcam = () => {
    if (landmarker && webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      let startTimeMs = performance.now();
      const results = landmarker.detectForVideo(video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        // We pass 'true' to indicate we want to mirror the coordinates
        draw(results.landmarks, true);
        setGesture(classifyGesture(results.landmarks[0], true));
      } else {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setGesture("No Hand");
      }
    }
    requestAnimationFrame(predictWebcam);
  };

  const classifyGesture = (landmarks, mirrored = true) => {
    // If mirrored, we flip the X check for the thumb
    // Normal: Thumb tip X < Thumb IP X is open
    // Mirrored: Thumb tip X > Thumb IP X is open
    const thumbXTip = mirrored ? (1 - landmarks[4].x) : landmarks[4].x;
    const thumbXIP = mirrored ? (1 - landmarks[3].x) : landmarks[3].x;

    const isIndexOpen = landmarks[8].y < landmarks[6].y;
    const isMiddleOpen = landmarks[12].y < landmarks[10].y;
    const isRingOpen = landmarks[16].y < landmarks[14].y;
    const isPinkyOpen = landmarks[20].y < landmarks[18].y;
    const isThumbOpen = thumbXTip < thumbXIP; 

    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) return "🖐️ Open Hand";
    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "✊ Closed Fist";
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) return "✌️ Peace";
    return "Detecting...";
  };

  const draw = (landmarks, mirrored = true) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { width, height } = canvasRef.current;

    landmarks.forEach((hand) => {
      ctx.fillStyle = "#00FF00";
      hand.forEach((point) => {
        // MIRROR MATH: 1 - x
        const x = mirrored ? (1 - point.x) * width : point.x * width;
        const y = point.y * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  useEffect(() => { if (landmarker) predictWebcam(); }, [landmarker]);

  return (
    <div style={{ position: "relative", width: "640px" }}>
      <Webcam
        ref={webcamRef}
        mirrored={true} // Visual mirror for the video
        style={{ width: "100%", height: "auto" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "auto", zIndex: 2 }}
      />
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '8px'
      }}>
        {gesture}
      </div>
    </div>
  );
}