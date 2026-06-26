"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type TouchEvent,
} from "react";
import {
  AUTO_PALETTE_VARIATION_DEFAULT,
  COLOR_COVERAGE_DEFAULT,
  COLOR_INTENSITY_DEFAULT,
  COLOR_INTENSITY_MAX,
  COLOR_INTENSITY_MIN,
  COLOR_STRATEGY_DEFAULT,
  HERO_COLOR_DEFAULT,
  colorCoverages,
  colorStrategies,
  colorMoods,
  colorProfiles,
  ceilingLights,
  ceilings,
  heroColors,
  focalPoints,
  homeQualities,
  type ColorMood,
  type ColorCoverage,
  type ColorStrategy,
  type HeroColor,
  type RoomType,
  roomSizes,
  rooms,
  styles,
  views,
  wallColorPalettes,
  walls,
  windowStyles,
} from "@/lib/combinations";
import {
  ChipGroup,
  CollapsibleSection,
  RoomTypePicker,
  SummaryCard,
  type ChipOption,
} from "@/components/ui-modernization";
import { getColorPreviewData } from "@/lib/promptBuilder/colorPalette";
import { buildPrompt } from "../lib/promptBuilder";

type GeneratedImage = {
  b64_json?: string | null;
};

type FileSizeOption = "small" | "medium" | "large";
type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
type HomeQuality = "builder's grade layout" | "everyday" | "upscale" | "luxury" | "ultra luxury";
type GenerationUiState =
  | "idle"
  | "preparing"
  | "sending"
  | "generating"
  | "complete"
  | "error"
  | "cancelled";

type GenerateResponse = Array<{
  data?: GeneratedImage[];
}>;

type BatchSubmitResponse = {
  mode: "batch";
  batchId: string;
  status: string;
};

type BatchStatusResponse = {
  batchId: string;
  status: string;
  requestCounts?: {
    total?: number;
    completed?: number;
    failed?: number;
  } | null;
};

type BatchResultResponse = {
  batchId: string;
  status: string;
  results: GenerateResponse;
};

type ErrorResponse = {
  error?: string;
};

