import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates an encouraging message for the child based on their progress.
 */
export const getEncouragement = async (points: number, taskName?: string): Promise<string> => {
  try {
    const prompt = `
      You are a cheerful, magical, and friendly cartoon robot buddy for a child aged 5-8.
      The child currently has ${points} points.
      ${taskName ? `They just finished the task: "${taskName}".` : 'They are checking their progress.'}
      Write a very short, funny, and high-energy encouraging message in Chinese.
      Use emojis. Keep it under 40 words.
      Make them feel like a superhero.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text || "哇！你太棒了！继续加油哦！🌟";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "你真的很棒！继续努力！💪";
  }
};

/**
 * Suggests a new fun, educational activity.
 */
export const suggestActivity = async (): Promise<{ title: string; description: string; icon: string }> => {
  try {
    const prompt = `
      Suggest one fun, educational, and simple activity for a 6-year-old child to do at home.
      It should take about 15-20 minutes.
      Output ONLY a JSON object with this structure:
      {
        "title": "Short title in Chinese (max 10 chars)",
        "description": "One sentence description in Chinese",
        "icon": "A single emoji representing the activity"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return {
      title: "画一幅画",
      description: "画出你最喜欢的动物朋友！",
      icon: "🎨"
    };
  }
};
