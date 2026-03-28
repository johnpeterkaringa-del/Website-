import { useState } from "react";
import { Scene } from "../types";
import { generateImage, generateAudio } from "../services/gemini";
import { Image as ImageIcon, Mic, Music, Video, Play, Loader2, Download, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface SceneCardProps {
  scene: Scene;
  index: number;
}

export function SceneCard({ scene, index }: SceneCardProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `scene-${index + 1}-image.png`;
    link.click();
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const img = await generateImage(scene.imagePrompt);
      setGeneratedImage(img);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const audio = await generateAudio(scene.voiceOverPrompt);
      setGeneratedAudio(audio);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white text-xs font-bold">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-zinc-900">{scene.title}</h3>
          </div>
        </div>

        <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
          {scene.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <ImageIcon size={14} />
                  Image Prompt
                </label>
                <button 
                  onClick={() => handleCopy(scene.imagePrompt, 'image')}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {copiedField === 'image' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-900 hover:underline disabled:opacity-50"
              >
                {isGeneratingImage ? "Generating..." : "Generate Preview"}
              </button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 min-h-[80px]">
              <p className="text-xs text-zinc-700 italic leading-relaxed">
                {scene.imagePrompt}
              </p>
            </div>
            <AnimatePresence>
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2 relative group rounded-lg overflow-hidden border border-zinc-200"
                >
                  <img src={generatedImage} alt="Generated preview" className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={handleDownloadImage}
                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download size={14} className="text-zinc-900" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Over Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Mic size={14} />
                  Voice Over
                </label>
                <button 
                  onClick={() => handleCopy(scene.voiceOverPrompt, 'voice')}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {copiedField === 'voice' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
              <button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-900 hover:underline disabled:opacity-50"
              >
                {isGeneratingAudio ? "Generating..." : "Generate Audio"}
              </button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 min-h-[80px]">
              <p className="text-xs text-zinc-700 leading-relaxed font-mono">
                "{scene.voiceOverPrompt}"
              </p>
            </div>
            <AnimatePresence>
              {generatedAudio && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2"
                >
                  <audio controls src={generatedAudio} className="w-full h-8" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Music Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <Music size={14} />
                Music Prompt
              </label>
              <button 
                onClick={() => handleCopy(scene.musicPrompt, 'music')}
                className="text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {copiedField === 'music' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <p className="text-xs text-zinc-700 leading-relaxed">
                {scene.musicPrompt}
              </p>
            </div>
          </div>

          {/* Video Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <Video size={14} />
                Video Prompt
              </label>
              <button 
                onClick={() => handleCopy(scene.videoPrompt, 'video')}
                className="text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {copiedField === 'video' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <p className="text-xs text-zinc-700 leading-relaxed">
                {scene.videoPrompt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