type CheckboxGroupConfig = {
  key: string;
  legend: string;
  allLabel: string;
  options: string[];
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getPreviewWallColorPalette(colorProfileSelection: string[]): string {
  const selectedProfiles = new Set(colorProfileSelection);
  const earthyOnlySelection =
    colorProfileSelection.length === 1 && selectedProfiles.has("earthy saturated palette");

  if (earthyOnlySelection) {
    return (
      wallColorPalettes.find((palette) => palette.includes("earthy warm mix")) ??
      "earthy warm mix (sand, clay, terracotta, olive)"
    );
  }

  if (selectedProfiles.has("high-contrast palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("high-contrast mix")) ??
      "high-contrast mix (white, black, and one strong accent color)"
    );
  }

  if (selectedProfiles.has("rich color-forward palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("coastal blue mix")) ??
      "coastal blue mix (powder blue, dusty navy, soft teal, white trim)"
    );
  }

  if (selectedProfiles.has("soft pastel palette")) {
    return (
      wallColorPalettes.find((palette) => palette.includes("blush and rose mix")) ??
      "blush and rose mix (blush pink, rose beige, warm ivory, soft taupe)"
    );
  }

  return (
    wallColorPalettes.find((palette) => palette.includes("cool contemporary mix")) ??
    "cool contemporary mix (white, gray, slate blue, charcoal accents)"
  );
}

function toggleGroupOption<T extends string>(
  option: T,
  setSelected: Dispatch<SetStateAction<T[]>>
) {
  setSelected((previous) =>
    previous.includes(option)
      ? previous.filter((value) => value !== option)
      : [...previous, option]
  );
}

function toggleAllGroupOptions<T extends string>(
  options: readonly T[],
  checked: boolean,
  setSelected: Dispatch<SetStateAction<T[]>>
) {
  setSelected(checked ? [...options] : []);
}

export default function Home() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<RoomType[]>([
    rooms[0] ?? "living room",
  ]);
  const [selectedViews, setSelectedViews] = useState<string[]>([
    views[0] ?? "regular inner-city neighborhood",
  ]);
  const [selectedColorProfiles, setSelectedColorProfiles] = useState<string[]>([
    colorProfiles[0] ?? "current balanced palette (default)",
  ]);
  const [selectedFocalPoints, setSelectedFocalPoints] = useState<string[]>([]);
  const [selectedWindowStyles, setSelectedWindowStyles] = useState<string[]>([
    windowStyles[1] ?? "balanced windows (standard residential)",
  ]);
  const [selectedWalls, setSelectedWalls] = useState<string[]>([
    walls[2] ?? "wallpaper walls",
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
  const [designStyle, setDesignStyle] = useState(
    styles[0] ?? "modern"
  );
  const [colorMood, setColorMood] = useState<ColorMood>(
    colorMoods[0] ?? "Warm Neutral"
  );
  const [colorStrategy, setColorStrategy] = useState<ColorStrategy>(
    COLOR_STRATEGY_DEFAULT
  );
  const [colorCoverage, setColorCoverage] = useState<ColorCoverage>(
    COLOR_COVERAGE_DEFAULT
  );
  const [heroColor, setHeroColor] = useState<HeroColor>(HERO_COLOR_DEFAULT);
  const [colorIntensity, setColorIntensity] = useState(COLOR_INTENSITY_DEFAULT);
  const [autoPaletteVariation, setAutoPaletteVariation] = useState(
    AUTO_PALETTE_VARIATION_DEFAULT
  );
  const [homeQuality, setHomeQuality] = useState<HomeQuality>("upscale");
  const [randomizeWallColor, setRandomizeWallColor] = useState(false);
  const [fileSize, setFileSize] = useState<FileSizeOption>("small");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("16:9");
  const [maxImages, setMaxImages] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationUiState, setGenerationUiState] = useState<GenerationUiState>("idle");
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [generationStatusMessage, setGenerationStatusMessage] = useState("");
  const [activeReviewIndex, setActiveReviewIndex] = useState<number | null>(null);
  const [isOptionalDetailsOpen, setIsOptionalDetailsOpen] = useState(false);
  const [isLayoutDetailsOpen, setIsLayoutDetailsOpen] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(true);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);
  const activeBatchIdRef = useRef<string | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeCurrentY = useRef<number | null>(null);

  const homeQualityDescriptions: Record<HomeQuality, string> = {
    "builder's grade layout":
      "Standard tract-home layout with practical finishes and simpler detailing.",
    everyday:
      "Practical, comfortable finishes and realistic residential styling.",
    upscale:
      "Refined materials and polished details without full luxury opulence.",
    luxury:
      "High-end finishes, designer furniture, and premium composition.",
    "ultra luxury":
      "Top-tier bespoke interiors with exceptional materials and craftsmanship.",
  };

  const checkboxGroups: CheckboxGroupConfig[] = [
    {
      key: "walls",
      legend: "Wall type",
      allLabel: "All wall types",
      options: walls,
      selected: selectedWalls,
      setSelected: setSelectedWalls,
    },
    {
      key: "windowStyles",
      legend: "Window style",
      allLabel: "All window styles",
      options: windowStyles,
      selected: selectedWindowStyles,
      setSelected: setSelectedWindowStyles,
    },
    {
      key: "colorProfiles",
      legend: "Color profile",
      allLabel: "All color profiles",
      options: colorProfiles,
      selected: selectedColorProfiles,
      setSelected: setSelectedColorProfiles,
    },
    {
      key: "focalPoints",
      legend: "Focal points",
      allLabel: "All focal points",
      options: focalPoints,
      selected: selectedFocalPoints,
      setSelected: setSelectedFocalPoints,
    },
    {
      key: "views",
      legend: "Outside view",
      allLabel: "All outside views",
      options: views,
      selected: selectedViews,
      setSelected: setSelectedViews,
    },
    {
      key: "ceilings",
      legend: "Ceiling type",
      allLabel: "All ceiling types",
      options: ceilings,
      selected: selectedCeilings,
      setSelected: setSelectedCeilings,
    },
    {
      key: "ceilingLights",
      legend: "Ceiling lights",
      allLabel: "All ceiling lights",
      options: ceilingLights,
      selected: selectedCeilingLights,
      setSelected: setSelectedCeilingLights,
    },
  ];

  const optionalCheckboxGroups = checkboxGroups;

  const summaryRoom =
    selectedRooms.length > 0
      ? selectedRooms[0]
      : (rooms[0] ?? "living room");
  const summaryStyle = designStyle;
  const summaryQuality = homeQuality;
  const summaryAspect = aspectRatio;
  const summaryCount = maxImages;
  const summaryColorCoverage = colorCoverage;
  const optionalCustomizationCount = optionalCheckboxGroups.reduce(
    (total, group) => total + group.selected.length,
    0
  );
  const advancedSettingsSummary = randomizeWallColor
    ? `${fileSize} file size, random wall colors on`
    : `${fileSize} file size, random wall colors off`;

  const promptPreview = useMemo(() => {
    const previewRoom = selectedRooms[0] ?? rooms[0] ?? "living room";
    const previewView = selectedViews[0] ?? views[0] ?? "regular inner-city neighborhood";
    const previewColorProfile =
      selectedColorProfiles[0] ?? colorProfiles[0] ?? "current balanced palette (default)";
    const previewFocalPoint = selectedFocalPoints.slice(0, 1);
    const previewWindowStyle = selectedWindowStyles.slice(0, 1);
    const previewWall = selectedWalls.slice(0, 1);
    const previewCeiling = selectedCeilings.slice(0, 1);
    const previewCeilingLight = selectedCeilingLights.slice(0, 1);

    return buildPrompt(
      previewRoom,
      roomSize,
      designStyle,
      colorMood,
      colorIntensity,
      colorStrategy,
      colorCoverage,
      heroColor,
      autoPaletteVariation,
      0,
      maxImages,
      homeQuality,
      getPreviewWallColorPalette(selectedColorProfiles),
      [previewColorProfile],
      previewView,
      previewWindowStyle,
      previewFocalPoint,
      previewWall,
      previewCeiling,
      previewCeilingLight
    );
  }, [
    autoPaletteVariation,
    colorCoverage,
    colorIntensity,
    colorMood,
    colorStrategy,
    designStyle,
    heroColor,
    homeQuality,
    maxImages,
    roomSize,
    selectedCeilings,
    selectedCeilingLights,
    selectedColorProfiles,
    selectedFocalPoints,
    selectedRooms,
    selectedViews,
    selectedWalls,
    selectedWindowStyles,
  ]);

  const promptPreviewColorData = useMemo(
    () =>
      getColorPreviewData({
        colorMood,
        colorStrategy,
        colorCoverage,
        heroColor,
        colorIntensity,
        autoPaletteVariation,
        imageIndex: 0,
        maxImages,
      }),
    [
      autoPaletteVariation,
      colorCoverage,
      colorIntensity,
      colorMood,
      colorStrategy,
      heroColor,
      maxImages,
    ]
  );

  const colorIntensityLevel =
    colorIntensity <= 25
      ? "Soft"
      : colorIntensity <= 50
        ? "Balanced"
        : colorIntensity <= 75
          ? "Noticeable"
          : "Strong";

  const summaryColorIntensity = `${colorIntensity}% (${colorIntensityLevel})`;

  const ALL_VALUE = "__all__";

  const roomTypeCategories = useMemo(
    () => {
      const categoryDefinitions: Array<{ title: string; rooms: string[] }> = [
        {
          title: "Living Spaces",
          rooms: [
            "living room",
            "sunken living room",
            "family room",
            "breakfast nook",
            "library",
            "dining room",
          ],
        },
        {
          title: "Private Spaces",
          rooms: ["bedroom", "home office", "nursery", "bathroom"],
        },
        {
          title: "Service Spaces",
          rooms: [
            "kitchen",
            "pantry",
            "laundry room",
            "mud room",
            "walk-in closet",
            "foyer",
          ],
        },
        {
          title: "Entertainment Spaces",
          rooms: ["theater room", "game room", "wine cellar", "recording studio"],
        },
        {
          title: "Fitness Spaces",
          rooms: ["home gym"],
        },
        {
          title: "Utility Spaces",
          rooms: ["basement"],
        },
      ];

      return categoryDefinitions
        .map((category) => ({
          ...category,
          rooms: category.rooms.filter((room): room is RoomType =>
            rooms.includes(room as RoomType)
          ),
        }))
        .filter((category) => category.rooms.length > 0);
    },
    []
  );

  const generationStateLabels: Record<GenerationUiState, string> = {
    idle: "Idle",
    preparing: "Preparing prompt",
    sending: "Sending request",
    generating: "Generating images",
    complete: "Complete",
    error: "Error",
    cancelled: "Cancelled",
  };

  const generationIndicatorVisible =
    generationUiState !== "idle" &&
    (isGenerating || generationUiState === "complete" || generationUiState === "error" || generationUiState === "cancelled");

  const generationIndicatorTone =
    generationUiState === "error"
      ? "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FCA5A5]"
      : generationUiState === "cancelled"
        ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]"
        : generationUiState === "complete"
          ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#86EFAC]"
          : "border-[#262B36] bg-[#1D2230] text-[#F5F7FA]";

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

  async function generate() {
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    cancelRequestedRef.current = false;
    activeBatchIdRef.current = null;
    setIsGenerating(true);
    setGenerationUiState("preparing");
    setGenerationProgress(null);
    setGenerationStatusMessage("Preparing prompt...");

    try {
      setGenerationUiState("sending");
      setGenerationStatusMessage("Sending request...");

      const response = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rooms: selectedRooms,
          outsideViews: selectedViews,
          colorProfiles: selectedColorProfiles,
          focalPoints: selectedFocalPoints,
          windowStyles: selectedWindowStyles,
          walls: selectedWalls,
          ceilings: selectedCeilings,
          ceilingLights: selectedCeilingLights,
          roomSize,
          designStyle,
          colorMood,
          colorStrategy,
            colorCoverage,
          heroColor,
          colorIntensity,
          colorPresence: colorIntensity,
          autoPaletteVariation,
          homeQuality,
          randomizeWallColor,
          fileSize,
          aspectRatio,
          maxImages,
        }),
        signal: controller.signal,
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
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage("Image generation failed.");
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
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage(message);
        setImages([]);
        return;
      }

      if (Array.isArray(payload)) {
        const data: GenerateResponse = payload;
        setGenerationUiState("generating");
        setGenerationProgress(null);
        setGenerationStatusMessage("Generating images...");
        setImages(data.flatMap((item) => item.data ?? []));
        setGenerationUiState("complete");
        setGenerationStatusMessage(`Generated ${data.length} image responses.`);
        return;
      }

      const batchSubmit =
        typeof payload === "object" &&
        payload !== null &&
        "mode" in payload &&
        (payload as { mode?: unknown }).mode === "batch" &&
        "batchId" in payload &&
        typeof (payload as { batchId?: unknown }).batchId === "string"
          ? (payload as BatchSubmitResponse)
          : null;

      if (!batchSubmit) {
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage("Unexpected response from /generate.");
        setImages([]);
        return;
      }

      activeBatchIdRef.current = batchSubmit.batchId;

      setGenerationUiState("generating");
      setGenerationProgress(null);
      setGenerationStatusMessage(`Generating images. Batch ${batchSubmit.batchId} submitted.`);

      while (true) {
        if (cancelRequestedRef.current) {
          throw new Error("Generation cancelled by user");
        }

        await sleep(5000);

        if (cancelRequestedRef.current) {
          throw new Error("Generation cancelled by user");
        }

        const statusResponse = await fetch(
          `/generate/status?batchId=${encodeURIComponent(batchSubmit.batchId)}`,
          { signal: controller.signal }
        );

        const statusPayload = (await statusResponse.json()) as
          | BatchStatusResponse
          | ErrorResponse;

        if (!statusResponse.ok) {
          const errorMessage =
            typeof statusPayload === "object" &&
            statusPayload !== null &&
            "error" in statusPayload &&
            typeof (statusPayload as { error?: unknown }).error === "string"
              ? (statusPayload as { error: string }).error
              : "Failed to check batch status";

          throw new Error(errorMessage);
        }

        if (!("batchId" in statusPayload) || !("status" in statusPayload)) {
          throw new Error("Invalid batch status response");
        }

        const requestCounts = statusPayload.requestCounts ?? null;

        if (requestCounts?.total) {
          const completed = requestCounts.completed ?? 0;
          const failed = requestCounts.failed ?? 0;
          const processed = completed + failed;

          setGenerationProgress(
            Math.max(0, Math.min(100, Math.round((processed / requestCounts.total) * 100)))
          );

          setGenerationStatusMessage(
            `Generating images... ${processed} of ${requestCounts.total} batch requests finished.`
          );
        } else {
          setGenerationProgress(null);
          setGenerationStatusMessage("Generating images...");
        }

        if (statusPayload.status === "completed") {
          break;
        }

        if (
          statusPayload.status === "failed" ||
          statusPayload.status === "expired" ||
          statusPayload.status === "cancelled"
        ) {
          throw new Error(`Batch ended with status: ${statusPayload.status}`);
        }
      }

      const resultResponse = await fetch(
        `/generate/result?batchId=${encodeURIComponent(batchSubmit.batchId)}`,
        { signal: controller.signal }
      );

      const resultPayload = (await resultResponse.json()) as
        | BatchResultResponse
        | ErrorResponse;

      if (!resultResponse.ok) {
        const errorMessage =
          typeof resultPayload === "object" &&
          resultPayload !== null &&
          "error" in resultPayload &&
          typeof (resultPayload as { error?: unknown }).error === "string"
            ? (resultPayload as { error: string }).error
            : "Failed to fetch batch results";

        throw new Error(errorMessage);
      }

      if (!("results" in resultPayload) || !Array.isArray(resultPayload.results)) {
        throw new Error("Invalid batch result response");
      }

      const flattened = resultPayload.results.flatMap((item: { data?: GeneratedImage[] }) => item.data ?? []);
      setImages(flattened);
      setGenerationUiState("complete");
      setGenerationProgress(100);
      setGenerationStatusMessage(`Batch complete: ${flattened.length} images loaded.`);
    } catch (error) {
      const wasAborted =
        (error instanceof DOMException && error.name === "AbortError") ||
        cancelRequestedRef.current;

      if (wasAborted) {
        setGenerationUiState("cancelled");
        setGenerationProgress(null);
        setGenerationStatusMessage("Generation cancelled.");
      } else {
        console.error("Request failed:", error);
        setGenerationUiState("error");
        setGenerationProgress(null);
        setGenerationStatusMessage(
          error instanceof Error ? error.message : "Request failed"
        );
        setImages([]);
      }
    } finally {
      setIsGenerating(false);
      activeRequestControllerRef.current = null;
      activeBatchIdRef.current = null;
      cancelRequestedRef.current = false;
    }
  }

  async function cancelGeneration() {
    if (!isGenerating) {
      return;
    }

    cancelRequestedRef.current = true;
    setGenerationStatusMessage("Cancelling generation...");

    activeRequestControllerRef.current?.abort();

    const batchId = activeBatchIdRef.current;

    if (!batchId) {
      return;
    }

    try {
      await fetch("/generate/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchId }),
      });
    } catch (error) {
      console.error("Failed to cancel batch job:", error);
    }
  }

  function toggleRoomCard(value: RoomType | "All") {
    if (value === "All") {
      toggleAllGroupOptions(
        rooms,
        selectedRooms.length !== rooms.length,
        setSelectedRooms
      );
      return;
    }

    toggleGroupOption(value, setSelectedRooms);
  }

  function toggleOptionalGroupValue(group: CheckboxGroupConfig, value: string) {
    if (value === ALL_VALUE) {
      toggleAllGroupOptions(
        group.options,
        group.selected.length !== group.options.length,
        group.setSelected
      );
      return;
    }

    toggleGroupOption(value, group.setSelected);
  }

  function getOptionalGroupChipOptions(group: CheckboxGroupConfig): ChipOption[] {
    return [
      { value: ALL_VALUE, label: group.allLabel },
      ...group.options.map((option) => ({ value: option, label: option })),
    ];
  }

  function getOptionalGroupSelectedValues(group: CheckboxGroupConfig): string[] {
    return group.selected.length === group.options.length
      ? [ALL_VALUE, ...group.selected]
      : group.selected;
  }

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-6 text-[#F5F7FA] sm:px-6 lg:px-10">
      <div className="space-y-4">
        <section className="rounded-[20px] border border-[#262B36] bg-[#171A21] px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-sm font-semibold">Main Prompt Setup</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(clamp(16rem,42vw,24rem),1fr))] lg:gap-5">
            <div className="lg:col-span-2">
              <RoomTypePicker
                selectedRooms={selectedRooms}
                roomTypeCategories={roomTypeCategories}
                allRooms={rooms}
                onToggleRoom={toggleRoomCard}
              />
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Interior Design Style</span>
                <select
                  aria-label="Interior design style"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={designStyle}
                  onChange={(event) => setDesignStyle(event.target.value)}
                >
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Color Mood</span>
                <select
                  aria-label="Color mood"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={colorMood}
                  onChange={(event) => setColorMood(event.target.value as ColorMood)}
                >
                  {colorMoods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Color Strategy</span>
                <select
                  aria-label="Color strategy"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={colorStrategy}
                  onChange={(event) =>
                    setColorStrategy(event.target.value as ColorStrategy)
                  }
                >
                  {colorStrategies.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {strategy}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Palette Family</span>
                <select
                  aria-label="Palette family"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={heroColor}
                  onChange={(event) => setHeroColor(event.target.value as HeroColor)}
                >
                  {heroColors.map((colorOption) => (
                    <option key={colorOption} value={colorOption}>
                      {colorOption}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Home Quality</span>
                <select
                  aria-label="Home quality"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={homeQuality}
                  onChange={(event) => setHomeQuality(event.target.value as HomeQuality)}
                >
                  {homeQualities.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-[#98A2B3]">
                Current quality profile: {homeQualityDescriptions[homeQuality]}
              </p>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Color Intensity</span>
                <div className="w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2">
                  <input
                    aria-label="Color intensity"
                    type="range"
                    min={COLOR_INTENSITY_MIN}
                    max={COLOR_INTENSITY_MAX}
                    step={1}
                    value={colorIntensity}
                    onChange={(event) => setColorIntensity(Number(event.target.value))}
                    className="h-2 w-full accent-[#4F8CFF]"
                  />
                  <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs text-[#98A2B3]">
                    <span>{COLOR_INTENSITY_MIN}</span>
                    <span className="truncate text-center font-medium text-[#F5F7FA]">
                      {colorIntensity} ({colorIntensityLevel})
                    </span>
                    <span>{COLOR_INTENSITY_MAX}</span>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-[#98A2B3]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#4F8CFF]"
                      checked={autoPaletteVariation}
                      onChange={(event) =>
                        setAutoPaletteVariation(event.target.checked)
                      }
                    />
                    <span>Auto Palette Variation</span>
                  </label>
                </div>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Color Coverage</span>
                <select
                  aria-label="Color coverage"
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                  value={colorCoverage}
                  onChange={(event) => setColorCoverage(event.target.value as ColorCoverage)}
                >
                  {colorCoverages.map((coverage) => (
                    <option key={coverage} value={coverage}>
                      {coverage}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Aspect ratio</span>
                <select
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
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
            </div>

            <div className="min-w-0">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-[#98A2B3]">Max images</span>
                <select
                  className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
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
                  <option value={32}>32</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="w-full space-y-2">
          <CollapsibleSection
            title="Optional Details"
            collapsedSummary={`${optionalCustomizationCount} customizations selected`}
            isOpen={isOptionalDetailsOpen}
            onToggle={() => setIsOptionalDetailsOpen((previous) => !previous)}
          >
            <div className="space-y-2">
              {optionalCheckboxGroups.map((group) => (
                <CollapsibleSection
                  key={group.key}
                  title={group.legend}
                  selectedCount={group.selected.length}
                >
                  <ChipGroup
                    options={getOptionalGroupChipOptions(group)}
                    selectedValues={getOptionalGroupSelectedValues(group)}
                    onToggleValue={(value) => toggleOptionalGroupValue(group, value)}
                    ariaLabel={group.legend}
                  />
                </CollapsibleSection>
              ))}
            </div>
          </CollapsibleSection>
        </section>

        <section className="w-full space-y-2">
          <CollapsibleSection
            title="Layout Details"
            collapsedSummary={roomSize}
            isOpen={isLayoutDetailsOpen}
            onToggle={() => setIsLayoutDetailsOpen((previous) => !previous)}
          >
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-medium text-[#98A2B3]">Room size</span>
              <select
                className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
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
          </CollapsibleSection>
        </section>

        <section className="w-full space-y-2">
          <CollapsibleSection
            title="Advanced Settings"
            collapsedSummary={advancedSettingsSummary}
            isOpen={isAdvancedSettingsOpen}
            onToggle={() => setIsAdvancedSettingsOpen((previous) => !previous)}
          >
            <label className="flex w-full flex-col gap-2">
              <span className="text-sm font-medium text-[#98A2B3]">File size</span>
              <select
                className="h-[42px] w-full rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA] transition hover:border-[#4F8CFF] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
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

            <label className="inline-flex h-[42px] w-full items-center gap-2 rounded-[10px] border border-[#262B36] bg-[#0F1115] px-3 py-2 text-sm text-[#F5F7FA]">
              <input
                type="checkbox"
                checked={randomizeWallColor}
                onChange={(event) => setRandomizeWallColor(event.target.checked)}
              />
              Randomize wall color
            </label>
          </CollapsibleSection>
        </section>

        <section className="rounded-[20px] border border-[#262B36] bg-[#171A21] px-4 py-4">
          <h2 className="text-sm font-semibold">Generate</h2>
          <SummaryCard
            title="Generation Summary"
            lines={[
              `${summaryStyle} ${summaryQuality} ${summaryRoom}`,
              `${summaryAspect} ${summaryAspect === "16:9" ? "landscape" : "format"}`,
              `${summaryCount} images`,
              `${summaryColorCoverage} coverage, intensity ${summaryColorIntensity}`,
            ]}
          />

          {generationIndicatorVisible ? (
            <div className={`mt-3 rounded-[16px] border p-4 ${generationIndicatorTone}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {generationStateLabels[generationUiState]}
                </p>
                {isGenerating ? (
                  <span className="text-xs font-medium text-[#98A2B3]">
                    Cancel is available while generation is active
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm text-[#98A2B3]">{generationStatusMessage}</p>

              {isGenerating ? (
                generationProgress !== null ? (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-[#0F1115]">
                      <div
                        className="h-full rounded-full bg-[#4F8CFF] transition-[width] duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#98A2B3]">{generationProgress}% complete</p>
                  </div>
                ) : (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0F1115]">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-[#4F8CFF]" />
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          <div className="mt-3">
            <CollapsibleSection
              title="Prompt Preview"
              collapsedSummary={`${summaryColorCoverage}, ${summaryColorIntensity}`}
              isOpen={isPromptPreviewOpen}
              onToggle={() => setIsPromptPreviewOpen((previous) => !previous)}
            >
              <div className="mb-3 rounded-[16px] border border-[#262B36] bg-[#0F1115] p-4 text-xs leading-5 text-[#D6DAE3]">
                <p className="text-sm font-semibold text-[#F5F7FA]">
                  Variation {promptPreviewColorData.variationNumber}/{promptPreviewColorData.variationTotal}
                </p>
                <p className="mt-2">
                  Selected Palette Family: {promptPreviewColorData.paletteFamily}
                </p>
                <p>Selected Palette: {promptPreviewColorData.selectedPalette}</p>
                <p>Strategy: {promptPreviewColorData.colorStrategy}</p>
                <p>Coverage: {promptPreviewColorData.colorCoverage}</p>
                <p>Intensity: {promptPreviewColorData.colorIntensity}</p>
                <p>Primary: {promptPreviewColorData.primary}</p>
                <p>Secondary: {promptPreviewColorData.secondary}</p>
                <p>Complementary Accent: {promptPreviewColorData.complementaryAccent}</p>
                <p>Neutral: {promptPreviewColorData.neutralGrounding}</p>
                <p>Wood Tone: {promptPreviewColorData.woodTone}</p>
                <p>Metal Finish: {promptPreviewColorData.metalFinish}</p>
              </div>
              <pre className="max-h-[340px] overflow-auto rounded-[16px] border border-[#262B36] bg-[#0F1115] p-4 text-xs leading-5 text-[#D6DAE3] whitespace-pre-wrap">
                {promptPreview}
              </pre>
            </CollapsibleSection>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={generate}
              disabled={isGenerating}
              className="h-[42px] w-full rounded-[10px] border border-[#4F8CFF] bg-[#4F8CFF] px-4 py-2 text-sm font-semibold text-[#F5F7FA] transition hover:bg-[#3E79EB] disabled:opacity-50 sm:w-auto"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>

            <button
              onClick={cancelGeneration}
              disabled={!isGenerating}
              className="h-[42px] w-full rounded-[10px] border border-[#EF4444] bg-transparent px-4 py-2 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/10 disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </section>
      </div>

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
    </main>
  );
}