import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  image: string | null;
  onUpload: (base64: string) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, image, onUpload, onClear }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-600 serif italic">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden
          ${image ? 'border-stone-300 bg-stone-50' : 'border-stone-200 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-100'}`}
      >
        {image ? (
          <>
            <img src={image} alt="Uploaded" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X size={16} className="text-stone-600" />
            </button>
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2 p-8 text-center">
            <Upload size={32} className="text-stone-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-stone-600">点击或拖拽上传</span>
              <span className="text-xs text-stone-400">支持 JPG, PNG</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};
