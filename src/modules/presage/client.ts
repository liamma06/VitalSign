"use client";

// This is where you would import the real SDK if installed
// import { SmartSpectra } from '@presage/sdk'; 

const API_KEY = process.env.NEXT_PUBLIC_PRESAGE_API_KEY;

export class PresageClient {
  private isRunning = false;
  
  constructor() {
    if (!API_KEY) {
      console.warn("Presage API Key missing! Vital signs will be simulated.");
    }
  }

  public async startMonitoring(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // TODO: Initialize real Presage SDK here
    // await SmartSpectra.init({ apiKey: API_KEY });
    // await SmartSpectra.startCamera();
    
    console.log("Presage VitalSign monitoring started (Key:", API_KEY ? "Present" : "Missing", ")");
  }

  /**
   * Returns the current heart rate (BPM).
   * Connect this to the real SDK callback.
   */
  public getHeartRate(): number {
    if (!this.isRunning) return 0;
    
    // REAL IMPLEMENTATION:
    // return SmartSpectra.getMetrics().heartRate;

    // SIMULATION (For testing "Anxious" without the real SDK yet):
    // Returns a high heart rate (110) every 5 seconds to test the emotion trigger
    const mockBPM = (Date.now() / 1000) % 10 > 5 ? 110 : 75; 
    return mockBPM;
  }
}

export const presage = new PresageClient();