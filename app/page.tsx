"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ceilingLights, ceilings, roomSizes, rooms, walls } from "@/lib/combinations";

type GeneratedImage = {
  b64_json?: string | null;
};

type FileSizeOption = "small" | "medium" | "large";
type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";

type GenerateResponse = Array<{
  data?: GeneratedImage[];
}>;

export default function Home() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([
    rooms[0] ?? "living room",
  ]);
  const [selectedWalls, setSelectedWalls] = useState<string[]>([
    walls[0] ?? "white walls",
  ]);
  const [selectedCeilings, setSelectedCeilings] = useState<string[]>([
    ceilings[0] ?? "smooth white ceiling",
  ]);
  const [selectedCeilingLights, setSelectedCeilingLights] = useState<string[]>([
    ceilingLights[0] ?? "recessed downlights",
  ]);
  const [roomSize, setRoomSize] = useState(
    roomSizes[1] ?? "standard room (180-280 sq ft)"
  );
  const [fileSize, setFileSize] = useState<FileSizeOption>("medium");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("1:1");
  const [maxImages, setMaxImages] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeCurrentY = useRef<number | null>(null);

  const allRoomsSelected = selectedRooms.length === rooms.length;
  const allWallsSelected = selectedWalls.length === walls.length;
  const allCeilingsSelected = selectedCeilings.length === ceilings.length;
  const allCeilingLightsSelected =
    selectedCeilingLights.length === ceilingLights.length;

  useEffect(() => {
    if (!fullscreenImage) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreenImage(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenImage]);

  function toggleRoom(room: string) {
    setSelectedRooms((previous) => {
      if (previous.includes(room)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== room);
      }

      return [...previous, room];
    });
  }

  function toggleAllRooms() {
    setSelectedRooms((previous) =>
      previous.length === rooms.length ? [rooms[0] ?? "living room"] : [...rooms]
    );
  }

  function toggleWall(wallType: string) {
    setSelectedWalls((previous) => {
      if (previous.includes(wallType)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== wallType);
      }

      return [...previous, wallType];
    });
  }

  function toggleAllWalls() {
    setSelectedWalls((previous) =>
      previous.length === walls.length ? [walls[0] ?? "white walls"] : [...walls]
    );
  }

  function toggleCeiling(ceilingType: string) {
    setSelectedCeilings((previous) => {
      if (previous.includes(ceilingType)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== ceilingType);
      }

      return [...previous, ceilingType];
    });
  }

  function toggleAllCeilings() {
    setSelectedCeilings((previous) =>
      previous.length === ceilings.length
        ? [ceilings[0] ?? "smooth white ceiling"]
        : [...ceilings]
    );
  }

  function toggleCeilingLight(lightType: string) {
    setSelectedCeilingLights((previous) => {
      if (previous.includes(lightType)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== lightType);
      }

      return [...previous, lightType];
    });
  }

  function toggleAllCeilingLights() {
    setSelectedCeilingLights((previous) =>
      previous.length === ceilingLights.length
        ? [ceilingLights[0] ?? "recessed downlights"]
        : [...ceilingLights]
    );
  }

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
      setFullscreenImage(null);
    }

    swipeStartY.current = null;
    swipeCurrentY.current = null;
  }

  async function generate() {
    setIsGenerating(true);

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rooms: selectedRooms,
          walls: selectedWalls,
          ceilings: selectedCeilings,
          ceilingLights: selectedCeilingLights,
          roomSize,
          fileSize,
          aspectRatio,
          maxImages,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();

      let payload: unknown = null;

      if (contentType.includes("application/json")) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = null;
        }
      }

      if (!contentType.includes("application/json")) {
        console.error("/generate returned non-JSON response", {
          status: response.status,
          contentType,
          bodyPreview: rawBody.slice(0, 300),
        });
        setImages([]);
        return;
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Image generation failed";

        console.error(message);
        setImages([]);
        return;
      }

      const data: GenerateResponse = Array.isArray(payload) ? payload : [];

      setImages(data.flatMap((item) => item.data ?? []));
    } catch (error) {
      console.error("Request failed:", error);
      setImages([]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="p-10">
      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Room type</legend>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allRoomsSelected}
                onChange={toggleAllRooms}
              />
              All room types
            </label>
            {rooms.map((room) => (
              <label key={room} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={() => toggleRoom(room)}
                />
                {room}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Wall type</legend>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allWallsSelected}
                onChange={toggleAllWalls}
              />
              All wall types
            </label>
            {walls.map((wallType) => (
              <label key={wallType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedWalls.includes(wallType)}
                  onChange={() => toggleWall(wallType)}
                />
                {wallType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Ceiling type</legend>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allCeilingsSelected}
                onChange={toggleAllCeilings}
              />
              All ceiling types
            </label>
            {ceilings.map((ceilingType) => (
              <label key={ceilingType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCeilings.includes(ceilingType)}
                  onChange={() => toggleCeiling(ceilingType)}
                />
                {ceilingType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Ceiling lights</legend>
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allCeilingLightsSelected}
                onChange={toggleAllCeilingLights}
              />
              All ceiling lights
            </label>
            {ceilingLights.map((lightType) => (
              <label key={lightType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCeilingLights.includes(lightType)}
                  onChange={() => toggleCeilingLight(lightType)}
                />
                {lightType}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Room size</span>
          <select
            className="border rounded px-3 py-2"
            value={roomSize}
            onChange={(event) =>
              setRoomSize(event.target.value)
            }
          >
            {roomSizes.map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">File size</span>
          <select
            className="border rounded px-3 py-2"
            value={fileSize}
            onChange={(event) =>
              setFileSize(event.target.value as FileSizeOption)
            }
          >
            <option value="small">Small (lower resolution)</option>
            <option value="medium">Medium (balanced resolution)</option>
            <option value="large">Large (high resolution)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Aspect ratio</span>
          <select
            className="border rounded px-3 py-2"
            value={aspectRatio}
            onChange={(event) =>
              setAspectRatio(event.target.value as AspectRatioOption)
            }
          >
            <option value="1:1">1:1 (Instagram Post)</option>
            <option value="4:5">4:5 (Instagram Portrait)</option>
            <option value="9:16">9:16 (Story / Reels)</option>
            <option value="16:9">16:9 (Landscape / YouTube)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Max images</span>
          <select
            className="border rounded px-3 py-2"
            value={maxImages}
            onChange={(event) =>
              setMaxImages(Number(event.target.value))
            }
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={16}>16</option>
            <option value={20}>20</option>
            <option value={24}>24</option>
          </select>
        </label>

        <button
          onClick={generate}
          disabled={isGenerating}
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-10">
        {images.map((img, i) => {
          const imageSrc = `data:image/png;base64,${img.b64_json}`;

          return (
            <button
              key={i}
              type="button"
              className="block w-full text-left"
              onClick={() => setFullscreenImage(imageSrc)}
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

      {fullscreenImage ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4"
          onClick={() => setFullscreenImage(null)}
          onTouchStart={handleFullscreenTouchStart}
          onTouchMove={handleFullscreenTouchMove}
          onTouchEnd={handleFullscreenTouchEnd}
        >
          <button
            type="button"
            aria-label="Close fullscreen image"
            className="absolute top-3 right-3 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={(event) => {
              event.stopPropagation();
              setFullscreenImage(null);
            }}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>

          <div
            className="relative z-10 mx-auto h-full max-h-[90vh] w-full max-w-7xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={fullscreenImage}
              alt="Generated interior fullscreen preview"
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-3 py-1 text-xs text-white/90">
            Swipe down, tap image background, or press Esc to close
          </p>
        </div>
      ) : null}
    </main>
  );
}