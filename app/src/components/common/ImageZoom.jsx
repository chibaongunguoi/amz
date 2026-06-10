import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CloseOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  RotateRightOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';
import OptimizedImage from './OptimizedImage';

const ImageZoom = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  images = null, // Array of all images for gallery mode
  currentIndex = 0, // Current image index
  onIndexChange = null // Callback when index changes
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitMode, setFitMode] = useState('contain'); // 'contain' or 'actual'
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const lastTouchDistance = useRef(0);
  
  // Gallery mode: use images array if provided, otherwise single image
  const imageList = images && Array.isArray(images) && images.length > 0 ? images : [src];
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const currentImageSrc = imageList[currentImageIndex] || src;
  const hasMultipleImages = imageList.length > 1;

  const enterFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) return;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFitMode('contain');
    setCurrentImageIndex(currentIndex);
    document.body.style.overflow = 'hidden';
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFitMode('contain');
    setIsFullscreen(false);
    exitFullscreen();
    document.body.style.overflow = '';
  }, [exitFullscreen]);

  const handlePrevImage = useCallback(() => {
    if (!hasMultipleImages) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : imageList.length - 1;
    setCurrentImageIndex(newIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    if (onIndexChange) onIndexChange(newIndex);
  }, [currentImageIndex, hasMultipleImages, imageList.length, onIndexChange]);

  const handleNextImage = useCallback(() => {
    if (!hasMultipleImages) return;
    const newIndex = currentImageIndex < imageList.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    if (onIndexChange) onIndexChange(newIndex);
  }, [currentImageIndex, hasMultipleImages, imageList.length, onIndexChange]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(currentImageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [currentImageIndex, currentImageSrc]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const toggleFitMode = () => {
    setFitMode(prev => prev === 'contain' ? 'actual' : 'contain');
    if (fitMode === 'contain') {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y
        });
      }
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / lastTouchDistance.current;
      const newScale = Math.max(1, Math.min(scale * scaleChange, 5));
      setScale(newScale);
      lastTouchDistance.current = distance;
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  };

  const handleWheel = useCallback((e) => {
    if (!isOpen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(1, Math.min(scale + delta, 5));
    setScale(newScale);
    
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, scale]);

  // Sync currentImageIndex with currentIndex prop
  useEffect(() => {
    setCurrentImageIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
          handlePrevImage();
        } else if (e.key === 'ArrowRight' && hasMultipleImages) {
          handleNextImage();
        } else if (e.key === 'f' || e.key === 'F') {
          toggleFullscreen();
        } else if (e.key === 'r' || e.key === 'R') {
          handleRotate();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, hasMultipleImages, handleClose, handlePrevImage, handleNextImage, toggleFullscreen, handleRotate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const container = containerRef.current;
      container?.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container?.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen, handleWheel]);

  return (
    <>
      <OptimizedImage
        src={src}
        alt={alt}
        width={800}
        height={800}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`${className} cursor-zoom-in`}
        style={style}
        onClick={handleOpen}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />

      {isOpen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={(e) => {
            if (e.target === containerRef.current) {
              handleClose();
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar - Close, Counter, Actions */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            {/* Left: Image Counter */}
            {hasMultipleImages && (
              <div className="bg-white/10 backdrop-blur-md text-white rounded-full px-4 py-2 text-sm font-medium">
                {currentImageIndex + 1} / {imageList.length}
              </div>
            )}

            {/* Center: Product Name (if available) */}
            <div className="flex-1 text-center">
              {alt && (
                <div className="bg-white/10 backdrop-blur-md text-white rounded-full px-4 py-2 text-sm max-w-md mx-auto truncate">
                  {alt}
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                aria-label="Tải xuống"
                title="Tải xuống (D)"
              >
                <DownloadOutlined className="text-xl" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                aria-label="Toàn màn hình"
                title="Toàn màn hình (F)"
              >
                {isFullscreen ? (
                  <FullscreenExitOutlined className="text-xl" />
                ) : (
                  <FullscreenOutlined className="text-xl" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                aria-label="Đóng"
                title="Đóng (ESC)"
              >
                <CloseOutlined className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Left Side Controls */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            {/* Navigation */}
            {hasMultipleImages && (
              <button
                onClick={handlePrevImage}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                aria-label="Ảnh trước"
                title="Ảnh trước (←)"
              >
                <LeftOutlined className="text-xl" />
              </button>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            {/* Navigation */}
            {hasMultipleImages && (
              <button
                onClick={handleNextImage}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                aria-label="Ảnh tiếp"
                title="Ảnh tiếp (→)"
              >
                <RightOutlined className="text-xl" />
              </button>
            )}
          </div>

          {/* Bottom Left: Zoom Controls */}
          <div className="absolute bottom-20 left-4 z-10 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 5}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Phóng to"
              title="Phóng to"
            >
              <ZoomInOutlined className="text-xl" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Thu nhỏ"
              title="Thu nhỏ"
            >
              <ZoomOutOutlined className="text-xl" />
            </button>
            <button
              onClick={handleRotate}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Xoay ảnh"
              title="Xoay ảnh (R)"
            >
              <RotateRightOutlined className="text-xl" />
            </button>
            <button
              onClick={toggleFitMode}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
              aria-label="Điều chỉnh kích thước"
              title="Điều chỉnh kích thước"
            >
              {fitMode === 'contain' ? (
                <ExpandOutlined className="text-xl" />
              ) : (
                <CompressOutlined className="text-xl" />
              )}
            </button>
            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-110"
                aria-label="Đặt lại"
                title="Đặt lại zoom"
              >
                Reset
              </button>
            )}
          </div>

          {/* Zoom Indicator */}
          {scale > 1 && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md text-white rounded-full px-4 py-2 text-sm font-medium">
              {Math.round(scale * 100)}%
            </div>
          )}

          {/* Image Container */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden w-full"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={(e) => e.stopPropagation()}
          >
            <OptimizedImage
              ref={imageRef}
              src={currentImageSrc}
              alt={alt}
              width={1600}
              height={1200}
              sizes="90vw"
              className={`select-none transition-transform duration-300 ${
                fitMode === 'actual' ? 'max-w-none max-h-none' : 'max-w-[90vw] max-h-[75vh]'
              } object-contain`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                touchAction: 'none',
                userSelect: 'none',
              }}
              draggable={false}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Thumbnail Strip */}
          {hasMultipleImages && imageList.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div className="flex gap-2 justify-center overflow-x-auto max-w-full pb-2 thumbnail-scroll" style={{ scrollbarWidth: 'thin' }}>
                <style>{`
                  .thumbnail-scroll::-webkit-scrollbar {
                    height: 6px;
                  }
                  .thumbnail-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                  }
                  .thumbnail-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 3px;
                  }
                  .thumbnail-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.6);
                  }
                `}</style>
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                      setRotation(0);
                      if (onIndexChange) onIndexChange(idx);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      currentImageIndex === idx
                        ? 'border-orange-500 shadow-lg scale-110 ring-2 ring-orange-300'
                        : 'border-white/30 hover:border-white/60 hover:scale-105'
                    }`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md text-white rounded-full px-4 py-2 text-xs text-center">
              {scale > 1 ? (
                <span>Kéo để di chuyển • Scroll để zoom • ESC để đóng</span>
              ) : (
                <span>Scroll để zoom • F: Fullscreen • R: Xoay • D: Tải xuống</span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageZoom;
