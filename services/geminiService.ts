
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getMathExplanation = async (expression: string) => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain how to solve this math expression step-by-step: ${expression}. Provide the answer in Hindi as the primary language since the user asked in Hindi, but keep mathematical terms clear.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Step by step breakdown of the calculation"
            },
            concept: {
              type: Type.STRING,
              description: "The mathematical concept behind this operation"
            }
          },
          required: ["steps", "concept"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
