
import { GoogleGenAI } from "@google/genai";
import { LoveResult, SectionScore } from "../types";

export const generateDeepReport = async (
  totalScore: number, 
  sectionScores: SectionScore[],
  userName: string
): Promise<string> => {
  // Initialize AI client with named apiKey parameter from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const scoreBreakdown = sectionScores.map(s => `${s.name}: ${s.score}/10`).join(', ');
  
  const prompt = `
    Generate a premium, clinical relationship analysis for ${userName}.
    Total Score (scaled 0-100): ${totalScore}
    Breakdown: ${scoreBreakdown}
    
    The analysis should be based on the Gottman Method (Sound Relationship House) and Attachment Theory.
    Avoid being "cute". Be structured, professional, and premium.
    
    IMPORTANT FORMATTING RULES:
    1. Use PLAIN TEXT ONLY. Do not use markdown like #, *, or _ symbols.
    2. Use short, punchy paragraphs (maximum 3 sentences per paragraph).
    3. Use DOUBLE NEWLINES between paragraphs to ensure lots of white space.
    4. For the recommendations section, use explicit numbering (e.g., 1. Recommendation text).
    5. Ensure the tone is objective and high-end.
    
    Structure your response EXACTLY as:
    
    EXECUTIVE SUMMARY: 
    [Provide 2-3 short paragraphs here about the overall connection health.]

    ARCHITECTURAL DEEP DIVE: 
    [Provide 3-4 short paragraphs analyzing the breakdown of section scores.]

    STRATEGIC RECOMMENDATIONS: 
    1. [Recommendation 1]
    2. [Recommendation 2]
    3. [Recommendation 3]
    
    Ensure significant white space between different ideas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    let text = response.text || "Unable to generate detailed analysis at this time.";
    
    // Clean up any remaining markdown characters
    return text.replace(/[#*_]/g, '').trim();
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Your results indicate a specific pattern of attachment. Focus on consistent emotional responsiveness and repair to enhance your security.";
  }
};
