import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroImageCarouselProps {
  images: string[];
}

export default function HeroImageCarousel({ images }: HeroImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);

  useEffect(() => {
    // Show images with staggered fade-in
    images.forEach((_, index) => {
      const timer = setTimeout(() => {
        setDisplayedImages(prev => [...prev, images[index]]);
      }, index * 800);
      return () => clearTimeout(timer);
    });
  }, [images]);

  useEffect(() => {
    if (images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  if (images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Image carousel with fade-in animations */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{
              opacity: index === currentIndex ? 1 : 0,
              scale: index === currentIndex ? 1 : 0.95
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={image}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/photos/building.jpg';
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Image thumbnails with fade-in step by step */}
      <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center gap-3 px-4">
        {images.map((image, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.6 }}
            onClick={() => setCurrentIndex(index)}
            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
              index === currentIndex
                ? 'border-white shadow-lg shadow-white/50'
                : 'border-white/40 opacity-60 hover:opacity-80'
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/photos/building.jpg';
              }}
            />
          </motion.button>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-all duration-300"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-all duration-300"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
        {images.map((_, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
