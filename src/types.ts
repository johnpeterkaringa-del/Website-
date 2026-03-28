export interface Scene {
  id: string;
  title: string;
  description: string;
  imagePrompt: string;
  voiceOverPrompt: string;
  musicPrompt: string;
  videoPrompt: string;
}

export interface VideoScript {
  title: string;
  overview: string;
  thumbnailPrompt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  capcutTips: string;
  postingTimes: {
    platform: string;
    day: string;
    bestTime: string;
  }[];
  shortsAdaptation: string;
  influencerPersona?: {
    name: string;
    description: string;
    imagePrompt: string;
  };
  trendingIdeas: {
    platform: string;
    trend: string;
    idea: string;
  }[];
  newsInsights: {
    headline: string;
    source: string;
    viralPotential: string;
    videoAngle: string;
  }[];
  scenes: Scene[];
}
