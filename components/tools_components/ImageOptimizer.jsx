"use client";
import React, { useState } from 'react';
import '../../app/tools_styles/ImageOptimizer.scss';
import { FaDownload, FaImage, FaCog } from 'react-icons/fa';

const ImageOptimizer = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedImage, setOptimizedImage] = useState(null);
  const [optimizedSize, setOptimizedSize] = useState(0);
  
  const [fileFormat, setFileFormat] = useState('webp');
  const [quality, setQuality] = useState(0.8);
  
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
      }
      setOriginalSize(file.size);
      setOriginalImage(URL.createObjectURL(file));
      setOptimizedImage(null);
      setProgress(0);
      setError('');
    }
  };

  const optimizeImage = async () => {
    if (!originalImage) return;

    setProgress(0);
    setOptimizedImage(null);

    // Simulate progress bar 
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    // Perform actual canvas conversion
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = originalImage;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert to selected format with quality
        const mimeType = fileFormat === 'jpg' ? 'image/jpeg' : `image/${fileFormat}`;
        const optimizedDataUrl = canvas.toDataURL(mimeType, parseFloat(quality));
        
        // Estimate new size based on base64 length (approximate)
        const base64str = optimizedDataUrl.split('base64,')[1];
        const decoded = atob(base64str);
        setOptimizedSize(decoded.length);

        setOptimizedImage(optimizedDataUrl);
        clearInterval(interval);
        setProgress(100);
      };
      
      img.onerror = () => {
          clearInterval(interval);
          setError("Failed to process image.");
          setProgress(0);
      }
    }, 600);
  };

  const downloadImage = () => {
    if (!optimizedImage) return;
    const link = document.createElement('a');
    link.href = optimizedImage;
    link.download = `optimized_image.${fileFormat}`;
    link.click();
  };

  const calculateSavings = () => {
      if (!originalSize || !optimizedSize) return 0;
      const saving = ((originalSize - optimizedSize) / originalSize) * 100;
      return saving > 0 ? saving.toFixed(1) : 0;
  };

  return (
    <div className="image-optimizer">
      {/* ── LEFT: Inputs ──────────────────────────────── */}
      <div className="tool-inputs-pane">
        
        {/* Upload Area */}
        <div className="upload-section mb-6">
          <label className="upload-label flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors text-center">
            <FaImage className="text-4xl text-indigo-400 mb-3" />
            <span className="text-indigo-700 font-medium">Drop your image here or click to browse</span>
            <span className="text-indigo-400 text-xs mt-1">Supports PNG, JPG, WEBP</span>
            <input className="hidden" type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {originalImage && (
          <div className="optimizer-controls bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                <FaCog className="text-gray-400" /> Optimization Settings
            </h3>
            
            <div className="form-group mb-5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Convert Output To:</label>
                <div className="format-selection flex gap-3">
                {['webp', 'jpeg', 'png'].map(fmt => (
                    <label key={fmt} className={`flex-1 text-center py-2 px-3 rounded border cursor-pointer transition-colors ${fileFormat === fmt ? 'bg-indigo-600 border-indigo-600 text-white font-medium shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" className="hidden" value={fmt} checked={fileFormat === fmt} onChange={() => setFileFormat(fmt)} />
                    {fmt.toUpperCase()}
                    </label>
                ))}
                </div>
            </div>

            <div className="form-group mb-6">
                <div className="flex justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quality (Compress):</label>
                    <span className="text-xs font-bold text-indigo-600">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                    type="range" min="0.1" max="1.0" step="0.1" 
                    value={quality} 
                    onChange={(e) => setQuality(parseFloat(e.target.value))} 
                    className="w-full accent-indigo-600"
                    disabled={fileFormat === 'png'} // PNG does not support lossy quality via canvas API simply
                />
                {fileFormat === 'png' && <p className="text-xs text-gray-400 mt-1">Quality slider not applicable for PNG format.</p>}
            </div>
            
            <button onClick={optimizeImage} className="primary-btn w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2">
              {progress > 0 && progress < 100 ? (
                  <><FaSync className="animate-spin" /> Optimizing {progress}%</>
              ) : 'Optimize & Convert'}
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Outputs ────────────────────────────── */}
      <div className="tool-outputs-pane">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium">⚠️ {error}</div>}

        {!originalImage && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-gray-400 h-full">
                <span className="text-3xl mb-3">🖼️</span>
                <p className="text-sm font-medium">Image preview & results will appear here</p>
                <p className="text-xs text-gray-300 mt-1">Upload an image to get started</p>
            </div>
        )}

        {originalImage && (
          <div className="image-comparison flex flex-col gap-6">
            
            {/* Original Box */}
            <div className="original-image bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Original Source</h3>
                <span className="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{formatBytes(originalSize)}</span>
              </div>
              <div className="img-wrapper max-h-[300px] bg-checkerboard rounded border border-gray-300 flex items-center justify-center overflow-hidden">
                <img src={originalImage} alt="Original" className="max-h-[300px] object-contain max-w-full" style={{ backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%)', backgroundSize: '20px 20px' }} />
              </div>
            </div>

            {/* Results Box */}
            {optimizedImage && (
              <div className="optimized-image bg-indigo-50 border border-indigo-200 rounded-xl p-3 shadow-inner">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Optimized File</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">-{calculateSavings()}% Smaller</span>
                        <span className="text-xs font-mono bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">{formatBytes(optimizedSize)}</span>
                    </div>
                </div>
                
                <div className="img-wrapper max-h-[300px] bg-checkerboard rounded border border-indigo-300 flex items-center justify-center overflow-hidden mb-3">
                  <img src={optimizedImage} alt="Optimized" className="max-h-[300px] object-contain max-w-full" style={{ backgroundImage: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%)', backgroundSize: '20px 20px' }} />
                </div>
                
                <button onClick={downloadImage} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2">
                    <FaDownload /> Download {fileFormat.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageOptimizer;