import type { RoomType } from "@/lib/combinations";

export type ScenarioLike = {
  room: RoomType;
};

function normalizeScenarioRoom<TScenario extends Partial<ScenarioLike>>(
  scenario: TScenario | undefined | null
): TScenario | null {
  if (!scenario) {
    return null;
  }

  const room = typeof scenario.room === "string" ? scenario.room.trim() : "";

  if (room.length === 0) {
    return null;
  }

  return {
    ...scenario,
    room: room as RoomType,
  } as TScenario;
}

function shuffleArray<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    const temp = copy[index] as T;
    copy[index] = copy[randomIndex] as T;
    copy[randomIndex] = temp;
  }

  return copy;
}

export function createPromptScenarioSamples<TScenario extends ScenarioLike>(
  rooms: readonly RoomType[],
  maxImages: number,
  createScenario: (room: RoomType, index: number) => TScenario,
  random: () => number = Math.random
): TScenario[] {
  const uniqueRooms = [...new Set(rooms)];

  if (uniqueRooms.length === 0) {
    throw new Error("No prompts could be generated from the selected options");
  }

  const shuffledRooms = shuffleArray(uniqueRooms, random);
  const kitchenRooms = shuffledRooms.filter((room) => room === "kitchen");
  const nonKitchenRooms = shuffledRooms.filter((room) => room !== "kitchen");
  const kitchenCount =
    kitchenRooms.length > 0
      ? Math.min(maxImages, Math.max(1, Math.floor(maxImages / 4)))
      : 0;

  return Array.from({ length: maxImages }, (_, index) => {
    const useKitchen = index < kitchenCount;
    const candidateRooms = useKitchen
      ? kitchenRooms
      : nonKitchenRooms.length > 0
        ? nonKitchenRooms
        : kitchenRooms;
    const roomIndex = useKitchen ? index : index - kitchenCount;
    const room = candidateRooms[roomIndex % candidateRooms.length];

    if (!room) {
      throw new Error("Unable to select a prompt scenario");
    }

    return createScenario(room, index);
  });
}

export function selectPromptScenarios<TScenario extends ScenarioLike>(
  baseScenarios: Array<TScenario | undefined | null>,
  maxImages: number,
  random: () => number = Math.random,
  minimumKitchenCount = Math.max(1, Math.floor(maxImages / 4))
): TScenario[] {
  const validScenarios = baseScenarios.flatMap((scenario) => {
    const normalizedScenario = normalizeScenarioRoom(scenario);
    return normalizedScenario ? [normalizedScenario] : [];
  });

  if (validScenarios.length === 0) {
    throw new Error("No prompts could be generated from the selected options");
  }

  const shuffledScenarios = shuffleArray(validScenarios, random);
  const kitchenScenarios = shuffledScenarios.filter((scenario) => scenario.room === "kitchen");
  const nonKitchenScenarios = shuffledScenarios.filter((scenario) => scenario.room !== "kitchen");
  const effectiveKitchenCount = Math.max(0, Math.min(minimumKitchenCount, maxImages));

  return Array.from({ length: maxImages }, (_, index) => {
    const fallbackScenario = validScenarios[0];
    const useKitchenScenario = index < effectiveKitchenCount && kitchenScenarios.length > 0;
    const candidatePool = useKitchenScenario ? kitchenScenarios : nonKitchenScenarios;
    const selectedScenario =
      candidatePool.length > 0
        ? candidatePool[index % Math.max(1, candidatePool.length)]
        : shuffledScenarios[index % Math.max(1, shuffledScenarios.length)] ?? fallbackScenario;

    return selectedScenario ?? fallbackScenario;
  });
}
