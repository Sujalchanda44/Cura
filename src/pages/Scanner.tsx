import { useState } from 'react';
import { Camera, Barcode, Upload, X, RefreshCw, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'analyzing'>('selection');

  const simulateAnalysis = () => {
    setActiveMode('analyzing');
    setTimeout(() => {
      navigate('/product-analysis');
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {activeMode === 'selection' && (
        <>
          <div className="text-center mb-8 pt-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Food Scanner</h1>
            <p className="text-slate-500 text-lg">Analyze your food with AI-powered nutrition insights.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 flex-1">
            <div 
              onClick={() => setActiveMode('camera')}
              className="bg-white rounded-2xl border-2 border-slate-100 hover:border-primary/50 hover:shadow-soft transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Camera Scan</h3>
              <p className="text-slate-500 text-center text-sm mb-6">Scan a food or product using your camera.</p>
              <Button className="w-full rounded-full">Open Camera</Button>
            </div>

            <div 
              onClick={() => setActiveMode('camera')}
              className="bg-white rounded-2xl border-2 border-slate-100 hover:border-primary/50 hover:shadow-soft transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Barcode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Barcode Scanner</h3>
              <p className="text-slate-500 text-center text-sm mb-6">Scan the product barcode directly.</p>
              <Button variant="outline" className="w-full rounded-full bg-white">Scan Barcode</Button>
            </div>

            <div 
              onClick={simulateAnalysis}
              className="bg-white rounded-2xl border-2 border-slate-100 border-dashed hover:border-primary/50 hover:shadow-soft transition-all p-8 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-primary/5 transition-colors">
                <Upload className="h-10 w-10 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">Upload Image</h3>
              <p className="text-slate-500 text-center text-sm mb-6">Upload an image of a food product.</p>
              <Button variant="outline" className="w-full rounded-full bg-white">Upload Image</Button>
            </div>
          </div>
        </>
      )}

      {activeMode === 'camera' && (
        <div className="flex-1 flex flex-col bg-black rounded-2xl overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" className="text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md" onClick={() => setActiveMode('selection')}>
              <X className="h-6 w-6" />
            </Button>
            <div className="bg-black/40 backdrop-blur-md text-white text-sm font-medium px-4 py-1.5 rounded-full">
              Align product in frame
            </div>
          </div>
          
          <div className="flex-1 relative">
            {/* Fake Camera Feed */}
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <div className="text-white/20 flex flex-col items-center">
                <Camera className="h-16 w-16 mb-4" />
                <span>Camera Preview</span>
              </div>
            </div>
            {/* Scanner Frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-xl -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-xl translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-xl -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-xl translate-x-1 translate-y-1"></div>
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_2px_#0866D5] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>

          <div className="h-32 bg-black/80 backdrop-blur-md flex items-center justify-center space-x-8 px-8">
            <div className="w-12"></div>
            <button 
              onClick={simulateAnalysis}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-12 h-12">
              <RefreshCw className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {activeMode === 'analyzing' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 relative mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-primary">
              <ScanLine className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Product</h2>
          <p className="text-slate-500 animate-pulse">Checking nutrition information...</p>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
