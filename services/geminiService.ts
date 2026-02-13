import { GoogleGenAI } from "@google/genai";
import { StockMetadata } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert stock photography metadata specialist. 
Your task is to analyze images and generate metadata specifically formatted for Shutterstock.
Return ONLY a raw JSON object. Do not include markdown formatting like \`\`\`json.

Required Fields:
1. description: A concise, descriptive sentence (max 200 chars).
2. keywords: A single string containing 5 to 15 keywords separated by commas.
3. categories: A single string with 1 or 2 categories from this standard list: Abstract, Animals/Wildlife, Arts, Backgrounds/Textures, Beauty/Fashion, Buildings/Landmarks, Business/Finance, Celebrities, Education, Food and Drink, Healthcare/Medical, Holidays, Industrial, Interiors, Miscellaneous, Nature, Objects, Parks/Outdoor, People, Religion, Science, Signs/Symbols, Sports/Recreation, Technology, Transportation, Vintage.
4. editorial: "yes" or "no" (is it newsworthy/public figure?).
5. mature_content: "yes" or "no".
6. illustration: "yes" or "no".
`;

export const generateMetadata = async (apiKey: string, imageBase64: string): Promise<StockMetadata> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using a fast vision model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: {
        parts: [
          {
            text: "Analyze this image and generate Shutterstock metadata in JSON format."
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for deterministic output
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    // Clean up potential markdown if the model ignores the system instruction about raw JSON
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as StockMetadata;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};