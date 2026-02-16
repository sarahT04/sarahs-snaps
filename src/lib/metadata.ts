import RAW_CITY_METADATA from "@/content/metadata.json";
import { capitalizeString, normalizeSegment } from "./utils";

/**
 * Given an Astro folder slug like:
 *   "Budapest/001"
 * returns:
 *   { country: "hungary", city: "budapest", flag: "https://..." }
 */
export function getMetadataFromSlug(slug: string) {
  const [cityRaw] = slug.split("/");

  if (!cityRaw) {
    throw new Error(`Invalid photo slug: ${slug}`);
  }

  const cityMetadata = RAW_CITY_METADATA.find((city) => city.city === cityRaw);

  if (!cityMetadata) {
    throw new Error(`City not found: ${cityRaw}`)
  }

  return cityMetadata;
}

export function getAllMetadata() {
  return RAW_CITY_METADATA;
}