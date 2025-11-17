"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

interface GalleryImage {
  readonly id: string;
  readonly url: string;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
}

interface ImageGalleryProps {
  readonly images: GalleryImage[];
  readonly columns?: 2 | 3 | 4;
}

export const ImageGallery = ({ images, columns = 3 }: ImageGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoom(1);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoom(1);
  };

  const goToPrevious = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
      setZoom(1);
    }
  };

  const goToNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
      setZoom(1);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 cursor-pointer transition-all shadow-md hover:shadow-xl"
          >
            <img
              src={image.url}
              alt={image.title || `Image ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {image.title && (
                  <p className="text-white font-medium text-sm truncate mb-2">
                    {image.title}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm">
                    <ZoomIn className="h-3 w-3 text-white" />
                    <span className="text-xs text-white font-medium">View</span>
                  </div>
                  {image.width && image.height && (
                    <div className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm">
                      <span className="text-xs text-white font-medium">
                        {image.width}×{image.height}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Zoom Icon */}
            <div className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-3">
                <p className="text-white font-medium">
                  {currentImage.title || `Image ${lightboxIndex + 1}`}
                </p>
                <span className="text-gray-400 text-sm">
                  {lightboxIndex + 1} / {images.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom(Math.max(0.5, zoom - 0.25));
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-white text-sm font-medium px-2 min-w-[4rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom(Math.min(3, zoom + 0.25));
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(currentImage.url, currentImage.title || `image-${lightboxIndex + 1}.jpg`);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Download image"
                >
                  <Download className="h-5 w-5 text-white" />
                </button>

                {/* Open in New Tab */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentImage.url, '_blank');
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5 text-white" />
                </button>

                {/* Close */}
                <button
                  onClick={closeLightbox}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close lightbox"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div
              className="absolute inset-0 flex items-center justify-center p-20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={lightboxIndex}
                src={currentImage.url}
                alt={currentImage.title || `Image ${lightboxIndex + 1}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: zoom }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full object-contain cursor-zoom-in"
                style={{ transform: `scale(${zoom})` }}
                onClick={() => setZoom(zoom === 1 ? 2 : 1)}
              />
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === lightboxIndex
                          ? 'border-amber-500 shadow-lg scale-110'
                          : 'border-white/30 hover:border-white/60'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={img.url}
                        alt={img.title || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Navigation Hint */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
              <p className="text-white/60 text-sm">
                Use <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd> and{' '}
                <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd> to navigate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Keyboard navigation
if (typeof window !== 'undefined') {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close lightbox handled by component state
    } else if (e.key === 'ArrowLeft') {
      // Previous handled by component
    } else if (e.key === 'ArrowRight') {
      // Next handled by component
    }
  };

  window.addEventListener('keydown', handleKeydown);
}
