import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeString(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Converts a hyphenated string into a human-readable format with proper capitalization.
 * 
 * @param str - The input string to be formatted, or undefined
 * @returns A formatted string with words capitalized and hyphens replaced with spaces, or null if the input is falsy
 * 
 * @example
 * prettierString("hello-world") // Returns "Hello World"
 * prettierString("my-photo-gallery") // Returns "My Photo Gallery"
 * prettierString(undefined) // Returns null
 */
export function prettierString(str: string) {
  return str.split("-").map((s) => capitalizeString(s)).join(" ")
}

/**
 * Formats a date string into a localized date representation.
 * @param dateStr - The date string to format (should be a valid date string)
 * @returns The formatted date string in "en-US" locale (e.g., "Jan 01, 2024"), or the original input if parsing fails
 * @example
 * formatDate("2024-01-15") // Returns "Jan 15, 2024"
 * formatDate("invalid-date") // Returns "invalid-date"
 */
export function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

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