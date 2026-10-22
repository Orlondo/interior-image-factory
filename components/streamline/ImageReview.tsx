"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import type { GeneratedImage } from "@/lib/useGeneration";

type ImageReviewProps = {
  images: GeneratedImage[];
};

export function ImageReview({ images }: ImageReviewProps) {
  const [activeReviewIndex, setActiveReviewIndex] = useState<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeCurrentY = useRef<number | null>(null);

  const activeReviewImageSrc =
    activeReviewIndex !== null && images[activeReviewIndex]?.b64_json
      ? `data:image/png;base64,${images[activeReviewIndex].b64_json}`
      : null;

  const reviewImagePositionLabel =
    activeReviewIndex !== null && images.length > 0
      ? `${activeReviewIndex + 1} of ${images.length}`
      : "";

  const closeReviewModal = useCallback(() => {
    setActiveReviewIndex(null);
  }, []);

  const goToPreviousReviewImage = useCallback(() => {
    if (images.length === 0) {
      return;
    }

    setActiveReviewIndex((previous) => {
      if (previous === null) {
        return 0;
      }

      return (previous - 1 + images.length) % images.length;
    });
  }, [images.length]);

  const goToNextReviewImage = useCallback(() => {
    if (images.length === 0) {
      return;
    }

    setActiveReviewIndex((previous) => {
      if (previous === null) {
        return 0;
      }

      return (previous + 1) % images.length;
    });
  }, [images.length]);

  useEffect(() => {
    if (activeReviewIndex === null) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeReviewModal();
      }

      if (event.key === "ArrowLeft") {
        goToPreviousReviewImage();
      }

      if (event.key === "ArrowRight") {
        goToNextReviewImage();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeReviewIndex, closeReviewModal, goToNextReviewImage, goToPreviousReviewImage]);

  function handleFullscreenTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    swipeStartY.current = touch?.clientY ?? null;
    swipeCurrentY.current = touch?.clientY ?? null;
  }

  function handleFullscreenTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    if (!touch || swipeStartY.current === null) {
      return;
    }

    swipeCurrentY.current = touch.clientY;
  }

  function handleFullscreenTouchEnd() {
    if (swipeStartY.current === null || swipeCurrentY.current === null) {
      swipeStartY.current = null;
      swipeCurrentY.current = null;
      return;
    }

    const deltaY = swipeCurrentY.current - swipeStartY.current;
    const SWIPE_CLOSE_THRESHOLD = 80;

    if (deltaY > SWIPE_CLOSE_THRESHOLD) {
      closeReviewModal();
    }

    swipeStartY.current = null;
    swipeCurrentY.current = null;
  }

  return (
    <>
      <div className="mt-10 border-t border-[#262B36]/60 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((img, i) => {
          const imageSrc = `data:image/png;base64,${img.b64_json}`;

          return (
            <button
              key={i}
              type="button"
              className="block w-full text-left"
              onClick={() => setActiveReviewIndex(i)}
            >
              <Image
                src={imageSrc}
                alt="Generated interior"
                width={1024}
                height={1024}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-full h-auto cursor-zoom-in"
              />
            </button>
          );
        })}
        </div>
      </div>

      {activeReviewImageSrc ? (
        <div
          className="fixed inset-0 z-50 bg-[#0F1115]/90 p-4"
          onClick={closeReviewModal}
          onTouchStart={handleFullscreenTouchStart}
          onTouchMove={handleFullscreenTouchMove}
          onTouchEnd={handleFullscreenTouchEnd}
        >
          <p className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-[10px] border border-[#262B36] bg-[#171A21]/85 px-3 py-1 text-xs text-[#F5F7FA]">
            {reviewImagePositionLabel}
          </p>

          <button
            type="button"
            aria-label="Close fullscreen image"
            className="absolute top-3 right-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#262B36] bg-[#171A21]/95 text-[#F5F7FA] shadow-lg transition hover:bg-[#1D2230] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
            onClick={(event) => {
              event.stopPropagation();
              closeReviewModal();
            }}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>

          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#262B36] bg-[#171A21]/95 text-[#F5F7FA] shadow-lg transition hover:bg-[#1D2230] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
            onClick={(event) => {
              event.stopPropagation();
              goToPreviousReviewImage();
            }}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#262B36] bg-[#171A21]/95 text-[#F5F7FA] shadow-lg transition hover:bg-[#1D2230] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
            onClick={(event) => {
              event.stopPropagation();
              goToNextReviewImage();
            }}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ›
            </span>
          </button>

          <div
            className="relative z-10 mx-auto h-full max-h-[90vh] w-full max-w-7xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeReviewImageSrc}
              alt="Generated interior fullscreen preview"
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-[10px] border border-[#262B36] bg-[#171A21]/80 px-3 py-1 text-xs text-[#98A2B3]">
            Use arrows to navigate. Swipe down, tap image background, or press Esc to close
          </p>
        </div>
      ) : null}
    </>
  );
}
