export type FacetOption = {
  value: string;
  count: number;
};

export async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return (await response.json()) as T;
}

export function parseDateToMs(date: string | undefined): number {
  if (!date) return 0;
  if (date.includes(".")) {
    const [day, month, year] = date.split(".").map(Number);
    if (day && month && year) return new Date(year, month - 1, day).getTime();
  }
  const parsed = new Date(date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getQueryValue(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) || "";
}

export function getQueryValues(key: string): string[] {
  return getQueryValue(key).split(",").filter(Boolean);
}

export function getQueryOption<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = getQueryValue(key) as T;
  return allowed.includes(value) ? value : fallback;
}

export function replaceQuery(parameters: Record<string, string | string[]>) {
  if (typeof window === "undefined") return;
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    const normalized = Array.isArray(value) ? value.join(",") : value.trim();
    if (normalized) query.set(key, normalized);
  });
  const search = query.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search ? `?${search}` : ""}`,
  );
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function formatLabel(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
