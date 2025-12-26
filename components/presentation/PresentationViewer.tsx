"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SlideType = "title" | "content" | "section" | "image" | "quote" | "split";

export interface Slide {
  id: string;
  type: SlideType;
  title?: string;
  subtitle?: string;
  content?: string[]; // Bullet points or paragraphs
  image?: string;
  quote?: string;
  author?: string;
  notes?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface Presentation {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
}

interface PresentationViewerProps {
  presentation: Presentation;
  onExit?: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  presentation,
  onExit,
}) => {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();

  const currentSlide = presentation.slides[currentSlideIdx];
  const totalSlides = presentation.slides.length;

  const nextSlide = useCallback(() => {
    if (currentSlideIdx < totalSlides - 1) {
      setCurrentSlideIdx((prev) => prev + 1);
    }
  }, [currentSlideIdx, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlideIdx > 0) {
      setCurrentSlideIdx((prev) => prev - 1);
    }
  }, [currentSlideIdx]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "Escape") {
        if (isFullscreen) toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, isFullscreen]);

  // Slide renderers based on type
  const renderSlideContent = (slide: Slide) => {
    switch (slide.type) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold mb-6 text-primary"
            >
              {slide.title}
            </motion.h1>
            {slide.subtitle && (
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl text-muted-foreground"
              >
                {slide.subtitle}
              </motion.h2>
            )}
             {slide.content && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-xl max-w-2xl"
              >
                {slide.content.map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </motion.div>
            )}
          </div>
        );

      case "section":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center bg-primary text-primary-foreground p-12">
            <motion.h2 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold"
            >
              {slide.title}
            </motion.h2>
            {slide.subtitle && (
              <p className="mt-4 text-2xl opacity-80">{slide.subtitle}</p>
            )}
          </div>
        );

      case "split":
        return (
           <div className="grid grid-cols-2 h-full gap-8 p-12 items-center">
            <div className="flex flex-col justify-center">
               <h2 className="text-4xl font-bold mb-6 text-primary">{slide.title}</h2>
               <div className="space-y-4">
                {slide.content?.map((point, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="mr-2 text-primary">•</span>
                    <span className="text-xl">{point}</span>
                  </motion.div>
                ))}
               </div>
            </div>
            <div className="flex items-center justify-center h-full bg-muted/20 rounded-xl overflow-hidden">
               {slide.image ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={slide.image} alt={slide.title} className="object-cover w-full h-full" />
               ) : (
                 <div className="text-muted-foreground italic">Imagen / Gráfico</div>
               )}
            </div>
           </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center h-full p-20 text-center">
             <motion.blockquote 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-4xl italic font-serif leading-relaxed text-foreground/80 border-l-8 border-primary pl-8"
             >
               &ldquo;{slide.quote}&rdquo;
             </motion.blockquote>
             {slide.author && (
               <motion.cite 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xl font-semibold not-italic"
               >
                 — {slide.author}
               </motion.cite>
             )}
          </div>
        );

      default: // content
        return (
          <div className="flex flex-col h-full p-16">
            <h2 className="text-4xl font-bold mb-8 text-primary border-b pb-4">{slide.title}</h2>
            {slide.subtitle && <h3 className="text-2xl mb-6 text-muted-foreground">{slide.subtitle}</h3>}
            <div className="flex-1 space-y-4 overflow-y-auto">
               {slide.content?.map((point, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-2xl leading-relaxed list-none flex items-start"
                  >
                    {point.startsWith('•') || point.startsWith('-') ? (
                       <span className="mr-3 mt-1">{point}</span>
                    ) : (
                      <>
                        <span className="mr-3 text-primary mt-2 text-sm">●</span>
                        <span>{point}</span>
                      </>
                    )}
                  </motion.li>
                ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "w-full h-screen bg-background text-foreground flex flex-col relative overflow-hidden",
      isFullscreen ? "fixed top-0 left-0 z-50" : "relative"
    )}>
      {/* Controls Header */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onExit ? onExit() : router.back()}>
           <Home size={20} />
        </Button>
      </div>

      {/* Slide Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIdx}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full absolute inset-0"
          >
            {renderSlideContent(currentSlide)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Navigation */}
      <div className="h-16 border-t bg-muted/10 flex items-center justify-between px-6 z-10">
        <div className="text-sm text-muted-foreground">
          {presentation.title} • {currentSlideIdx + 1} / {totalSlides}
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevSlide} disabled={currentSlideIdx === 0}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={nextSlide} disabled={currentSlideIdx === totalSlides - 1}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
};
