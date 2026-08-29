'use client';

import React, { useState } from 'react';
import '../../app/tools_styles/ImageOptimizer.scss';
import { FaDownload, FaImage, FaCog, FaSync } from 'react-icons/fa';

const RESIZE_PRESETS = [
  { label: 'Original', width: null, height: null },
  { label: 'Avatar (128x128)', width: 128, height: 128 },
  { label: 'Thumbnail (640x360)', width: 640, height: 360 },
  { label: 'Banner (1200x630)', width: 1200, height: 630 },
];

const ImageOptimizer = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedImage, setOptimizedImage] = useState(null);
  const [optimizedSize, setOptimizedSize] = useState(0);

  const [fileFormat, setFileFormat] = useState('webp');
  const [quality, setQuality] = useState(0.8);
  const [selectedPreset, setSelectedPreset] = useState(RESIZE_PRESETS[0]);

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
        setError('Please upload a valid image file.');
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

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = originalImage;

      img.onload = () => {
        const targetWidth = selectedPreset.width || img.width;
        const targetHeight = selectedPreset.height || img.height;

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType = fileFormat === 'jpg' ? 'image/jpeg' : `image/${fileFormat}`;
        const optimizedDataUrl = canvas.toDataURL(mimeType, parseFloat(quality));

        const base64str = optimizedDataUrl.split('base64,')[1];
        const decoded = atob(base64str);
        setOptimizedSize(decoded.length);

        setOptimizedImage(optimizedDataUrl);
        clearInterval(interval);
        setProgress(100);
      };

      img.onerror = () => {
        clearInterval(interval);
        setError('Failed to process image.');
        setProgress(0);
      };
    }, 400);
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
        <div className="upload-box">
          <label className="w-full flex flex-col items-center justify-center cursor-pointer">
            <FaImage className="upload-icon" />
            <span className="upload-title">Drop your image here or click to browse</span>
            <span className="upload-subtitle">Supports PNG, JPG, WEBP formats</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {originalImage && (
          <div className="controls-panel">
            <h3 className="panel-title">
              <FaCog /> Optimization Settings
            </h3>

            <div className="control-group">
              <span className="control-label">Convert Output To:</span>
              <div className="format-pills">
                {['webp', 'jpeg', 'png'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={fileFormat === fmt ? 'active' : ''}
                    onClick={() => setFileFormat(fmt)}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Dimension Preset:</span>
              <div className="preset-grid">
                {RESIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={selectedPreset.label === preset.label ? 'active' : ''}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Quality (Compression):</span>
                <span>{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="range-slider"
                disabled={fileFormat === 'png'}
              />
              {fileFormat === 'png' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  PNG uses lossless compression (slider not applicable).
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={optimizeImage}
              className="optimize-btn"
              disabled={progress > 0 && progress < 100}
              suppressHydrationWarning
            >
              {progress > 0 && progress < 100 ? (
                <><FaSync className="animate-spin" /> Optimizing {progress}%</>
              ) : (
                'Optimize & Convert Image'
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Outputs ────────────────────────────── */}
      <div className="tool-outputs-pane">
        {error && (
          <div className="alert-error">
            ⚠️ {error}
          </div>
        )}

        {!originalImage && (
          <div className="empty-preview">
            <span className="empty-icon">🖼️</span>
            <p>Image preview &amp; results will appear here</p>
            <small>Upload an image on the left to get started</small>
          </div>
        )}

        {originalImage && (
          <div className="comparison-stack">
            {/* Original Box */}
            <div className="image-card">
              <div className="card-header">
                <h4>Original Source</h4>
                <span className="size-badge">
                  {formatBytes(originalSize)}
                </span>
              </div>
              <div className="preview-frame">
                <img
                  src={originalImage}
                  alt="Original"
                />
              </div>
            </div>

            {/* Results Box */}
            {optimizedImage && (
              <div className="image-card optimized-card">
                <div className="card-header">
                  <h4>Optimized Result</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="savings-badge">
                      -{calculateSavings()}% Smaller
                    </span>
                    <span className="size-badge">
                      {formatBytes(optimizedSize)}
                    </span>
                  </div>
                </div>

                <div className="preview-frame">
                  <img
                    src={optimizedImage}
                    alt="Optimized"
                  />
                </div>

                <button
                  type="button"
                  onClick={downloadImage}
                  className="download-btn"
                  suppressHydrationWarning
                >
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