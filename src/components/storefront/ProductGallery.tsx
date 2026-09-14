'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  categoryName?: string;
}

export function ProductGallery({ images, productName, categoryName }: ProductGalleryProps) {
  // Pastikan ada minimal 1 gambar
  const validImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'];

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Navigasi ke slide berikutnya
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  // Navigasi ke slide sebelumnya
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Auto-scroll thumbnail container agar thumbnail aktif selalu berada di tengah tampilan
  useEffect(() => {
    const activeThumb = thumbRefs.current[activeIndex];
    if (activeThumb && thumbsContainerRef.current) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  // Touch Swipe Gesture Handlers (Khusus PWA & Mobile Touch)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchDeltaX(0);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isSwiping || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // Jika geseran horizontal lebih dominan daripada vertikal, catat delta
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setTouchDeltaX(diffX);
    }
  };

  const onTouchEnd = () => {
    if (!isSwiping || !touchStart) return;
    const swipeThreshold = 45; // Pixel threshold untuk deteksi swipe

    if (touchDeltaX < -swipeThreshold) {
      // Geser ke kiri -> gambar selanjutnya
      handleNext();
    } else if (touchDeltaX > swipeThreshold) {
      // Geser ke kanan -> gambar sebelumnya
      handlePrev();
    }

    // Reset touch state
    setTouchStart(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  // Scroll manual baris thumbnail ke kiri/kanan jika banyak gambar
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      thumbsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeImage = validImages[activeIndex] || validImages[0];

  return (
    <div className="space-y-3 select-none">
      {/* 1. Main Display Box (Dengan Touch Swipe & Arrow Controls) */}
      <div
        className="group relative aspect-[4/3] sm:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft-sm touch-pan-y cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Gambar Utama dengan Transisi Halus */}
        <div
          key={activeIndex}
          className="relative h-full w-full animate-fadeIn transition-transform duration-200"
          style={{
            transform: isSwiping && touchDeltaX !== 0 ? `translateX(${touchDeltaX * 0.35}px)` : 'none',
          }}
        >
          <Image
            src={activeImage}
            alt={`${productName} - Foto ${activeIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={activeIndex === 0}
            className="object-cover transition-all duration-300"
          />
        </div>

        {/* Badge Kategori (Pojok Kiri Atas) */}
        {categoryName && (
          <span className="absolute top-3.5 left-3.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm pointer-events-none">
            {categoryName}
          </span>
        )}

        {/* Counter Badge Slide (Pojok Kanan Atas ala Shopee/Tokopedia: misal 1/4) */}
        {validImages.length > 1 && (
          <div className="absolute top-3.5 right-3.5 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-mono font-bold text-white backdrop-blur-md shadow-sm pointer-events-none">
            {activeIndex + 1} / {validImages.length}
          </div>
        )}

        {/* Tombol Panah Navigasi Kiri & Kanan (Desktop Hover & Active) */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title="Gambar Sebelumnya (Geser Kanan)"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md shadow-md transition-all hover:scale-110 active:scale-95 opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title="Gambar Selanjutnya (Geser Kiri)"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md shadow-md transition-all hover:scale-110 active:scale-95 opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Petunjuk swipe di mobile (muncul sejenak) */}
        {validImages.length > 1 && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm pointer-events-none">
            Geser untuk foto lain
          </div>
        )}
      </div>

      {/* 2. Thumbnail Cards Row ala Shopee (Di bawah gambar utama) */}
      {validImages.length > 1 && (
        <div className="relative group/thumbs flex items-center">
          {/* Panah Scroll Thumbnails Kiri (Desktop) */}
          {validImages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbnails('left')}
              title="Scroll Thumbnail Kiri"
              className="hidden sm:flex absolute -left-3.5 z-10 h-7 w-7 items-center justify-center rounded-full bg-white border border-surface-200 text-slate-700 shadow-soft-sm hover:bg-slate-50 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Deretan Card-Card Kecil */}
          <div
            ref={thumbsContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-0.5 w-full scroll-smooth"
          >
            {validImages.map((img, idx) => {
              const isActive = activeIndex === idx;
              return (
                <button
                  key={idx}
                  ref={(el) => { thumbRefs.current[idx] = el; }}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  aria-label={`Pilih foto ${idx + 1}`}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? 'border-2 border-emerald-600 ring-2 ring-emerald-500/30 scale-105 shadow-soft-sm opacity-100 z-10'
                      : 'border-2 border-surface-200 bg-surface-100 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {/* Highlight bar di bagian bawah thumbnail aktif ala marketplace */}
                  {isActive && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Panah Scroll Thumbnails Kanan (Desktop) */}
          {validImages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbnails('right')}
              title="Scroll Thumbnail Kanan"
              className="hidden sm:flex absolute -right-3.5 z-10 h-7 w-7 items-center justify-center rounded-full bg-white border border-surface-200 text-slate-700 shadow-soft-sm hover:bg-slate-50 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
