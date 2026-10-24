"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type TouchEvent } from "react";
import {
  notifyLocalStoreChanged,
  readLocalStore,
  subscribeToLocalStore,
  writeLocalStore,
} from "@/lib/localStore";
import {
  DENSITY_GRID,
  DENSITY_LABELS,
  REVIEW_DENSITIES,
  REVIEW_DENSITY_KEY,
  effectiveDensity,
  newResultsLabel,
  parseReviewDensity,
  thumbnailAspect,
  type ReviewDensity,
} from "@/lib/reviewLayout";
import type { AspectRatioOption } from "@/lib/setup";
import type { GeneratedImage } from "@/lib/useGeneration";
import { SectionCard } from "./SectionCard";

type ImageReviewProps = {
  images: GeneratedImage[];
  /** The aspect ratio the images were generated at, so thumbnails are not cropped. */
  aspectRatio: AspectRatioOption;
  isOpen: boolean;
  onToggle: () => void;
};

export function ImageReview({ images, aspectRatio, isOpen, onToggle }: ImageReviewProps) {
  const savedDensity = parseReviewDensity(
    useSyncExternalStore(
      subscribeToLocalStore,
      () => readLocalStore(REVIEW_DENSITY_KEY),
      () => null
    )
  );
  const density = effectiveDensity(savedDensity, images.length);

  // New results: a batch counts as new until the section is open and on screen, or you open it.
  const [seenImages, setSeenImages] = useState<GeneratedImage[] | null>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [sectionElement, setSectionElement] = useState<HTMLElement | null>(null);
  const hasNewImages = images.length > 0 && seenImages !== images;
  const newLabel = newResultsLabel(images.length);

  useEffect(() => {
    if (!sectionElement || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);

        if (entry.isIntersecting && isOpen && entry.intersectionRatio >= 0.25) {
          setSeenImages(images);
        }
      },
      { threshold: [0, 0.25, 0.5] }
    );

    observer.observe(sectionElement);

    return () => observer.disconnect();
  }, [sectionElement, isOpen, images]);

  useEffect(() => {
    if (!hasNewImages) {
      return;
    }

    const baseTitle = document.title.replace(/^\(\d+ new\) /, "");
    const updateTitle = () => {
      document.title = document.hidden ? `(${images.length} new) ${baseTitle}` : baseTitle;
    };

    updateTitle();
    document.addEventListener("visibilitychange", updateTitle);

    return () => {
      document.removeEventListener("visibilitychange", updateTitle);
      document.title = baseTitle;
    };
  }, [hasNewImages, images.length]);

  function showNewResults() {
    if (!isOpen) {
      onToggle();
    }

    setSeenImages(images);
    sectionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseDensity(next: ReviewDensity) {
    // If storage is unavailable the choice is kept in memory and forgotten on reload.
    writeLocalStore(REVIEW_DENSITY_KEY, next);
    notifyLocalStoreChanged();
  }

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
      {images.length > 0 ? (
        <SectionCard
          id="results"
          title="Results"
          icon="results"
          isOpen={isOpen}
          onToggle={() => {
            onToggle();
            setSeenImages(images);
          }}
          summary={`${images.length} ${images.length === 1 ? "image" : "images"}`}
          marker={
            hasNewImages ? (
              <span className="shrink-0 rounded-full bg-[#4F8CFF] px-2 py-0.5 text-[11px] font-semibold leading-none text-[#0F1115]">
                New
              </span>
            ) : null
          }
          sectionRef={setSectionElement}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#98A2B3]">
              {images.length} {images.length === 1 ? "image" : "images"}. Select one to view it full screen.
            </p>
            <div role="group" aria-label="Thumbnail size" className="inline-flex rounded-[10px] border border-[#3A4252] bg-[#0F1115] p-0.5">
              {REVIEW_DENSITIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={density === option}
                  onClick={() => chooseDensity(option)}
                  className={`rounded-[8px] px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF] ${
                    density === option
                      ? "bg-[#4F8CFF]/20 text-[#9DBFFF]"
                      : "text-[#98A2B3] hover:text-[#F5F7FA]"
                  }`}
                >
                  {DENSITY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid ${DENSITY_GRID[density]}`}>
            {images.map((img, i) => {
              const imageSrc = `data:image/png;base64,${img.b64_json}`;
              const isLarge = density === "large";

              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1} of ${images.length}`}
                  className="relative block w-full overflow-hidden rounded-[10px] border border-[#262B36] text-left [contain-intrinsic-size:auto_200px] [content-visibility:auto] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F8CFF]"
                  style={isLarge ? undefined : { aspectRatio: thumbnailAspect(aspectRatio) }}
                  onClick={() => setActiveReviewIndex(i)}
                >
                  {isLarge ? (
                    <Image
                      src={imageSrc}
                      alt="Generated interior"
                      width={1024}
                      height={1024}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                      decoding="async"
                      className="h-auto w-full cursor-zoom-in"
                    />
                  ) : (
                    <Image
                      src={imageSrc}
                      alt="Generated interior"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 17vw"
                      loading="lazy"
                      decoding="async"
                      className="cursor-zoom-in object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <p role="status" className="sr-only">
        {hasNewImages ? `${newLabel} generated. See the Results section.` : ""}
      </p>

      {hasNewImages && !isSectionVisible ? (
        <button
          type="button"
          onClick={showNewResults}
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#4F8CFF] bg-[#4F8CFF] px-4 py-2.5 text-sm font-semibold text-[#0F1115] shadow-lg transition hover:bg-[#6B9EFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9DBFFF]"
        >
          {newLabel} ↓
        </button>
      ) : null}

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
