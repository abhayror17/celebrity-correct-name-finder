import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeNames = async (
  originalName: string,
  duplicateName: string
): Promise<{ result: string; correctName: string; sources: GroundingChunk[] }> => {
  // User requested GEMINI FLASH LITE
  const model = "gemini-flash-lite-latest";

  const prompt = `
    Analyze if the following two names refer to the same person.
    Name 1: "${originalName}"
    Name 2: "${duplicateName}"

    MANDATORY INSTRUCTIONS:
    1. Use Google Search to identify the real-world personality or entity these names refer to.
    2. Determine the OFFICIAL, CORRECT spelling of the name from the search results.
    3. Determine if the two provided names refer to this SAME person (checking for typos, nicknames, or variations).
    
    If the names are similar but misspelled (e.g. "Brad Pit" vs "Brad Pitt"), identify the correct spelling of the intended famous personality (e.g. "Brad Pitt") and mark as SAME.

    Your response MUST be in the following strict format:
    Status: SAME | DIFFERENT
    Correct Name: [The verified correct spelling from Google Search]
  `;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n');
    
    // Parse Status
    const statusLine = lines.find(line => line.trim().toUpperCase().startsWith("STATUS:"));
    let resultText = "ERROR";
    
    if (statusLine) {
        const parts = statusLine.split(":");
        if (parts.length > 1) {
            const statusValue = parts[1].trim().toUpperCase();
            if (statusValue.includes("SAME")) resultText = "SAME";
            else if (statusValue.includes("DIFFERENT")) resultText = "DIFFERENT";
        }
    }

    // Parse Correct Name
    const nameLine = lines.find(line => line.trim().toUpperCase().startsWith("CORRECT NAME:"));
    let correctName = "";
    if (nameLine) {
        const parts = nameLine.split(":");
        if (parts.length > 1) {
             correctName = parts.slice(1).join(":").trim();
        }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Fallback if structured parsing fails but simple text is returned
    if (resultText === "ERROR") {
        const simpleText = text.trim().toUpperCase();
        if (simpleText === "SAME" || simpleText === "DIFFERENT") {
            resultText = simpleText;
        }
    }

    if (resultText === "SAME" || resultText === "DIFFERENT") {
      return { result: resultText, correctName, sources: groundingChunks };
    } else {
      throw new Error(`Unexpected API response format: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown API error occurred.');
  }
};