"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import {
  accentWalls,
  accessories,
  backyards,
  basementFeatures,
  homeBarFeatures,
  homeGymFeatures,
  homeTheaterFeatures,
  pantryFeatures,
  homeOfficeFeatures,
  laundryRoomFeatures,
  mudRoomFeatures,
  walkInClosetFeatures,
  cabinetColors,
  cabinetFinishes,
  cabinetStyles,
  ceilingLights,
  ceilings,
  doorways,
  fireplaces,
  roomDividers,
  roomSizes,
  rooms,
  stairways,
  wallPaintColors,
  walls,
} from "@/lib/combinations";

type GeneratedImage = {
  b64_json?: string | null;
};

type FileSizeOption = "small" | "medium" | "large";
type AspectRatioOption = "1:1" | "4:5" | "9:16" | "16:9";
type CharacterIntensityOption = "subtle" | "balanced" | "bold";

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
  const [selectedWallPaintColors, setSelectedWallPaintColors] = useState<string[]>([
    wallPaintColors[0] ?? "soft dove gray paint",
  ]);
  const [selectedCabinetStyles, setSelectedCabinetStyles] = useState<string[]>([
    cabinetStyles[0] ?? "shaker-style cabinetry",
  ]);
  const [selectedCabinetColors, setSelectedCabinetColors] = useState<string[]>([
    cabinetColors[0] ?? "matte white",
  ]);
  const [selectedCabinetFinishes, setSelectedCabinetFinishes] = useState<string[]>([
    cabinetFinishes[0] ?? "white lacquer finish",
  ]);
  const [houseLevel, setHouseLevel] = useState<string>("builder grade");
  const [characterIntensity, setCharacterIntensity] = useState<CharacterIntensityOption>("balanced");
  const [selectedAccentWalls, setSelectedAccentWalls] = useState<string[]>([
    accentWalls[0] ?? "deep charcoal fluted accent wall",
  ]);
  const [selectedDoorways, setSelectedDoorways] = useState<string[]>([
    doorways[0] ?? "solid walnut wood doorway surround",
  ]);
  const [selectedStairways, setSelectedStairways] = useState<string[]>([
    stairways[0] ?? "floating timber stairs with hidden supports",
  ]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([
    accessories[0] ?? "oversized indoor olive tree in sculptural planter",
  ]);
  const [accessoryNotes, setAccessoryNotes] = useState<Record<string, string>>({});
  const [accessoryExpanded, setAccessoryExpanded] = useState<Record<string, boolean>>({});
  const [selectedRoomDividers, setSelectedRoomDividers] = useState<string[]>([
    roomDividers[0] ?? "clear glass divider with slim black metal frame",
  ]);
  const [selectedFireplaces, setSelectedFireplaces] = useState<string[]>([
    fireplaces[0] ?? "floor-to-ceiling statement fireplace",
  ]);
  const [selectedCeilings, setSelectedCeilings] = useState<string[]>([
    ceilings[0] ?? "smooth white ceiling",
  ]);
  const [selectedCeilingLights, setSelectedCeilingLights] = useState<string[]>([
    ceilingLights[0] ?? "recessed downlights",
  ]);
  const [selectedBasementFeatures, setSelectedBasementFeatures] = useState<string[]>([
    basementFeatures[0] ?? "finished basement lounge with rich textures",
  ]);
  const [selectedHomeTheaterFeatures, setSelectedHomeTheaterFeatures] = useState<string[]>([
    homeTheaterFeatures[0] ?? "large projection screen with surround sound",
  ]);
  const [selectedHomeBarFeatures, setSelectedHomeBarFeatures] = useState<string[]>([
    homeBarFeatures[0] ?? "wet bar with quartz countertop and brass accents",
  ]);
  const [selectedHomeGymFeatures, setSelectedHomeGymFeatures] = useState<string[]>([
    homeGymFeatures[0] ?? "mirrored wall with rubber flooring and free weights",
  ]);
  const [selectedPantryFeatures, setSelectedPantryFeatures] = useState<string[]>([
    pantryFeatures[0] ?? "walk-in pantry with open shelving and labeled containers",
  ]);
  const [selectedHomeOfficeFeatures, setSelectedHomeOfficeFeatures] = useState<string[]>([
    homeOfficeFeatures[0] ?? "built-in desk with floating shelving and integrated task lighting",
  ]);
  const [selectedLaundryRoomFeatures, setSelectedLaundryRoomFeatures] = useState<string[]>([
    laundryRoomFeatures[0] ?? "stacked washer-dryer with folding counter and hanging rod",
  ]);
  const [selectedMudRoomFeatures, setSelectedMudRoomFeatures] = useState<string[]>([
    mudRoomFeatures[0] ?? "built-in bench with cubbies and durable tile flooring",
  ]);
  const [selectedWalkInClosetFeatures, setSelectedWalkInClosetFeatures] = useState<string[]>([
    walkInClosetFeatures[0] ?? "custom walk-in closet with island and soft-close drawers",
  ]);
  const [selectedBackyard, setSelectedBackyard] = useState(
    backyards[0] ?? "regular neighborhood home backyard"
  );
  const [customRequest, setCustomRequest] = useState("");
  const [customRequestCount, setCustomRequestCount] = useState<number>(12);
  const [roomSize, setRoomSize] = useState(
    roomSizes[1] ?? "standard room (180-280 sq ft)"
  );
  const [fileSize, setFileSize] = useState<FileSizeOption>("medium");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("1:1");
  const [maxImages, setMaxImages] = useState(12);
  const effectiveCustomRequestCount = Math.min(customRequestCount, maxImages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const generateAbortController = useRef<AbortController | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeCurrentY = useRef<number | null>(null);

  const allRoomsSelected = selectedRooms.length === rooms.length;
  const basementRooms = rooms.filter((room) => room === "basement");
  const homeTheaterRooms = rooms.filter((room) => room === "in-home theater");
  const standardRooms = rooms.filter(
    (room) => room !== "basement" && room !== "in-home theater"
  );
  const allWallsSelected = selectedWalls.length === walls.length;
  const allAccentWallsSelected = selectedAccentWalls.length === accentWalls.length;
  const allDoorwaysSelected = selectedDoorways.length === doorways.length;
  const allStairwaysSelected = selectedStairways.length === stairways.length;
  const allCabinetStylesSelected = selectedCabinetStyles.length === cabinetStyles.length;
  const allAccessoriesSelected = selectedAccessories.length === accessories.length;
  const allRoomDividersSelected = selectedRoomDividers.length === roomDividers.length;
  const allFireplacesSelected = selectedFireplaces.length === fireplaces.length;
  const allCeilingsSelected = selectedCeilings.length === ceilings.length;
  const allCeilingLightsSelected =
    selectedCeilingLights.length === ceilingLights.length;
  const allHomeBarFeaturesSelected =
    selectedHomeBarFeatures.length === homeBarFeatures.length;
  const allHomeGymFeaturesSelected =
    selectedHomeGymFeatures.length === homeGymFeatures.length;
  const allPantryFeaturesSelected =
    selectedPantryFeatures.length === pantryFeatures.length;
  const allHomeOfficeFeaturesSelected =
    selectedHomeOfficeFeatures.length === homeOfficeFeatures.length;
  const allLaundryRoomFeaturesSelected =
    selectedLaundryRoomFeatures.length === laundryRoomFeatures.length;
  const allMudRoomFeaturesSelected =
    selectedMudRoomFeatures.length === mudRoomFeatures.length;
  const allWalkInClosetFeaturesSelected =
    selectedWalkInClosetFeatures.length === walkInClosetFeatures.length;
  const allBasementFeaturesSelected =
    selectedBasementFeatures.length === basementFeatures.length;
  const allHomeTheaterFeaturesSelected =
    selectedHomeTheaterFeatures.length === homeTheaterFeatures.length;

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

  useEffect(() => {
    return () => {
      generateAbortController.current?.abort();
    };
  }, []);

  function toggleRoom(room: string) {
    setSelectedRooms((previous) =>
      previous.includes(room)
        ? previous.filter((value) => value !== room)
        : [...previous, room]
    );
  }

  function toggleAllRooms() {
    setSelectedRooms((previous) =>
      previous.length === rooms.length ? [rooms[0] ?? "living room"] : [...rooms]
    );
  }

  function toggleWall(wallType: string) {
    setSelectedWalls((previous) =>
      previous.includes(wallType)
        ? previous.filter((value) => value !== wallType)
        : [...previous, wallType]
    );
  }

  function toggleAllWalls() {
    setSelectedWalls((previous) =>
      previous.length === walls.length ? [walls[0] ?? "white walls"] : [...walls]
    );
  }

  function toggleWallPaintColor(wallPaintColor: string) {
    setSelectedWallPaintColors((previous) => {
      if (previous.includes(wallPaintColor)) {
        return previous.filter((value) => value !== wallPaintColor);
      }

      return [...previous, wallPaintColor];
    });
  }

  function getSwatchColor(name: string) {
    switch (name) {
      case "soft dove gray paint":
        return "#d7dbe0";
      case "muted sage green paint":
        return "#9aa89a";
      case "warm beige paint":
        return "#d6c2a1";
      case "pale blush paint":
      case "soft blush pink paint":
        return "#f3d1d8";
      case "dusty blue paint":
        return "#8aa7c7";
      case "emerald green paint":
        return "#0b8a55";
      case "muted olive green paint":
        return "#8a8b3a";
      case "deep merlot wine paint":
        return "#6b0b2e";
      case "classic charcoal paint":
        return "#333333";
      case "creamy off-white paint":
        return "#f6f4ee";
      default:
        return "transparent";
    }
  }

  function toggleAllWallPaintColors() {
    setSelectedWallPaintColors((previous) =>
      previous.length === wallPaintColors.length
        ? [wallPaintColors[0] ?? "soft dove gray paint"]
        : [...wallPaintColors]
    );
  }

  function toggleAccentWall(accentWallType: string) {
    setSelectedAccentWalls((previous) =>
      previous.includes(accentWallType)
        ? previous.filter((value) => value !== accentWallType)
        : [...previous, accentWallType]
    );
  }

  function toggleAllAccentWalls() {
    setSelectedAccentWalls((previous) =>
      previous.length === accentWalls.length
        ? [accentWalls[0] ?? "deep charcoal fluted accent wall"]
        : [...accentWalls]
    );
  }

  function toggleDoorway(doorwayType: string) {
    setSelectedDoorways((previous) =>
      previous.includes(doorwayType)
        ? previous.filter((value) => value !== doorwayType)
        : [...previous, doorwayType]
    );
  }

  function toggleAllDoorways() {
    setSelectedDoorways((previous) =>
      previous.length === doorways.length
        ? [doorways[0] ?? "solid walnut wood doorway surround"]
        : [...doorways]
    );
  }

  function toggleStairway(stairwayType: string) {
    setSelectedStairways((previous) =>
      previous.includes(stairwayType)
        ? previous.filter((value) => value !== stairwayType)
        : [...previous, stairwayType]
    );
  }

  function toggleAllStairways() {
    setSelectedStairways((previous) =>
      previous.length === stairways.length
        ? [stairways[0] ?? "floating timber stairs with hidden supports"]
        : [...stairways]
    );
  }

  function toggleCabinetStyle(cabinetStyle: string) {
    setSelectedCabinetStyles((previous) =>
      previous.includes(cabinetStyle)
        ? previous.filter((value) => value !== cabinetStyle)
        : [...previous, cabinetStyle]
    );
  }

  function toggleAllCabinetStyles() {
    setSelectedCabinetStyles((previous) =>
      previous.length === cabinetStyles.length
        ? [cabinetStyles[0] ?? "shaker-style cabinetry"]
        : [...cabinetStyles]
    );
  }

  function toggleCabinetColor(color: string) {
    setSelectedCabinetColors((previous) => {
      const isNone = color === "none";

      if (isNone) {
        return previous.includes("none") ? previous : ["none"];
      }

      if (previous.includes("none")) {
        return [color];
      }

      if (previous.includes(color)) {
        if (previous.length === 1) return previous;
        return previous.filter((value) => value !== color);
      }

      return [...previous, color];
    });
  }

  function toggleCabinetFinish(finish: string) {
    setSelectedCabinetFinishes((previous) => {
      const isNone = finish === "none";

      if (isNone) {
        return previous.includes("none") ? previous : ["none"];
      }

      if (previous.includes("none")) {
        return [finish];
      }

      if (previous.includes(finish)) {
        if (previous.length === 1) return previous;
        return previous.filter((value) => value !== finish);
      }

      return [...previous, finish];
    });
  }

  function toggleAccessory(accessoryType: string) {
    const isSelected = selectedAccessories.includes(accessoryType);

    if (isSelected) {
      setSelectedAccessories((previous) =>
        previous.filter((value) => value !== accessoryType)
      );
      return;
    }

    setSelectedAccessories((previous) => [...previous, accessoryType]);
  }

  function updateAccessoryNote(accessoryType: string, value: string) {
    setAccessoryNotes((previous) => ({
      ...previous,
      [accessoryType]: value,
    }));
  }

  function toggleAccessoryExpand(accessoryType: string) {
    setAccessoryExpanded((previous) => ({
      ...previous,
      [accessoryType]: !previous[accessoryType],
    }));
  }

  function toggleAllAccessories() {
    const allSelected = selectedAccessories.length === accessories.length;

    setSelectedAccessories(allSelected ? [accessories[0] ?? "oversized indoor olive tree in sculptural planter"] : [...accessories]);
  }

  function toggleBasementFeature(feature: string) {
    setSelectedBasementFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllBasementFeatures() {
    setSelectedBasementFeatures((previous) =>
      previous.length === basementFeatures.length
        ? [basementFeatures[0] ?? "finished basement lounge with rich textures"]
        : [...basementFeatures]
    );
  }

  function toggleHomeBarFeature(feature: string) {
    setSelectedHomeBarFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllHomeBarFeatures() {
    setSelectedHomeBarFeatures((previous) =>
      previous.length === homeBarFeatures.length
        ? [homeBarFeatures[0] ?? "wet bar with quartz countertop and brass accents"]
        : [...homeBarFeatures]
    );
  }

  function toggleHomeGymFeature(feature: string) {
    setSelectedHomeGymFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllHomeGymFeatures() {
    setSelectedHomeGymFeatures((previous) =>
      previous.length === homeGymFeatures.length
        ? [homeGymFeatures[0] ?? "mirrored wall with rubber flooring and free weights"]
        : [...homeGymFeatures]
    );
  }

  function togglePantryFeature(feature: string) {
    setSelectedPantryFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllPantryFeatures() {
    setSelectedPantryFeatures((previous) =>
      previous.length === pantryFeatures.length
        ? [pantryFeatures[0] ?? "walk-in pantry with open shelving and labeled containers"]
        : [...pantryFeatures]
    );
  }

  function toggleHomeOfficeFeature(feature: string) {
    setSelectedHomeOfficeFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllHomeOfficeFeatures() {
    setSelectedHomeOfficeFeatures((previous) =>
      previous.length === homeOfficeFeatures.length
        ? [homeOfficeFeatures[0] ?? "built-in desk with floating shelving and integrated task lighting"]
        : [...homeOfficeFeatures]
    );
  }

  function toggleLaundryRoomFeature(feature: string) {
    setSelectedLaundryRoomFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllLaundryRoomFeatures() {
    setSelectedLaundryRoomFeatures((previous) =>
      previous.length === laundryRoomFeatures.length
        ? [laundryRoomFeatures[0] ?? "stacked washer-dryer with folding counter and hanging rod"]
        : [...laundryRoomFeatures]
    );
  }

  function toggleMudRoomFeature(feature: string) {
    setSelectedMudRoomFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllMudRoomFeatures() {
    setSelectedMudRoomFeatures((previous) =>
      previous.length === mudRoomFeatures.length
        ? [mudRoomFeatures[0] ?? "built-in bench with cubbies and durable tile flooring"]
        : [...mudRoomFeatures]
    );
  }

  function toggleWalkInClosetFeature(feature: string) {
    setSelectedWalkInClosetFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllWalkInClosetFeatures() {
    setSelectedWalkInClosetFeatures((previous) =>
      previous.length === walkInClosetFeatures.length
        ? [walkInClosetFeatures[0] ?? "custom walk-in closet with island and soft-close drawers"]
        : [...walkInClosetFeatures]
    );
  }

  function toggleHomeTheaterFeature(feature: string) {
    setSelectedHomeTheaterFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((value) => value !== feature)
        : [...previous, feature]
    );
  }

  function toggleAllHomeTheaterFeatures() {
    setSelectedHomeTheaterFeatures((previous) =>
      previous.length === homeTheaterFeatures.length
        ? [homeTheaterFeatures[0] ?? "large projection screen with surround sound"]
        : [...homeTheaterFeatures]
    );
  }

  function toggleRoomDivider(roomDividerType: string) {
    setSelectedRoomDividers((previous) =>
      previous.includes(roomDividerType)
        ? previous.filter((value) => value !== roomDividerType)
        : [...previous, roomDividerType]
    );
  }

  function toggleAllRoomDividers() {
    setSelectedRoomDividers((previous) =>
      previous.length === roomDividers.length
        ? [roomDividers[0] ?? "clear glass divider with slim black metal frame"]
        : [...roomDividers]
    );
  }

  function toggleFireplace(fireplaceType: string) {
    setSelectedFireplaces((previous) =>
      previous.includes(fireplaceType)
        ? previous.filter((value) => value !== fireplaceType)
        : [...previous, fireplaceType]
    );
  }

  function toggleAllFireplaces() {
    setSelectedFireplaces((previous) =>
      previous.length === fireplaces.length
        ? [fireplaces[0] ?? "floor-to-ceiling statement fireplace"]
        : [...fireplaces]
    );
  }

  function toggleCeiling(ceilingType: string) {
    setSelectedCeilings((previous) =>
      previous.includes(ceilingType)
        ? previous.filter((value) => value !== ceilingType)
        : [...previous, ceilingType]
    );
  }

  function toggleAllCeilings() {
    setSelectedCeilings((previous) =>
      previous.length === ceilings.length
        ? [ceilings[0] ?? "smooth white ceiling"]
        : [...ceilings]
    );
  }

  function toggleCeilingLight(lightType: string) {
    setSelectedCeilingLights((previous) =>
      previous.includes(lightType)
        ? previous.filter((value) => value !== lightType)
        : [...previous, lightType]
    );
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
    generateAbortController.current?.abort();
    const controller = new AbortController();
    generateAbortController.current = controller;

    setIsGenerating(true);

    try {
      const payloadCabinetColor = selectedCabinetColors.includes("none")
        ? "none"
        : selectedCabinetColors[0] ?? cabinetColors[0];

      const payloadCabinetFinish = selectedCabinetFinishes.includes("none")
        ? "none"
        : selectedCabinetFinishes[0] ?? cabinetFinishes[0];

      const response = await fetch("/generate", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rooms: selectedRooms,
          walls: selectedWalls,
          accentWalls: selectedAccentWalls,
          doorways: selectedDoorways,
          stairways: selectedStairways,
          accessories: selectedAccessories,
          accessoryNotes,
          basementFeatures: selectedBasementFeatures,
          homeBarFeatures: selectedHomeBarFeatures,
          homeGymFeatures: selectedHomeGymFeatures,
          pantryFeatures: selectedPantryFeatures,
          homeOfficeFeatures: selectedHomeOfficeFeatures,
          laundryRoomFeatures: selectedLaundryRoomFeatures,
          mudRoomFeatures: selectedMudRoomFeatures,
          walkInClosetFeatures: selectedWalkInClosetFeatures,
          homeTheaterFeatures: selectedHomeTheaterFeatures,
          customRequest,
          wallPaintColors: selectedWallPaintColors,
          cabinetStyles: selectedCabinetStyles,
          cabinetColor: payloadCabinetColor,
          cabinetFinish: payloadCabinetFinish,
          houseLevel,
          characterIntensity,
          roomDividers: selectedRoomDividers,
          fireplaces: selectedFireplaces,
          ceilings: selectedCeilings,
          ceilingLights: selectedCeilingLights,
          backyard: selectedBackyard,
          roomSize,
          fileSize,
          aspectRatio,
          maxImages,
          customRequestCount: effectiveCustomRequestCount,
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
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Request failed:", error);
      setImages([]);
    } finally {
      if (generateAbortController.current === controller) {
        generateAbortController.current = null;
      }

      setIsGenerating(false);
    }
  }

  function cancelGenerate() {
    generateAbortController.current?.abort();
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedRooms.length === 0}
                onChange={() => setSelectedRooms([])}
              />
              None
            </label>
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Main rooms
              </div>
              {standardRooms.map((room) => (
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
            <div className="flex flex-col gap-1 pt-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Basement
              </div>
              {basementRooms.map((room) => (
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
            <div className="flex flex-col gap-1 pt-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                In-home theater
              </div>
              {homeTheaterRooms.map((room) => (
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
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Basement features</legend>
          <div className="flex flex-col gap-1 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allBasementFeaturesSelected}
                onChange={toggleAllBasementFeatures}
              />
              All basement features
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedBasementFeatures.length === 0}
                onChange={() => setSelectedBasementFeatures([])}
              />
              None
            </label>
            {basementFeatures.map((feature) => (
              <label key={feature} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBasementFeatures.includes(feature)}
                  onChange={() => toggleBasementFeature(feature)}
                />
                {feature}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">In-home theater features</legend>
          <div className="flex flex-col gap-1 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allHomeTheaterFeaturesSelected}
                onChange={toggleAllHomeTheaterFeatures}
              />
              All theater features
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedHomeTheaterFeatures.length === 0}
                onChange={() => setSelectedHomeTheaterFeatures([])}
              />
              None
            </label>
            {homeTheaterFeatures.map((feature) => (
              <label key={feature} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedHomeTheaterFeatures.includes(feature)}
                  onChange={() => toggleHomeTheaterFeature(feature)}
                />
                {feature}
              </label>
            ))}
          </div>
        </fieldset>

          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm px-1">Pantry features</legend>
            <div className="flex flex-col gap-1 min-w-[220px] text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allPantryFeaturesSelected}
                  onChange={toggleAllPantryFeatures}
                />
                All pantry features
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPantryFeatures.length === 0}
                  onChange={() => setSelectedPantryFeatures([])}
                />
                None
              </label>
              {pantryFeatures.map((feature) => (
                <label key={feature} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPantryFeatures.includes(feature)}
                    onChange={() => togglePantryFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm px-1">Home office features</legend>
            <div className="flex flex-col gap-1 min-w-[220px] text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allHomeOfficeFeaturesSelected}
                  onChange={toggleAllHomeOfficeFeatures}
                />
                All home office features
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedHomeOfficeFeatures.length === 0}
                  onChange={() => setSelectedHomeOfficeFeatures([])}
                />
                None
              </label>
              {homeOfficeFeatures.map((feature) => (
                <label key={feature} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedHomeOfficeFeatures.includes(feature)}
                    onChange={() => toggleHomeOfficeFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm px-1">Laundry room features</legend>
            <div className="flex flex-col gap-1 min-w-[220px] text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allLaundryRoomFeaturesSelected}
                  onChange={toggleAllLaundryRoomFeatures}
                />
                All laundry features
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLaundryRoomFeatures.length === 0}
                  onChange={() => setSelectedLaundryRoomFeatures([])}
                />
                None
              </label>
              {laundryRoomFeatures.map((feature) => (
                <label key={feature} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLaundryRoomFeatures.includes(feature)}
                    onChange={() => toggleLaundryRoomFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm px-1">Mud room features</legend>
            <div className="flex flex-col gap-1 min-w-[220px] text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allMudRoomFeaturesSelected}
                  onChange={toggleAllMudRoomFeatures}
                />
                All mud room features
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMudRoomFeatures.length === 0}
                  onChange={() => setSelectedMudRoomFeatures([])}
                />
                None
              </label>
              {mudRoomFeatures.map((feature) => (
                <label key={feature} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMudRoomFeatures.includes(feature)}
                    onChange={() => toggleMudRoomFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border rounded px-3 py-2">
            <legend className="text-sm px-1">Walk-in closet features</legend>
            <div className="flex flex-col gap-1 min-w-[220px] text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allWalkInClosetFeaturesSelected}
                  onChange={toggleAllWalkInClosetFeatures}
                />
                All walk-in closet features
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedWalkInClosetFeatures.length === 0}
                  onChange={() => setSelectedWalkInClosetFeatures([])}
                />
                None
              </label>
              {walkInClosetFeatures.map((feature) => (
                <label key={feature} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedWalkInClosetFeatures.includes(feature)}
                    onChange={() => toggleWalkInClosetFeature(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Home bar features</legend>
          <div className="flex flex-col gap-1 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allHomeBarFeaturesSelected}
                onChange={toggleAllHomeBarFeatures}
              />
              All bar features
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedHomeBarFeatures.length === 0}
                onChange={() => setSelectedHomeBarFeatures([])}
              />
              None
            </label>
            {homeBarFeatures.map((feature) => (
              <label key={feature} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedHomeBarFeatures.includes(feature)}
                  onChange={() => toggleHomeBarFeature(feature)}
                />
                {feature}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Home gym features</legend>
          <div className="flex flex-col gap-1 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allHomeGymFeaturesSelected}
                onChange={toggleAllHomeGymFeatures}
              />
              All gym features
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedHomeGymFeatures.length === 0}
                onChange={() => setSelectedHomeGymFeatures([])}
              />
              None
            </label>
            {homeGymFeatures.map((feature) => (
              <label key={feature} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedHomeGymFeatures.includes(feature)}
                  onChange={() => toggleHomeGymFeature(feature)}
                />
                {feature}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">House level</legend>
          <div className="flex flex-col gap-2 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="house-level"
                checked={houseLevel === "builder grade"}
                onChange={() => setHouseLevel("builder grade")}
              />
              Builder grade
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="house-level"
                checked={houseLevel === "mid-level"}
                onChange={() => setHouseLevel("mid-level")}
              />
              Mid-level
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="house-level"
                checked={houseLevel === "luxury"}
                onChange={() => setHouseLevel("luxury")}
              />
              Luxury
            </label>
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Character intensity</legend>
          <div className="flex flex-col gap-2 min-w-[220px] text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="character-intensity"
                checked={characterIntensity === "subtle"}
                onChange={() => setCharacterIntensity("subtle")}
              />
              <span>Subtle</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                Editorial calm
              </span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="character-intensity"
                checked={characterIntensity === "balanced"}
                onChange={() => setCharacterIntensity("balanced")}
              />
              <span>Balanced</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                Designer lived-in
              </span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="character-intensity"
                checked={characterIntensity === "bold"}
                onChange={() => setCharacterIntensity("bold")}
              />
              <span>Bold</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                Statement interior
              </span>
            </label>
            <p className="text-xs text-slate-500">
              Controls how expressive and layered the styling should be.
            </p>
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedWalls.length === 0}
                onChange={() => setSelectedWalls([])}
              />
              None
            </label>
            {walls.map((wallType) => {
              const isSelected = selectedWalls.includes(wallType);

              return (
                <div key={wallType} className="flex flex-col gap-1">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWall(wallType)}
                    />
                    {wallType}
                  </label>
                </div>
              );
            })}
            {selectedWalls.length > 0 ? (
              <div className="ml-0 flex flex-col gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="font-medium">Wall paint colors</div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedWallPaintColors.length === wallPaintColors.length}
                    onChange={toggleAllWallPaintColors}
                  />
                  All paint colors
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedWallPaintColors.length === 0}
                    onChange={() => setSelectedWallPaintColors([])}
                  />
                  None
                </label>
                {wallPaintColors.map((color) => (
                  <label key={color} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedWallPaintColors.includes(color)}
                      onChange={() => toggleWallPaintColor(color)}
                    />
                    <span
                      aria-hidden
                      className="inline-block w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: getSwatchColor(color) }}
                    />
                    <span className="ml-1">{color}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Kitchen cabinetry</legend>
          <div className="flex flex-col gap-3 min-w-[220px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allCabinetStylesSelected}
                onChange={toggleAllCabinetStyles}
              />
              All cabinet styles
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCabinetStyles.length === 0}
                onChange={() => setSelectedCabinetStyles([])}
              />
              None
            </label>
            {cabinetStyles.map((style) => (
              <label key={style} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCabinetStyles.includes(style)}
                  onChange={() => toggleCabinetStyle(style)}
                />
                {style}
              </label>
            ))}

            <label className="text-sm font-medium">Cabinet color</label>
            <div className="ml-0 flex flex-col gap-1 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCabinetColors.includes("none")}
                  onChange={() => toggleCabinetColor("none")}
                />
                None
              </label>
              {cabinetColors.map((color) => (
                <label key={color} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCabinetColors.includes(color)}
                    onChange={() => toggleCabinetColor(color)}
                  />
                  {color}
                </label>
              ))}
            </div>

            <label className="text-sm font-medium">Cabinet finish</label>
            <div className="ml-0 flex flex-col gap-1 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedCabinetFinishes.includes("none")}
                  onChange={() => toggleCabinetFinish("none")}
                />
                None
              </label>
              {cabinetFinishes.map((finish) => (
                <label key={finish} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCabinetFinishes.includes(finish)}
                    onChange={() => toggleCabinetFinish(finish)}
                  />
                  {finish}
                </label>
              ))}
            </div>
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCeilings.length === 0}
                onChange={() => setSelectedCeilings([])}
              />
              None
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
          <legend className="text-sm px-1">Accent wall</legend>
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allAccentWallsSelected}
                onChange={toggleAllAccentWalls}
              />
              All accent wall options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedAccentWalls.length === 0}
                onChange={() => setSelectedAccentWalls([])}
              />
              None
            </label>
            {accentWalls.map((accentWallType) => (
              <label
                key={accentWallType}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedAccentWalls.includes(accentWallType)}
                  onChange={() => toggleAccentWall(accentWallType)}
                />
                {accentWallType}
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCeilingLights.length === 0}
                onChange={() => setSelectedCeilingLights([])}
              />
              None
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

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Doorways</legend>
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allDoorwaysSelected}
                onChange={toggleAllDoorways}
              />
              All doorway options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedDoorways.length === 0}
                onChange={() => setSelectedDoorways([])}
              />
              None
            </label>
            {doorways.map((doorwayType) => (
              <label key={doorwayType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedDoorways.includes(doorwayType)}
                  onChange={() => toggleDoorway(doorwayType)}
                />
                {doorwayType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Stairways</legend>
          <div className="flex flex-col gap-1 min-w-[280px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allStairwaysSelected}
                onChange={toggleAllStairways}
              />
              All stairway options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedStairways.length === 0}
                onChange={() => setSelectedStairways([])}
              />
              None
            </label>
            {stairways.map((stairwayType) => (
              <label key={stairwayType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedStairways.includes(stairwayType)}
                  onChange={() => toggleStairway(stairwayType)}
                />
                {stairwayType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Accessories</legend>
          <div className="flex flex-col gap-1 min-w-[320px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allAccessoriesSelected}
                onChange={toggleAllAccessories}
              />
              All accessory options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedAccessories.length === 0}
                onChange={() => setSelectedAccessories([])}
              />
              None
            </label>
            {accessories.map((accessoryType) => {
              const isSelected = selectedAccessories.includes(accessoryType);

              return (
                <div key={accessoryType} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAccessory(accessoryType)}
                      />
                      {accessoryType}
                    </label>
                    {isSelected ? (
                      <button
                        type="button"
                        onClick={() => toggleAccessoryExpand(accessoryType)}
                        className="ml-2 rounded border px-2 py-0.5 text-xs"
                      >
                        {accessoryExpanded[accessoryType] ? "Close" : "Edit"}
                      </button>
                    ) : null}
                  </div>

                  {isSelected && accessoryExpanded[accessoryType] ? (
                    <textarea
                      value={accessoryNotes[accessoryType] ?? ""}
                      onChange={(event) =>
                        updateAccessoryNote(accessoryType, event.target.value)
                      }
                      placeholder="Color / style notes for this item"
                      className="ml-6 w-full h-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                    />
                  ) : isSelected ? (
                    <input
                      type="text"
                      value={accessoryNotes[accessoryType] ?? ""}
                      onChange={(event) =>
                        updateAccessoryNote(accessoryType, event.target.value)
                      }
                      placeholder="Color / style (e.g. deep navy)"
                      className="ml-6 w-48 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Room dividers</legend>
          <div className="flex flex-col gap-1 min-w-[340px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allRoomDividersSelected}
                onChange={toggleAllRoomDividers}
              />
              All room divider options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedRoomDividers.length === 0}
                onChange={() => setSelectedRoomDividers([])}
              />
              None
            </label>
            {roomDividers.map((roomDividerType) => (
              <label key={roomDividerType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRoomDividers.includes(roomDividerType)}
                  onChange={() => toggleRoomDivider(roomDividerType)}
                />
                {roomDividerType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2">
          <legend className="text-sm px-1">Fireplaces</legend>
          <div className="flex flex-col gap-1 min-w-[340px]">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allFireplacesSelected}
                onChange={toggleAllFireplaces}
              />
              All fireplace options
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedFireplaces.length === 0}
                onChange={() => setSelectedFireplaces([])}
              />
              None
            </label>
            {fireplaces.map((fireplaceType) => (
              <label key={fireplaceType} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedFireplaces.includes(fireplaceType)}
                  onChange={() => toggleFireplace(fireplaceType)}
                />
                {fireplaceType}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border rounded px-3 py-2 min-w-[280px]">
          <legend className="text-sm px-1">Backyard type</legend>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSelectedBackyard("")}
              className={`rounded border px-3 py-2 text-left text-sm transition ${
                selectedBackyard === ""
                  ? "border-black bg-black text-white"
                  : "border-zinc-300 bg-white text-black hover:bg-zinc-50"
              }`}
            >
              None
            </button>
            {backyards.map((backyard) => {
              const isSelected = selectedBackyard === backyard;

              return (
                <button
                  key={backyard}
                  type="button"
                  onClick={() => setSelectedBackyard(backyard)}
                  className={`rounded border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-zinc-300 bg-white text-black hover:bg-zinc-50"
                  }`}
                >
                  {backyard}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 min-w-[320px]">
          <span className="text-sm">Specific request</span>
          <textarea
            className="border rounded px-3 py-2 text-sm"
            rows={3}
            value={customRequest}
            onChange={(event) => setCustomRequest(event.target.value)}
            placeholder="Add a specific item or detail, like a fireplace in the bathroom"
          />
          <span className="text-xs text-slate-500">
            This text is included in each generated image prompt.
          </span>
          <label className="flex flex-col gap-1 mt-2">
            <span className="text-sm">Apply request to</span>
            <select
              value={effectiveCustomRequestCount}
              onChange={(event) =>
                setCustomRequestCount(Number(event.target.value))
              }
              className="border rounded px-3 py-2"
            >
              <option value={0}>None</option>
              {Array.from({ length: maxImages }, (_, index) => index + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {count} image{count === 1 ? "" : "s"}
                  </option>
                )
              )}
            </select>
          </label>
          <span className="text-xs text-slate-500">
            Special requests will only be included in the selected number of images.
          </span>
        </label>

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
            onChange={(event) => {
              const nextMaxImages = Number(event.target.value);
              setMaxImages(nextMaxImages);
              setCustomRequestCount((previous) => Math.min(previous, nextMaxImages));
            }}
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

        <button
          type="button"
          onClick={cancelGenerate}
          disabled={!isGenerating}
          className="border border-red-500 text-red-600 px-4 py-2 disabled:opacity-50"
        >
          Cancel
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