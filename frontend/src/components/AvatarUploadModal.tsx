import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, X, Check, Trash2,
  Loader2, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadAvatar, uploadAvatarBase64, deleteAvatar } from '@/api/userApi';
import { optimizeAvatarImage, getAvatarUrl } from '@/lib/avatar';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  userName: string;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
}: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        handleModalClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isProcessing]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, GIF, etc.).');
      return;
    }

    // Limit original file size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    try {
      setIsProcessing(true);
      // Create local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
    } catch (err) {
      setErrorMessage('Could not load image preview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset inputs so selecting same file again triggers change
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Perform upload
  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Optimize image (compress smartphone multi-megabyte photos to fast <400kb avatar)
      const { optimizedFile, base64 } = await optimizeAvatarImage(selectedFile, 800, 0.88);

      let newAvatarUrl: string | null = null;

      try {
        // 2. Try primary multipart upload
        const response = await uploadAvatar(optimizedFile);
        if (response?.avatarUrl) {
          newAvatarUrl = response.avatarUrl;
        }
      } catch (uploadErr) {
        if (import.meta.env.DEV) console.warn('Multipart upload fallback to base64 payload:', uploadErr);
        // Fallback: Upload as base64 string
        const fallbackRes = await uploadAvatarBase64(base64);
        if (fallbackRes?.avatarUrl) {
          newAvatarUrl = fallbackRes.avatarUrl;
        } else {
          // Local fallback base64
          newAvatarUrl = base64;
        }
      }

      if (!newAvatarUrl) {
        newAvatarUrl = base64;
      }

      onAvatarUpdated(newAvatarUrl);
      handleModalClose();
    } catch (err: any) {
      console.error('Error saving profile picture:', err);
      setErrorMessage(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove custom avatar
  const handleRemoveAvatar = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await deleteAvatar();
      onAvatarUpdated(null);
      handleModalClose();
    } catch (err: any) {
      console.error('Error removing avatar:', err);
      // Still allow UI reset
      onAvatarUpdated(null);
      handleModalClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const isCustomAvatar = currentAvatarUrl && !currentAvatarUrl.includes('api.dicebear.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden native inputs for Laptop and Phone */}
        {/* Standard File Explorer for photo library and file browser */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/png,image/jpeg,image/webp,image/gif,image/jpg,image/heic,image/heif"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-file-upload"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#134E2F]/10 flex items-center justify-center text-[#134E2F]">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Profile Picture (DP)</h3>
              <p className="text-xs text-slate-500">Upload from laptop or capture on phone</p>
            </div>
          </div>
          <button 
            onClick={handleModalClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: Image Selected (Preview & Confirm) */}
          {previewUrl ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {/* Circular Mask Display */}
                <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-slate-100">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-medium space-y-2">
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                      <span>Optimizing & Saving...</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Preview Profile Picture</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)` : 'Ready to save'}
                </p>
              </div>

              <div className="flex items-center space-x-3 w-full pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-slate-700 border-slate-200 hover:bg-slate-50"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  disabled={isProcessing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Choose Different
                </Button>

                <Button 
                  type="button" 
                  className="flex-1 bg-[#134E2F] hover:bg-[#0E3B24] text-white shadow-sm"
                  onClick={handleSaveAvatar}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Set as Profile Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Mode 2: Select Device / Upload Option */
            <div className="space-y-4">
              {/* Current Avatar Mini Preview */}
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-200">
                  <img 
                    src={getAvatarUrl(currentAvatarUrl, userName)} 
                    alt={userName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Avatar</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500">
                    {isCustomAvatar ? 'Custom uploaded photo' : 'Default animated avatar'}
                  </p>
                </div>
                {isCustomAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isProcessing}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs flex items-center transition-colors"
                    title="Remove custom photo"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Reset
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                    : 'border-slate-200 hover:border-[#134E2F] bg-slate-50/50 hover:bg-[#134E2F]/5'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-all text-[#134E2F]">
                  <Upload className={`h-6 w-6 ${isDragOver ? 'text-emerald-600 animate-bounce' : 'text-[#134E2F]'}`} />
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {isDragOver ? 'Drop image here' : 'Click to browse or drag & drop photo here'}
                </p>
                <p className="text-xs text-slate-400">
                  Supports PNG, JPG, WEBP, HEIC up to 15MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
            Automatic high-res optimization
          </span>
          <span>Secured for Cura+</span>
        </div>
      </div>
    </div>
  );
}
