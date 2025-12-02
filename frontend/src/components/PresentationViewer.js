import React, { useState, useEffect } from 'react';
import { Presentation, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

function ImagePlaceholder() {
  return (
    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center rounded-lg">
      <ImageIcon className="w-16 h-16 text-gray-400" />
    </div>
  );
}

function SlideImage({ src, alt }) {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  if (!src) {
    return <ImagePlaceholder />;
  }

  return (
    <div className="w-full max-h-64 flex items-center justify-center">
      {loading && !error && (
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center rounded-lg">
          <ImageIcon className="w-16 h-16 text-gray-400" />
        </div>
      )}
      {error && (
        <div className="w-full h-48 bg-red-50 border border-red-200 flex flex-col items-center justify-center rounded-lg">
          <ImageIcon className="w-16 h-16 text-red-400 mb-2" />
          <p className="text-red-600 text-sm">Failed to load image</p>
        </div>
      )}
      <img
        key={src}
        src={src}
        alt={alt}
        className={`max-w-full max-h-64 object-contain rounded-lg animate-fade-in ${loading || error ? 'hidden' : ''}`}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          console.error('Image load error:', src, e);
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}

function TitleSlide({ slide, image }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 h-full flex flex-col justify-center">
      <div className="text-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{slide.title}</h2>
        {slide.content && (
          <p className="text-lg md:text-xl text-gray-600">{slide.content}</p>
        )}
      </div>
      {image && <SlideImage src={image} alt={slide.title} />}
    </div>
  );
}

function SectionSlide({ slide, image }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 h-full flex flex-col justify-center">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">{slide.title}</h2>
      {image && <SlideImage src={image} alt={slide.title} />}
    </div>
  );
}

function ContentSlide({ slide, image }) {
  const content = Array.isArray(slide.content) ? slide.content : [slide.content];
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{slide.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
        <div className="overflow-y-auto">
          <ul className="space-y-2">
            {content.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
                <span className="text-gray-700 text-sm md:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {image && (
          <div className="flex items-center justify-center">
            <SlideImage src={image} alt={slide.title} />
          </div>
        )}
      </div>
    </div>
  );
}

function ChartSlide({ slide, image }) {
  const chartData = slide.chart_data || {};
  const categories = chartData.categories || [];
  const values = chartData.values || [];
  const maxValue = Math.max(...values, 1);
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{slide.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
        <div className="overflow-y-auto">
          {chartData.title && (
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">{chartData.title}</h3>
          )}
          <div className="space-y-2">
            {categories.map((category, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-700">{category}</span>
                  <span className="text-gray-900 font-semibold">{values[idx]}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(values[idx] / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {image && (
          <div className="flex items-center justify-center">
            <SlideImage src={image} alt={slide.title} />
          </div>
        )}
      </div>
    </div>
  );
}

function ClosingSlide({ slide, image }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 h-full flex flex-col justify-center">
      <div className="text-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{slide.title}</h2>
        {slide.content && (
          <p className="text-lg md:text-xl text-gray-600">{slide.content}</p>
        )}
      </div>
      {image && <SlideImage src={image} alt={slide.title} />}
    </div>
  );
}

function PresentationViewer({ presentation, images, isProcessing = false }) {
  const [viewMode, setViewMode] = useState('slideshow'); // Default to slideshow mode
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = presentation?.slides || [];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'scroll' ? 'slideshow' : 'scroll');
    setCurrentSlide(0);
  };

  // Keyboard navigation - MUST be before early return
  useEffect(() => {
    if (viewMode !== 'slideshow') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        setViewMode('scroll');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentSlide]);

  // Early return AFTER all hooks
  if (!presentation) return null;

  return (
    <div>
      {/* Presentation Header */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 ${isProcessing ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Presentation className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-gray-900">{presentation.title}</h1>
          </div>
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            {viewMode === 'scroll' ? (
              <>
                <Maximize2 className="w-4 h-4" />
                Slideshow Mode
              </>
            ) : (
              <>
                <Minimize2 className="w-4 h-4" />
                Scroll Mode
              </>
            )}
          </button>
        </div>
        {presentation.subtitle && (
          <p className="text-lg text-gray-600 mb-3">{presentation.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>Version {presentation.version}</span>
          <span>•</span>
          <span>{slides.length} slides</span>
          {presentation.topic && (
            <>
              <span>•</span>
              <span>Topic: {presentation.topic}</span>
            </>
          )}
        </div>
      </div>

      {/* Slideshow Mode */}
      {viewMode === 'slideshow' ? (
        <div className="relative pb-8">
          {/* Current Slide */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full flex items-center justify-center p-8">
              {(() => {
                const slide = slides[currentSlide];
                const imageKey = `slide_${currentSlide}`;
                const image = images[imageKey];
                const slideType = slide?.type || 'content';

                return (
                  <div className="w-full h-full">
                    {slideType === 'title' && <TitleSlide slide={slide} image={image} />}
                    {slideType === 'section' && <SectionSlide slide={slide} image={image} />}
                    {slideType === 'content' && <ContentSlide slide={slide} image={image} />}
                    {slideType === 'chart' && <ChartSlide slide={slide} image={image} />}
                    {slideType === 'closing' && <ClosingSlide slide={slide} image={image} />}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {currentSlide + 1} / {slides.length}
              </span>
              {/* Slide thumbnails */}
              <div className="flex gap-1 ml-4">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentSlide ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-sm text-gray-500 mt-2">
            Use arrow keys to navigate slides
          </p>
        </div>
      ) : (
        /* Scroll Mode - All Slides */
        <div className="space-y-6">
          {slides.map((slide, index) => {
            const imageKey = `slide_${index}`;
            const image = images[imageKey];
            const slideType = slide.type || 'content';

            return (
              <div key={index} className="relative">
                {/* Slide number badge */}
                <div className="absolute -left-4 top-4 bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
                  {index + 1}
                </div>

                {/* Slide content based on type */}
                {slideType === 'title' && <TitleSlide slide={slide} image={image} />}
                {slideType === 'section' && <SectionSlide slide={slide} image={image} />}
                {slideType === 'content' && <ContentSlide slide={slide} image={image} />}
                {slideType === 'chart' && <ChartSlide slide={slide} image={image} />}
                {slideType === 'closing' && <ClosingSlide slide={slide} image={image} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <span className="text-gray-700 font-medium">Updating presentation...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PresentationViewer;
