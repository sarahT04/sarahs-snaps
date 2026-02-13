/**
 * Normalize a path segment for URLs
 * - lowercase
 * - trim
 * - replace spaces & underscores with hyphens
 * - remove non-url-safe characters
 */
export function normalizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Given an Astro folder slug like:
 *   "Hungary/Budapest/001"
 * returns:
 *   { country: "hungary", city: "budapest" }
 */
export function getLocationFromSlug(slug: string) {
  const [countryRaw, cityRaw] = slug.split("/");

  if (!countryRaw || !cityRaw) {
    throw new Error(`Invalid photo slug: ${slug}`);
  }

  return {
    country: normalizeSegment(countryRaw),
    city: normalizeSegment(cityRaw),
  };
}
