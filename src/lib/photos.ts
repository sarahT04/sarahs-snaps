import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { getLocationFromSlug, normalizeSegment } from "./slug";

type Photo = CollectionEntry<"photos">;

export interface LocationGroup {
  country: string;
  city: string;
  count: number;
  slug: string;
  flag: string | null;
}

const countryCodeDict = {
  indonesia: "ID",
  china: "CN",
  italy: "IT",
  hungary: "HU",
  czech: "CZ",
  austria: "AT",
};

export function getCountryFlag(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  const key = trimmed.toLowerCase();

  // If input is a country name (case-insensitive)
  if (key in countryCodeDict) {
    const code = countryCodeDict[key as keyof typeof countryCodeDict];
    return (
      "https://flagicons.lipis.dev/flags/4x3/" + code.toLowerCase() + ".svg"
    );
  }

  // If input is a country code (e.g., "CN", "ID")
  const codeCandidate = trimmed.toUpperCase();
  const values = Object.values(countryCodeDict);
  if (values.includes(codeCandidate)) {
    return (
      "https://flagicons.lipis.dev/flags/4x3/" +
      codeCandidate.toLowerCase() +
      ".svg"
    );
  }

  // Input is neither a known country name nor a valid code
  return null;
}

export function groupPhotosByLocation(photos: Photo[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();

  for (const photo of photos) {
    const { country, city } = getLocationFromSlug(photo.slug);
    const key = `${country}/${city}`;

    if (!map.has(key)) {
      map.set(key, {
        country,
        city,
        slug: city.toLowerCase(),
        count: 0,
        flag: getCountryFlag(country),
      });
    }

    map.get(key)!.count++;
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      a.country.localeCompare(b.country) || a.city.localeCompare(b.city),
  );
}

/**
 * Return all photos that match a given city (and optional country).
 * City and country comparisons are normalized using `normalizeSegment`.
 */
export function photosByCity(
  photos: Photo[],
  city: string,
  country?: string,
): Photo[] {
  const targetCity = normalizeSegment(city);
  const targetCountry = country ? normalizeSegment(country) : undefined;

  return photos
    .filter((p) => {
      const { country: ctry, city: cty } = getLocationFromSlug(p.slug);
      if (cty !== targetCity) return false;
      if (targetCountry && ctry !== targetCountry) return false;
      return true;
    })
    .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));
}

/**
 * Fetch and return all photos for a city (and optional country) from the content collection.
 */
export async function getPhotosByCity(
  city: string,
  country?: string,
): Promise<Photo[]> {
  const all = await getCollection("photos");
  return photosByCity(all, city, country);
}
