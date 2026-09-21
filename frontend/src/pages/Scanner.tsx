import React, { useState, useRef } from 'react';
import { Upload, ScanLine, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { scanFood } from '@/api/scannerApi';

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'upload' | 'analyzing'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    setActiveMode('analyzing');
    setError(null);

    try {
      const result = await scanFood(file);
      if (result) {
        navigate('/product-analysis', { state: { productData: result } });
      } else {
        setError('Failed to analyze food image.');
        setActiveMode('upload');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Image analysis failed.');
      setActiveMode('upload');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-center">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {activeMode === 'upload' && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Food & Nutrition Scanner</h1>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Upload a meal photo or nutrition label for real-time allergen safety and clinical nutrition analysis.
            </p>
          </div>

          {/* Upload File Card */}
          <div 
            onClick={handleFileUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white rounded-3xl border-2 border-dashed transition-all p-12 flex flex-col items-center justify-center cursor-pointer group shadow-sm hover:shadow-xl ${
              isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-200 hover:border-blue-500/50'
            }`}
          >
            <div className="h-24 w-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600/10 group-hover:scale-105 transition-all text-blue-600">
              <Upload className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Upload Food Photo</h3>
            <p className="text-slate-500 text-center text-sm mb-6 max-w-xs">
              Drag and drop your image here, or browse files from your device.
            </p>
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-blue-500/25">
              Choose Photo
            </Button>
            <p className="text-xs text-slate-400 mt-4">Supports JPEG, PNG, and WebP images</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </>
      )}

      {/* Analyzing Animation Spinner */}
      {activeMode === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 relative mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <ScanLine className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Food & Safety</h2>
          <p className="text-slate-500 animate-pulse text-sm">Evaluating nutrients, ingredients, and allergy compatibility with Google Vision AI...</p>
        </div>
      )}
    </div>
  );
}
