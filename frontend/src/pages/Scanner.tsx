import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Barcode, Upload, X, ScanLine, AlertCircle, RefreshCw, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { scanFood, scanBarcode } from '@/api/scannerApi';

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeMode, setActiveMode] = useState<'selection' | 'barcodeInput' | 'camera' | 'analyzing'>('selection');
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  }, [stream]);

  // Start camera helper
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setCameraError(null);
    setIsCameraReady(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      // Try preferred facing mode first, fallback if not supported
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraReady(true);
          }).catch((e) => {
            console.error('Video play error:', e);
          });
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or upload a photo instead.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload a photo instead.');
      } else {
        setCameraError(err.message || 'Unable to access camera.');
      }
    }
  }, [stopCamera]);

  // Handle switching to camera mode
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, facingMode, startCamera, stopCamera]);

  // Flip camera between front and back
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from video and submit to backend
  const handleCaptureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame onto canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to Blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture snapshot from camera.');
        return;
      }

      stopCamera();
      setActiveMode('analyzing');
      setIsLoading(true);
      setError(null);

      try {
        const file = new File([blob], `food_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const result = await scanFood(file);
        if (result) {
          navigate('/product-analysis', { state: { productData: result } });
        } else {
          setError('Could not analyze the food item in this picture.');
          setActiveMode('selection');
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to analyze scanned picture.');
        setActiveMode('selection');
      } finally {
        setIsLoading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setIsLoading(true);
    setActiveMode('analyzing');
    setError(null);

    try {
      const result = await scanFood(file);
      if (result) {
        navigate('/product-analysis', { state: { productData: result } });
      } else {
        setError('Failed to analyze food image.');
        setActiveMode('selection');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Image analysis failed.');
      setActiveMode('selection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    stopCamera();
    setIsLoading(true);
    setActiveMode('analyzing');
    setError(null);

    try {
      const result = await scanBarcode(barcode.trim());
      if (result) {
        navigate('/product-analysis', { state: { productData: result } });
      } else {
        setError('Barcode not found in international database.');
        setActiveMode('selection');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Barcode scan failed.');
      setActiveMode('selection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-center">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {activeMode === 'selection' && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Food & Nutrition Scanner</h1>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Scan packaged barcodes or capture meal photos for real-time allergen safety and clinical nutrition analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Live Camera Scan */}
            <div 
              onClick={() => setActiveMode('camera')}
              className="bg-white rounded-3xl border-2 border-slate-100 hover:border-blue-500/50 hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600/10 group-hover:scale-105 transition-all text-blue-600">
                <Camera className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Live Camera Scan</h3>
              <p className="text-slate-500 text-center text-xs mb-6">Open your camera to snap a food item or barcode.</p>
              <Button className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20">Open Camera</Button>
            </div>

            {/* Barcode Search */}
            <div 
              onClick={() => setActiveMode('barcodeInput')}
              className="bg-white rounded-3xl border-2 border-slate-100 hover:border-blue-500/50 hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 group-hover:bg-teal-600/10 group-hover:scale-105 transition-all text-teal-600">
                <Barcode className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Barcode Search</h3>
              <p className="text-slate-500 text-center text-xs mb-6">Type a product barcode to check safety & ingredients.</p>
              <Button variant="outline" className="w-full rounded-2xl bg-white font-semibold hover:bg-slate-50">Enter Barcode</Button>
            </div>

            {/* Upload File */}
            <div 
              onClick={handleFileUploadClick}
              className="bg-white rounded-3xl border-2 border-slate-100 border-dashed hover:border-blue-500/50 hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:scale-105 transition-all text-slate-400 group-hover:text-blue-600">
                <Upload className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Upload Photo</h3>
              <p className="text-slate-500 text-center text-xs mb-6">Upload a photo of food or nutrition label from device.</p>
              <Button variant="outline" className="w-full rounded-2xl bg-white font-semibold hover:bg-slate-50">Upload Image</Button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
        </>
      )}

      {/* Barcode Search Panel */}
      {activeMode === 'barcodeInput' && (
        <Card className="max-w-md mx-auto w-full p-6 shadow-xl border-slate-100 rounded-3xl animate-in zoom-in-95 duration-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Enter Product Barcode</h3>
            <Button variant="ghost" size="icon" onClick={() => setActiveMode('selection')} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleBarcodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Barcode Number (EAN/UPC)</label>
              <Input 
                placeholder="e.g. 3017620422003" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)}
                className="h-12 rounded-2xl text-base"
                required 
                autoFocus
              />
            </div>
            <Button className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/25" type="submit" disabled={isLoading}>
              {isLoading ? 'Searching Database...' : 'Analyze Barcode'}
            </Button>
          </form>
        </Card>
      )}

      {/* Real Live Camera Scanner */}
      {activeMode === 'camera' && (
        <div className="flex-1 flex flex-col bg-slate-950 rounded-3xl overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300 min-h-[480px]">
          {/* Top Controls Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md" 
              onClick={() => {
                stopCamera();
                setActiveMode('selection');
              }}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
              Center food or barcode in viewfinder
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md"
              onClick={handleToggleFacingMode}
              title="Switch Camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Video & Scanner Viewfinder */}
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {cameraError ? (
              <div className="p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Camera Access Issue</h4>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">{cameraError}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => startCamera(facingMode)} 
                    variant="outline" 
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-2xl text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry Camera
                  </Button>
                  <Button 
                    onClick={handleFileUploadClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2" /> Upload Photo Instead
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  playsInline 
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover"
                />

                {/* Framing & Scanning Animation */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-72 h-72 sm:w-80 sm:h-80 border-2 border-blue-500/40 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-2xl translate-x-1 translate-y-1"></div>
                    
                    {/* Animated Scanning Beam */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_3px_#3b82f6] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Shutter Action Bar */}
          {!cameraError && (
            <div className="h-28 bg-black/90 backdrop-blur-xl flex items-center justify-center px-8 z-20 border-t border-white/10">
              <button 
                onClick={handleCaptureFrame}
                disabled={!isCameraReady}
                className="w-20 h-20 rounded-full border-4 border-white/80 bg-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                title="Capture & Analyze"
              >
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-md">
                  <Camera className="w-6 h-6" />
                </div>
              </button>
            </div>
          )}
        </div>
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

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
