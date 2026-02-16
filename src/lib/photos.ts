import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { getMetadataFromSlug } from "./metadata";

type Photo = CollectionEntry<"photos">;

export interface LocationGroup {
  country: string;
  city: string;
  count: number;
  slug: string;
  flag: string | null;
}


export function groupPhotosByLocation(photos: Photo[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();

  for (const photo of photos) {
    const { country, city, flag } = getMetadataFromSlug(photo.slug);
    const key = `${country}/${city}`;

    if (!map.has(key)) {
      map.set(key, {
        country,
        city,
        slug: city.toLowerCase(),
        count: 0,
        flag: flag ?? null,
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
  tags?: string[]

): Photo[] {

  photos = photos
    .filter((p) => {
      const { city: cty } = getMetadataFromSlug(p.slug);
      if (cty !== city) return false;
      return true;
    })

  if (tags) {
    // return the first tag that matches with whatever tags user wants.
    photos = photos.filter((p) => p.data.tags.some((el) => tags.includes(el)))
  }

  return photos
    .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)));
}

export async function getPhotosByCity(
  city: string,
  tags?: string[]
): Promise<Photo[]> {
  const all = await getCollection("photos");
  return photosByCity(all, city, tags);
}
