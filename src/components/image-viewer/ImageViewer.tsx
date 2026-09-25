import React, { useState, useEffect, useCallback } from 'react';
import { ImageRegionDefinition } from '../../types';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  Presentation,
  BookOpen,
} from 'lucide-react';

interface ImageViewerProps {
  imageRegion: ImageRegionDefinition | null;
  allPageRegions?: ImageRegionDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onSelectRegion?: (region: ImageRegionDefinition) => void;
  initialPresentationMode?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageRegion,
  allPageRegions = [],
  isOpen,
  onClose,
  onSelectRegion,
  initialPresentationMode = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isPresented, setIsPresented] = useState<boolean>(initialPresentationMode);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  // Reset zoom whenever imageRegion changes
  useEffect(() => {
    setZoomLevel(1.0);
    setIsPresented(initialPresentationMode);
  }, [imageRegion, initialPresentationMode]);

  // Keyboard navigation & dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isPresented) {
          setIsPresented(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft' && allPageRegions.length > 1 && onSelectRegion) {
        e.preventDefault();
        const currentIndex = allPageRegions.findIndex((r) => r.id === imageRegion?.id);
        const prevIndex = (currentIndex - 1 + allPageRegions.length) % allPageRegions.length;
        onSelectRegion(allPageRegions[prevIndex]);
      } else if (e.key === 'ArrowRight' && allPageRegions.length > 1 && onSelectRegion) {
        e.preventDefault();
        const currentIndex = allPageRegions.findIndex((r) => r.id === imageRegion?.id);
        const nextIndex = (currentIndex + 1) % allPageRegions.length;
        onSelectRegion(allPageRegions[nextIndex]);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(3.0, z + 0.25));
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(0.5, z - 0.25));
      } else if (e.key === '0') {
        setZoomLevel(1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPresented, onClose, allPageRegions, imageRegion, onSelectRegion]);

  // Pronunciation audio
  const handleSpeak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en-US')) || null;
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsBrowserFullscreen(false);
    }
  };

  if (!isOpen || !imageRegion) return null;

  const vocab = imageRegion.vocabulary;
  const currentIndex = allPageRegions.findIndex((r) => r.id === imageRegion.id);
  const hasMultiple = allPageRegions.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={imageRegion.title}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-white select-none animate-in fade-in duration-200"
    >
      {/* Top Controls Bar */}
      <header
        className={`px-4 py-3 flex items-center justify-between border-b border-slate-800 transition-all ${
          isPresented ? 'bg-black/60 py-2' : 'bg-slate-900/90'
        }`}
      >
        {/* Title and metadata */}
        <div className="flex items-center gap-3 truncate max-w-xl">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {imageRegion.title}
            </h2>
            {imageRegion.vocabularyTag && (
              <span className="text-[11px] font-semibold text-sky-400">
                {imageRegion.vocabularyTag}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom out (-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300 min-w-[48px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom in (+)"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border-l border-slate-700 ml-1"
              title="Reset Zoom (0)"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Teacher Presentation Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsPresented(!isPresented)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
              isPresented
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title="Classroom Projector Presentation Mode"
          >
            <Presentation className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isPresented ? 'Exit Presentation' : 'Present Image'}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors hidden sm:block"
            title="Toggle Fullscreen (F11)"
            aria-label="Toggle fullscreen"
          >
            {isBrowserFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-1"
            title="Close Viewer (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 relative flex items-center justify-center overflow-auto p-4 sm:p-8">
        {/* Previous Image Button */}
        {hasMultiple && onSelectRegion && (
          <button
            type="button"
            onClick={() => {
              const prevIndex =
                (currentIndex - 1 + allPageRegions.length) % allPageRegions.length;
              onSelectRegion(allPageRegions[prevIndex]);
            }}
            className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl transition-all transform hover:scale-105"
            title="Previous image (Left Arrow)"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Central Display Image */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageRegion.imageSource}
            alt={imageRegion.title}
            className="max-h-[75vh] max-w-[88vw] object-contain rounded-xl shadow-2xl border border-slate-800"
          />
        </div>

        {/* Next Image Button */}
        {hasMultiple && onSelectRegion && (
          <button
            type="button"
            onClick={() => {
              const nextIndex = (currentIndex + 1) % allPageRegions.length;
              onSelectRegion(allPageRegions[nextIndex]);
            }}
            className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl transition-all transform hover:scale-105"
            title="Next image (Right Arrow)"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </main>

      {/* Bottom Information / Vocabulary Card */}
      <footer
        className={`px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-800 transition-all ${
          isPresented ? 'bg-black/80' : 'bg-slate-900/90'
        }`}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            {vocab ? (
              <div className="flex flex-wrap items-baseline gap-3 mb-1">
                <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {vocab.word}
                </span>
                {vocab.phonetic && (
                  <span className="text-sm font-mono text-sky-400">{vocab.phonetic}</span>
                )}
                {vocab.partOfSpeech && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {vocab.partOfSpeech}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSpeak(vocab.word)}
                  className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sky-500/30 cursor-pointer"
                  title="Listen to pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Pronounce</span>
                </button>
              </div>
            ) : (
              <h3 className="text-base font-bold text-white mb-0.5">{imageRegion.title}</h3>
            )}

            {vocab?.definition && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {vocab.definition}
              </p>
            )}

            {vocab?.exampleSentence && (
              <p className="text-xs text-sky-300 italic mt-1 leading-relaxed">
                "{vocab.exampleSentence}"
              </p>
            )}

            {imageRegion.caption && !vocab?.definition && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {imageRegion.caption}
              </p>
            )}
          </div>

          {hasMultiple && (
            <div className="text-xs font-mono text-slate-400 self-end sm:self-center">
              {currentIndex + 1} / {allPageRegions.length}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
