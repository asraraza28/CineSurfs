import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format runtime from "123 min" to "2h 3m"
 */
export function formatRuntime(runtime: string): string {
  if (!runtime || runtime === "N/A") return "N/A";
  
  // Extract number from string like "123 min"
  const minutes = parseInt(runtime.replace(/[^0-9]/g, ""));
  if (isNaN(minutes)) return runtime;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'm' : ''}`;
  } else {
    return `${remainingMinutes}m`;
  }
}

/**
 * Format a comma-separated list into an array
 */
export function formatList(list: string): string[] {
  if (!list || list === "N/A") return [];
  return list.split(", ").filter(Boolean);
}

/**
 * Handle image loading error by replacing with a placeholder
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const target = event.target as HTMLImageElement;
  const title = target.alt || "Movie";
  target.src = `https://placehold.co/400x600/1a1a1a/d4af37?text=${encodeURIComponent(title)}`;
}