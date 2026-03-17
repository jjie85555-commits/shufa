import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Download, RefreshCw, Wand2, Info, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { identifyAnchors } from './services/geminiService';

export default function App() {
  const [img1, setImg1] = useState<string | null>(null);
  const [img2, setImg2] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>('multiply');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImages = async () => {
    if (!img1 || !img2) return;
    setIsProcessing(true);

    try {
      // 1. Identify anchors for both images
      const [anchors1, anchors2] = await Promise.all([
        identifyAnchors(img1, "image/png"),
        identifyAnchors(img2, "image/png")
      ]);

      if (anchors1.length === 0 || anchors2.length === 0) {
        alert("未能识别出足够的锚点，请尝试使用更清晰的书法图片。");
        setIsProcessing(false);
        return;
      }

      // Use the first anchor for alignment
      const a1 = anchors1[0];
      const a2 = anchors2[0];

      // 2. Load images to get dimensions
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });
      };

      const [htmlImg1, htmlImg2] = await Promise.all([loadImage(img1), loadImage(img2)]);

      // 3. Setup canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match the first image
      canvas.width = htmlImg1.width;
      canvas.height = htmlImg1.height;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Image 1 (Base)
      ctx.drawImage(htmlImg1, 0, 0);

      // Calculate transformation for Image 2
      // Anchor coordinates are normalized 0-1000
      const x1 = (a1.x / 1000) * htmlImg1.width;
      const y1 = (a1.y / 1000) * htmlImg1.height;
      const w1 = (a1.width / 1000) * htmlImg1.width;

      const x2 = (a2.x / 1000) * htmlImg2.width;
      const y2 = (a2.y / 1000) * htmlImg2.height;
      const w2 = (a2.width / 1000) * htmlImg2.width;

      // Scaling factor based on anchor width
      const scale = w1 / w2;

      // Translation to align centers
      const tx = x1 - (x2 * scale);
      const ty = y1 - (y2 * scale);

      // Draw Image 2 with transformation
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode;
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);
      ctx.drawImage(htmlImg2, 0, 0);
      ctx.restore();

      // Set result
      setResult(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error("Processing failed:", error);
      alert("处理过程中出现错误，请重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.download = 'calligraphy-overlay.png';
    link.href = result;
    link.click();
  };

  const reset = () => {
    setImg1(null);
    setImg2(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-800 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-stone-200">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight serif italic">教师书法修正</h1>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-widest">Teacher Calligraphy Correction</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={reset}
              className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
              title="Reset"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Uploaders */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100 space-y-8">
              <div className="space-y-6">
                <ImageUploader 
                  label="例字 (Image 1)" 
                  image={img1} 
                  onUpload={setImg1} 
                  onClear={() => setImg1(null)} 
                />
                <ImageUploader 
                  label="临摹图 (Image 2)" 
                  image={img2} 
                  onUpload={setImg2} 
                  onClear={() => setImg2(null)} 
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-500 uppercase tracking-wider text-[10px]">叠加透明度</span>
                  <span className="font-mono text-xs">{Math.round(opacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={opacity} 
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-stone-800 h-1 bg-stone-100 rounded-full appearance-none cursor-pointer"
                />

                <div className="flex flex-col gap-2">
                  <span className="font-medium text-stone-500 uppercase tracking-wider text-[10px]">混合模式</span>
                  <select 
                    value={blendMode}
                    onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-stone-200 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="multiply">正片叠底 (Multiply)</option>
                    <option value="screen">滤色 (Screen)</option>
                    <option value="overlay">叠加 (Overlay)</option>
                    <option value="darken">变暗 (Darken)</option>
                    <option value="lighten">变亮 (Lighten)</option>
                    <option value="normal">正常 (Normal)</option>
                  </select>
                </div>
              </div>

              <button
                disabled={!img1 || !img2 || isProcessing}
                onClick={processImages}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all shadow-lg
                  ${!img1 || !img2 || isProcessing 
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none' 
                    : 'bg-stone-800 text-white hover:bg-stone-900 hover:-translate-y-0.5 active:translate-y-0 shadow-stone-200'}`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>识别与对齐中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>开始修正</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3 p-4 bg-stone-100/50 rounded-2xl text-stone-500">
              <Info size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                AI 将自动识别两张书法图片中的文字重心与尺寸，并以此作为锚点进行自动缩放与平移对齐。建议使用背景干净、文字清晰的图片以获得最佳效果。
              </p>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <div className="sticky top-28">
              <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 overflow-hidden flex flex-col min-h-[750px]">
                <div className="p-6 border-b border-stone-50 flex items-center justify-between bg-white/80 backdrop-blur">
                  <span className="text-sm font-medium serif italic">生成预览</span>
                  {result && (
                    <button 
                      onClick={downloadResult}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-800 hover:text-stone-600 transition-colors"
                    >
                      <Download size={14} />
                      下载图片
                    </button>
                  )}
                </div>
                
                <div className="flex-1 bg-stone-50 flex items-center justify-center p-4 relative overflow-auto">
                  <AnimatePresence mode="wait">
                    {result ? (
                      <motion.img
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        src={result}
                        alt="Result"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 text-stone-300"
                      >
                        <ImageIcon size={64} strokeWidth={1} />
                        <span className="text-sm font-medium">等待生成结果</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                        <span className="text-sm font-medium text-stone-600 animate-pulse">正在分析文字锚点...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
