import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  // 1. Log that the request has started
  console.log("--- New Gemini API Request Started ---");

  try {
    // 2. Check for the API Key early
    if (!process.env.GEMINI_API_KEY) {
      console.error("DEBUG ERROR: GEMINI_API_KEY is missing from .env.local");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { prompt } = await req.json();
    
    // 3. Log the incoming data
    console.log("DEBUG INPUT: User Prompt:", prompt);

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: "You are an expressive assistant. You MUST begin every single sentence with an emotion or action tag in square brackets that describes your current tone. Examples: [laughing], [hesitant], [regretful], [excited]. Ensure the tag matches the context of the sentence that follows.", 
    });

    // 4. Log before calling the external API
    console.log("DEBUG STATUS: Fetching response from Gemini SDK...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Log the successful output
    console.log("DEBUG OUTPUT: Gemini response received successfully.");
    console.log("DEBUG PREVIEW:", text.substring(0, 50) + "...");

    return NextResponse.json({ text });
    
  } catch (error: any) {
    // 6. Detailed error logging
    console.error("--- Gemini API Error ---");
    console.error("Message:", error.message);
    console.error("Stack Trace:", error.stack);
    
    return NextResponse.json(
      { error: "Failed to generate content", details: error.message },
      { status: 500 }
    );
  } finally {
    console.log("--- Request Finished ---");
  }
}