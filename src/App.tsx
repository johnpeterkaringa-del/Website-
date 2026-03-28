import { useState, useRef, useEffect } from "react";
import { generateScript, generateImage, generateInsights } from "./services/gemini";
import { VideoScript } from "./types";
import { SceneCard } from "./components/SceneCard";
import { Sparkles, Send, Loader2, Video, FileText, Download, Image as ImageIcon, Search, Hash, Copy, Check, Upload, X, Clock, Wand2, Scissors, UserCircle2, TrendingUp, Globe, Newspaper, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

export default function App() {
  const [topic, setTopic] = useState("");
  const [includeInfluencer, setIncludeInfluencer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [influencerUrl, setInfluencerUrl] = useState<string | null>(null);
  const [isGeneratingInfluencer, setIsGeneratingInfluencer] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [globalInsights, setGlobalInsights] = useState<{ trendingIdeas: VideoScript['trendingIdeas'], newsInsights: VideoScript['newsInsights'] } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
    fetchInsights();
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio?.hasSelectedApiKey) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      // Refresh insights after key selection
      fetchInsights();
    }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const insights = await generateInsights();
      setGlobalInsights(insights);
    } catch (err: any) {
      console.error("Failed to fetch insights:", err);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setHasApiKey(false);
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const link = document.createElement("a");
    link.href = thumbnailUrl;
    link.download = "video-thumbnail.png";
    link.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);
    setThumbnailUrl(null);
    setInfluencerUrl(null);
    try {
      const result = await generateScript(topic, referenceImage || undefined, includeInfluencer);
      setScript(result);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setHasApiKey(false);
        setError("The AI is currently at its quota limit. Please select your own API key to continue.");
      } else {
        setError("An unexpected error occurred while generating the script. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!script?.thumbnailPrompt) return;
    setIsGeneratingThumbnail(true);
    setError(null);
    try {
      const img = await generateImage(script.thumbnailPrompt);
      setThumbnailUrl(img);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setHasApiKey(false);
        setError("Quota limit reached for image generation. Please select your own API key to continue.");
      } else {
        setError("Failed to generate thumbnail preview.");
      }
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleGenerateInfluencer = async () => {
    if (!script?.influencerPersona.imagePrompt) return;
    setIsGeneratingInfluencer(true);
    setError(null);
    try {
      const img = await generateImage(script.influencerPersona.imagePrompt);
      setInfluencerUrl(img);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setHasApiKey(false);
        setError("Quota limit reached for influencer generation. Please select your own API key to continue.");
      } else {
        setError("Failed to generate AI Influencer image.");
      }
    } finally {
      setIsGeneratingInfluencer(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Video className="text-white" size={18} />
            </div>
            <span className="font-bold tracking-tight text-xl">SceneScript AI</span>
          </div>
          <div className="flex items-center gap-4">
            {!hasApiKey && (
              <button 
                onClick={handleSelectKey}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-colors"
              >
                <RefreshCw size={14} />
                Select API Key
              </button>
            )}
            <a 
              href="https://ai.google.dev/gemini-api/docs" 
              target="_blank" 
              className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Input Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              From Idea to <span className="italic font-serif">Production</span>
            </h1>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Generate full video scripts with detailed prompts for every AI generation API. 
              Images, voiceovers, music, and cinematic video motion.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your video idea (e.g., 'A futuristic city in the clouds')"
                className="w-full h-16 pl-6 pr-32 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all text-lg"
              />
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-zinc-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>

            {/* Reference Image Upload */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <Upload size={14} />
                  {referenceImage ? "Change Reference Image" : "Add Reference Image (Optional)"}
                </button>
                
                <AnimatePresence>
                  {referenceImage && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="relative group"
                    >
                      <img 
                        src={referenceImage} 
                        alt="Reference" 
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => setReferenceImage(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={includeInfluencer}
                    onChange={(e) => setIncludeInfluencer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-900 transition-colors">Include AI Influencer</span>
              </label>
            </div>
          </form>
        </section>

        {/* Global Insights Section (Home Page) */}
        {!script && !isGenerating && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Global Insights</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Real-time trends & breaking news</p>
                </div>
              </div>
              <button 
                onClick={fetchInsights}
                disabled={loadingInsights}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 disabled:opacity-50"
                title="Refresh Insights"
              >
                <RefreshCw size={18} className={loadingInsights ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-3xl border border-zinc-200" />
                ))}
              </div>
            ) : globalInsights ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trending Trends */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-zinc-400 mb-6">
                    <TrendingUp size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Social Media Trends</span>
                  </div>
                  <div className="space-y-6">
                    {globalInsights.trendingIdeas.map((idea, i) => (
                      <div key={i} className="group cursor-pointer" onClick={() => setTopic(idea.trend)}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase rounded tracking-wider group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                            {idea.platform}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 mb-1 group-hover:text-zinc-600 transition-colors leading-tight">{idea.trend}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{idea.idea}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaking News */}
                <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="flex items-center gap-2 text-zinc-400 mb-6">
                    <Newspaper size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Breaking News</span>
                  </div>
                  <div className="space-y-6">
                    {globalInsights.newsInsights.map((news, i) => (
                      <div key={i} className="group cursor-pointer" onClick={() => setTopic(news.headline)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{news.source}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{news.viralPotential}</span>
                        </div>
                        <h4 className="font-bold text-white mb-2 group-hover:text-zinc-400 transition-colors leading-tight">{news.headline}</h4>
                        <p className="text-xs text-zinc-400 italic line-clamp-2 leading-relaxed">"{news.videoAngle}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                <p className="text-sm text-zinc-500">No insights available at the moment.</p>
                <button onClick={fetchInsights} className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-900 hover:underline">Try again</button>
              </div>
            )}
          </section>
        )}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <X size={16} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {script ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Script Overview */}
              <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                      <FileText size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Script Overview</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{script.title}</h2>
                    <p className="text-zinc-400 leading-relaxed mb-8">
                      {script.overview}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <ImageIcon size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Thumbnail Prompt</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleCopy(script.thumbnailPrompt, 'thumb')}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                          >
                            {copiedField === 'thumb' ? "Copied!" : "Copy Prompt"}
                          </button>
                          <button
                            onClick={handleGenerateThumbnail}
                            disabled={isGeneratingThumbnail}
                            className="text-[10px] font-bold uppercase tracking-wider text-white hover:underline disabled:opacity-50"
                          >
                            {isGeneratingThumbnail ? "Generating..." : "Generate Thumbnail Preview"}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                          {script.thumbnailPrompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                      {thumbnailUrl ? (
                        <motion.div
                          key="thumbnail"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group aspect-video rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl"
                        >
                          <img 
                            src={thumbnailUrl} 
                            alt="Video Thumbnail" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            onClick={handleDownloadThumbnail}
                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download size={14} className="text-zinc-900" />
                          </button>
                        </motion.div>
                      ) : (
                        <div className="aspect-video rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600">
                          <ImageIcon size={32} className="mb-2 opacity-20" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Thumbnail Preview</span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* SEO Optimization Section */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <Search size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">SEO Optimization</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Optimized Title</label>
                        <button 
                          onClick={() => handleCopy(script.seoTitle, 'title')}
                          className="text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          {copiedField === 'title' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-lg font-bold text-zinc-900">{script.seoTitle}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Optimized Description</label>
                        <button 
                          onClick={() => handleCopy(script.seoDescription, 'desc')}
                          className="text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          {copiedField === 'desc' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        {script.seoDescription}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <Hash size={12} />
                        Tags & Keywords
                      </label>
                      <button 
                        onClick={() => handleCopy(script.tags.join(', '), 'tags')}
                        className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        {copiedField === 'tags' ? "Copied!" : "Copy All"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {script.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium border border-zinc-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Influencer Section */}
              {script.influencerPersona && (
                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-6">
                    <UserCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">AI Influencer Persona</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1">{script.influencerPersona.name}</h3>
                        <p className="text-sm text-zinc-500 italic">The AI Host for your content</p>
                      </div>
                      
                      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                        <p className="text-sm text-zinc-600 leading-relaxed">
                          {script.influencerPersona.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Persona Image Prompt</label>
                          <button 
                            onClick={() => handleCopy(script.influencerPersona?.imagePrompt || "", 'influencer')}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
                          >
                            {copiedField === 'influencer' ? "Copied!" : "Copy Prompt"}
                          </button>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                          <p className="text-xs text-zinc-500 italic leading-relaxed">
                            {script.influencerPersona.imagePrompt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateInfluencer}
                        disabled={isGeneratingInfluencer}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all"
                      >
                        {isGeneratingInfluencer ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <UserCircle2 size={18} />
                            <span>Generate AI Influencer Image</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="lg:col-span-1">
                      <AnimatePresence mode="wait">
                        {influencerUrl ? (
                          <motion.div
                            key="influencer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group aspect-square rounded-2xl overflow-hidden border border-zinc-200 shadow-xl"
                          >
                            <img 
                              src={influencerUrl} 
                              alt="AI Influencer" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = influencerUrl;
                                  link.download = `${script.influencerPersona?.name.toLowerCase().replace(/\s+/g, '-')}.png`;
                                  link.click();
                                }}
                                className="p-3 bg-white text-zinc-900 rounded-xl font-bold flex items-center gap-2"
                              >
                                <Download size={16} />
                                <span>Download</span>
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50">
                            <UserCircle2 size={48} className="mb-3 opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Influencer Preview</span>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenes List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Scenes</h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {script.scenes.length} Scenes Generated
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-8">
                  {script.scenes.map((scene, index) => (
                    <SceneCard key={scene.id || index} scene={scene} index={index} />
                  ))}
                </div>
              </div>

              {/* CapCut Pro Editing Guide Section */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <Wand2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">CapCut Pro Editing Guide</span>
                </div>
                <div className="prose prose-sm max-w-none text-zinc-600 leading-relaxed">
                  <ReactMarkdown>{script.capcutTips}</ReactMarkdown>
                </div>
              </div>

              {/* Shorts/Reels Adaptation Section */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <Scissors size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Shorts/Reels Adaptation</span>
                </div>
                <div className="prose prose-sm max-w-none text-zinc-600 leading-relaxed">
                  <ReactMarkdown>{script.shortsAdaptation}</ReactMarkdown>
                </div>
              </div>

              {/* Trending Ideas Section */}
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Trending Social Media Ideas</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {script.trendingIdeas.map((idea, i) => (
                    <div key={i} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">
                          {idea.platform}
                        </span>
                      </div>
                      <h4 className="font-bold text-zinc-900 mb-2 leading-tight">{idea.trend}</h4>
                      <p className="text-sm text-zinc-600 leading-relaxed">{idea.idea}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* News Insights Section */}
              <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Global Breaking News Insights</span>
                </div>
                <div className="space-y-6">
                  {script.newsInsights.map((news, i) => (
                    <div key={i} className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Newspaper size={14} className="text-zinc-500" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{news.source}</span>
                        </div>
                        <span className="px-2 py-1 bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded-md tracking-wider">
                          {news.viralPotential} Potential
                        </span>
                      </div>
                      <h4 className="text-lg font-bold mb-3 leading-tight">{news.headline}</h4>
                      <div className="flex items-start gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="mt-1">
                          <Video size={14} className="text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Recommended Video Angle</p>
                          <p className="text-sm text-zinc-300 leading-relaxed italic">{news.videoAngle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Posting Times Section */}
              <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 text-zinc-400 mb-6">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Best Posting Times (Daily Breakdown)</span>
                </div>
                <div className="space-y-8">
                  {Array.from(new Set(script.postingTimes.map(pt => pt.platform))).map(platform => (
                    <div key={platform} className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">
                        {platform}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {script.postingTimes
                          .filter(pt => pt.platform === platform)
                          .map((item, i) => (
                            <div key={i} className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30 text-center">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{item.day}</div>
                              <div className="text-sm font-bold text-white">{item.bestTime}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-900" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Crafting your script...</h3>
              <p className="text-zinc-500 max-w-xs">
                Analyzing your topic and generating scene-by-scene prompts for all AI models.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 rounded-3xl"
            >
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 text-zinc-400">
                <Video size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">No script generated yet</h3>
              <p className="text-zinc-500 max-w-xs">
                Enter a topic above to start generating your AI-powered video script.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 bg-white mt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Powered by Google Gemini & Lyria
          </p>
          <div className="flex items-center justify-center gap-6">
            <span className="text-xs text-zinc-500">Image Generation</span>
            <span className="text-xs text-zinc-500">Text-to-Speech</span>
            <span className="text-xs text-zinc-500">Music Generation</span>
            <span className="text-xs text-zinc-500">Video Generation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
