import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
// Note: In a real production app, ensure this key is secure or proxy requests through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'mock-key-for-ui-demo' });

/**
 * Example function to demonstrate proper SDK usage.
 * This can be used later for features like "AI-assisted password recovery" or "Smart Dashboard Insights".
 */
export const generateWelcomeMessage = async (userName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a professional, short, 1-sentence welcome message for a user named ${userName} logging into the Vissito Management System.`,
    });
    return response.text || `Welcome back, ${userName}.`;
  } catch (error) {
    console.warn("Gemini API not configured or failed, returning default.", error);
    return `Welcome back, ${userName}.`;
  }
};
