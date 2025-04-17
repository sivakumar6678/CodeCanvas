import React, { useState } from 'react';
import '../styles/tools_styles/ImageOptimizer.scss';

const ImageOptimizer = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [optimizedImage, setOptimizedImage] = useState(null);
  const [fileFormat, setFileFormat] = useState('webp');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalImage(URL.createObjectURL(file));
      setError('');
    }
  };

  const optimizeImage = async () => {
    if (!originalImage) return;

    setProgress(0);
    setOptimizedImage(null);

    // Simulate image optimization process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Simulate optimization delay
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = originalImage;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert to selected format
        const optimizedDataUrl = canvas.toDataURL(`image/${fileFormat}`, 0.7);
        setOptimizedImage(optimizedDataUrl);
        setProgress(100);
      };
    }, 1000);
  };

  const downloadImage = () => {
    if (!optimizedImage) return;

    const link = document.createElement('a');
    link.href = optimizedImage;
    link.download = `optimized_image.${fileFormat}`;
    link.click();
  };

  return (
    <div className="image-optimizer">
      <h1>Image Optimizer</h1>
      <input className ="file-input" type="file" accept="image/*" onChange={handleImageUpload} />
      <div className="format-selection">
        <label>
          <input
            type="radio"
            value="webp"
            checked={fileFormat === 'webp'}
            onChange={() => setFileFormat('webp')}
          />
          WebP
        </label>
        <label>
          <input
            type="radio"
            value="jpeg"
            checked={fileFormat === 'jpeg'}
            onChange={() => setFileFormat('jpeg')}
          />
          JPEG
        </label>
        <label>
          <input
            type="radio"
            value="png"
            checked={fileFormat === 'png'}
            onChange={() => setFileFormat('png')}
          />
          PNG
        </label>
      </div>
      <button onClick={optimizeImage}>Optimize Image</button>
      {progress > 0 && <div className="progress-bar" style={{ width: `${progress}%` }} />}
      {optimizedImage && (
        <div className="image-comparison">
          <div className="original-image">
            <h2>Original Image</h2>
            <img src={originalImage} alt="Original" />
          </div>
          <div className="optimized-image">
            <h2>Optimized Image</h2>
            <img src={optimizedImage} alt="Optimized" />
            <button onClick={downloadImage}>Download Optimized Image</button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ImageOptimizer;