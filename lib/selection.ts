/** Adds the value if missing, removes it if present. */
export function toggleValue<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Selects every option, or clears the group when `checked` is false. */
export function setAll<T extends string>(options: readonly T[], checked: boolean): T[] {
  return checked ? [...options] : [];
}
