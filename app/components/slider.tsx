import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

type Image = {
  url: string;
  alt?: string;
};

type SliderProps = {
  images: Image[];
  autoPlay?: boolean;
  interval?: number;
};

export function Slider({
  images,
  autoPlay = false,
  interval = 5000,
}: SliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (autoPlay && !isPaused) {
      const timer = setInterval(nextSlide, interval);
      return () => clearInterval(timer);
    }
  }, [autoPlay, interval, isPaused, currentSlide, nextSlide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        prevSlide();
        break;
      case "ArrowRight":
        nextSlide();
        break;
      default:
        break;
    }
  };

  if (images.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      role="presentation"
      aria-roledescription="carousel"
    >
      {/* Slides container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        role="list"
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="w-full max-h-[400px] aspect-auto flex-shrink-0 relative"
            role="listitem"
            aria-label={`Slide ${index + 1} of ${images.length}`}
            aria-current={currentSlide === index}
          >
            <img
              src={image.url}
              alt={image.alt || `Slide ${index + 1}`}
              className="w-auto h-auto object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              decoding={index === 0 ? "auto" : "async"}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}

      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 rounded-full bg-black/50 backdrop-blur p-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentSlide === index
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
