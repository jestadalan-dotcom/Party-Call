import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_FLASH } from "../constants";

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const generateBannerMessage = async (context: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Write a short, punchy, and inspiring New Year's greeting for a party banner. 
    Context: ${context}. 
    Max 10 words. 
    Do not use quotes. 
    Be energetic!`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
    });

    return response.text?.trim() || "Happy New Year 2025!";
  } catch (error) {
    console.error("Error generating banner:", error);
    return "Celebrate the Future!";
  }
};
