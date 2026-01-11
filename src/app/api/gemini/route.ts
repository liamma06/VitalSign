import { NextResponse } from "next/server";

import { getServerEnv } from "@/src/lib/env";

export async function POST(req: Request) {
  try {
    const env = getServerEnv();
    
    if (!env.COHERE_API_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Call Cohere API
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        stop_sequences: []
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Cohere API Error:", response.status, errorData);
      return NextResponse.json(
        { error: "Cohere API error", details: errorData?.message || String(errorData) },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.generations?.[0]?.text || data.text || "";

    return NextResponse.json({ text: text.trim() });
    
  } catch (error: any) {
    console.error("Cohere API Error:", error?.message ?? error);
    
    return NextResponse.json(
      { error: "Failed to generate content", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
