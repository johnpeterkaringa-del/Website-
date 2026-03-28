import { GoogleGenAI, Type } from "@google/genai";
import { VideoScript } from "../types";

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const isQuotaError = 
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        error?.status === "RESOURCE_EXHAUSTED" ||
        error?.code === 429;

      if (isQuotaError && i < maxRetries - 1) {
        // Exponential backoff: 2s, 4s, 8s, 16s... plus jitter
        const delay = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
        console.warn(`Quota exceeded, retrying in ${Math.round(delay/1000)}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generateInsights(): Promise<{ trendingIdeas: VideoScript['trendingIdeas'], newsInsights: VideoScript['newsInsights'] }> {
  return withRetry(async () => {
    const ai = getAI();
    const parts = [
      { text: `Identify current viral trends on TikTok, Instagram, and YouTube, and the most significant breaking news stories globally.
      
      Provide:
      1. "Trending Social Media Ideas": 3 complex, high-engagement video ideas based on current viral trends.
      2. "Global Breaking News Insights": 3 significant breaking news stories with viral potential and recommended video angles.` }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trendingIdeas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  trend: { type: Type.STRING },
                  idea: { type: Type.STRING }
                },
                required: ["platform", "trend", "idea"]
              }
            },
            newsInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  source: { type: Type.STRING },
                  viralPotential: { type: Type.STRING },
                  videoAngle: { type: Type.STRING }
                },
                required: ["headline", "source", "viralPotential", "videoAngle"]
              }
            }
          },
          required: ["trendingIdeas", "newsInsights"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  });
}

export async function generateScript(topic: string, referenceImage?: string, includeInfluencer = false): Promise<VideoScript> {
  return withRetry(async () => {
    const ai = getAI();
    const parts: any[] = [
      { text: `Generate a detailed, long-form video script (8 minutes and above) for the following topic: "${topic}". 
      The script should be divided into scenes. For each scene, provide:
      1. A title.
      2. A brief description of what happens.
      3. An image prompt (highly descriptive, for an image generation model).
      4. A voice-over prompt (the actual script to be spoken).
      5. A music prompt (describing the mood and style for music generation).
      6. A video prompt (describing motion and cinematic details for video generation).
      
      Additionally, provide:
      - A "Thumbnail Prompt": A highly descriptive prompt for a YouTube-style video thumbnail. It MUST include high-engagement, "click-worthy" captions or text overlays that would make a viewer want to click immediately.
      - A "CapCut Pro Editing Guide": Specific instructions on how to edit this specific video in CapCut to make it look professional (transitions, effects, color grading, text overlays).
      - "Best Posting Times": A list of the best times to post this specific content on major social media platforms (TikTok, Instagram, YouTube, etc.) for EACH DAY of the week (Monday through Sunday).
      - "Shorts/Reels Adaptation": A detailed 60-second script (hook, body, call to action) that uses the SAME CONTENT as the long-form video but condensed for high impact.${includeInfluencer ? '\n      - "AI Influencer Persona": Create a consistent AI influencer/host for this video. Provide a name, a detailed personality description, and a highly descriptive image prompt to generate this character consistently.' : ''}
      - "Trending Social Media Ideas": Use Google Search to find current viral trends on TikTok, Instagram, and YouTube. Generate 3 complex, high-engagement video ideas related to the user's topic based on these trends.
      - "Global Breaking News Insights": Use Google Search to find the most significant breaking news stories globally that are likely to be watched by a wide audience. Provide 3 news-based video angles related to the user's topic.` }
    ];

    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
      parts[0].text += ` Use the attached reference image as visual inspiration for the scenes, prompts${includeInfluencer ? ", and the AI influencer's appearance" : ""}.`;
    }

    const properties: any = {
      title: { type: Type.STRING },
      overview: { type: Type.STRING },
      thumbnailPrompt: { type: Type.STRING, description: "A highly descriptive prompt for a YouTube-style video thumbnail with high-engagement captions." },
      seoTitle: { type: Type.STRING },
      seoDescription: { type: Type.STRING },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }
      },
      capcutTips: { type: Type.STRING },
      postingTimes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            day: { type: Type.STRING },
            bestTime: { type: Type.STRING }
          },
          required: ["platform", "day", "bestTime"]
        }
      },
      shortsAdaptation: { type: Type.STRING, description: "A full 60-second script for a short-form video based on the long-form content." },
      trendingIdeas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            trend: { type: Type.STRING },
            idea: { type: Type.STRING }
          },
          required: ["platform", "trend", "idea"]
        }
      },
      newsInsights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            source: { type: Type.STRING },
            viralPotential: { type: Type.STRING },
            videoAngle: { type: Type.STRING }
          },
          required: ["headline", "source", "viralPotential", "videoAngle"]
        }
      },
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            voiceOverPrompt: { type: Type.STRING },
            musicPrompt: { type: Type.STRING },
            videoPrompt: { type: Type.STRING },
          },
          required: ["id", "title", "description", "imagePrompt", "voiceOverPrompt", "musicPrompt", "videoPrompt"],
        },
      },
    };

    const required = ["title", "overview", "thumbnailPrompt", "seoTitle", "seoDescription", "tags", "capcutTips", "postingTimes", "shortsAdaptation", "trendingIdeas", "newsInsights", "scenes"];

    if (includeInfluencer) {
      properties.influencerPersona = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          imagePrompt: { type: Type.STRING, description: "A prompt to generate a consistent AI influencer character." }
        },
        required: ["name", "description", "imagePrompt"]
      };
      required.push("influencerPersona");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties,
          required,
        },
      },
    });

    return JSON.parse(response.text || "{}") as VideoScript;
  });
}

export async function generateImage(prompt: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  });
}

export async function generateAudio(prompt: string): Promise<string> {
  return withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
    throw new Error("No audio generated");
  });
}
