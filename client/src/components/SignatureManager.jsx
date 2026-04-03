import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';
import { X, Crop, Save, RotateCcw, Sliders, Check } from 'lucide-react';

const SignatureManager = ({ userId, currentSignature, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  
  // Cleaning states
  const [sensitivity, setSensitivity] = useState(200); // 0-255 (Higher = removes more background)
  const [cleanPreview, setCleanPreview] = useState(null);
  const canvasRef = useRef(null);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(selected);
      setFile(selected);
    } else {
      toast.error('Please select a valid image file.');
    }
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  /**
   * THE "PERFECT" CLEANER:
   * This function takes the cropped image, loops through every pixel,
   * and makes "bright" pixels (background) fully transparent while
   * making "dark" pixels (ink) pure black for a professional look.
   */
  const processAndClean = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // 1. Draw the cropped section
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    // 2. Pixel Manipulation (The Magic)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness (Luminance)
      const brightness = (r + g + b) / 3;

      if (brightness > sensitivity) {
        // It's background -> Make Transparent
        data[i + 3] = 0;
      } else {
        // It's ink -> Make it Crisp Black (0,0,0)
        // We preserve some original alpha if it was already semi-transparent
        data[i] = 0;
        data[i+1] = 0;
        data[i+2] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setCleanPreview(canvas.toDataURL('image/png'));
  };

  // Re-process preview when sensitivity changes
  useEffect(() => {
    if (showCropper && croppedAreaPixels) {
      const timer = setTimeout(processAndClean, 100);
      return () => clearTimeout(timer);
    }
  }, [sensitivity, croppedAreaPixels]);

  const handleUpload = async () => {
    if (!cleanPreview) return;

    setUploading(true);
    try {
      // Convert DataURL to Blob
      const blob = await fetch(cleanPreview).then(r => r.blob());
      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');

      const response = await axios.patch(`/users/${userId}/signature`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Signature cleaned and verified!');
      setShowCropper(false);
      setImageSrc(null);
      setCleanPreview(null);
      if (onUploadSuccess) onUploadSuccess(response.data.data.signature_path);
    } catch (error) {
      toast.error('Failed to save cleaned signature.');
    } finally {
      setUploading(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-[0.1em]">Identity Verification</h3>
        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">Digital Stamp Node</span>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="w-full md:w-64 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 relative overflow-hidden group">
          {currentSignature ? (
            <img 
              src={`${apiBase}/uploads/${currentSignature}`} 
              alt="Current Signature" 
              className="max-h-[80%] max-w-[80%] object-contain"
            />
          ) : (
            <div className="text-center px-4">
              <RotateCcw size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Awaiting Signature</p>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
            Registry Copy
          </div>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
              Source Signature
            </label>
            <div className="flex items-center gap-4">
                <input type="file" id="sig-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                <label 
                  htmlFor="sig-upload"
                  className="cursor-pointer flex items-center px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <Crop size={18} className="mr-2" />
                  Upload & Detect Ink
                </label>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed italic">
              * High-contrast photos on white paper yield the best results.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Processing Modal */}
      {showCropper && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" onClick={() => setShowCropper(false)}></div>
          
          <div className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[90vh] lg:h-auto">
            
            {/* Left: Original + Crop */}
            <div className="flex-1 bg-slate-800 relative min-h-[300px]">
              <div className="absolute top-6 left-6 z-10 bg-slate-900/50 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                1. Locate Signature
              </div>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Right: Cleaned Preview + Controls */}
            <div className="w-full lg:w-[400px] bg-white p-8 flex flex-col border-l border-slate-100 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Refine Ink</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Background Removal Engine</p>
                </div>
                <button onClick={() => setShowCropper(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Live Result</label>
                <div className="w-full h-40 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  {cleanPreview ? (
                    <img src={cleanPreview} alt="Cleaned" className="max-h-[80%] max-w-[80%] object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Processing...</span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-black uppercase text-slate-500">Transparent PNG</div>
                </div>
              </div>

              <div className="space-y-8 flex-1">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <Sliders size={12} className="mr-2" /> Sensitivity
                    </span>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{sensitivity}</span>
                  </div>
                  <input
                    type="range"
                    value={sensitivity}
                    min={50}
                    max={250}
                    step={1}
                    onChange={(e) => setSensitivity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="mt-2 text-[9px] text-slate-400 font-medium leading-relaxed italic">
                    Adjust until the background disappears and only the ink is visible.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zoom</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-slate-100">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !cleanPreview}
                  className="w-full flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Finalizing Signature...' : <><Check size={18} className="mr-2" /> Verify & Save Signature</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureManager;
