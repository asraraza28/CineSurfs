// Type definitions for categories
export interface CategoryItem {
  id: string;
  name: string;
}

// Decades for filtering
export const decades: CategoryItem[] = [
  { id: "2020s", name: "2020s" },
  { id: "2010s", name: "2010s" },
  { id: "2000s", name: "2000s" },
  { id: "1990s", name: "1990s" },
  { id: "1980s", name: "1980s" },
  { id: "1970s", name: "1970s" },
  { id: "1960s", name: "1960s" },
  { id: "classic", name: "Classic (pre-1960s)" }
];

// Languages for filtering
export const languages: CategoryItem[] = [
  { id: "english", name: "English" },
  { id: "spanish", name: "Spanish" },
  { id: "french", name: "French" },
  { id: "korean", name: "Korean" },
  { id: "japanese", name: "Japanese" },
  { id: "hindi", name: "Hindi" },
  { id: "german", name: "German" },
  { id: "italian", name: "Italian" }
];

// Streaming platforms for filtering
export const streamingPlatforms: CategoryItem[] = [
  { id: "netflix", name: "Netflix" },
  { id: "prime", name: "Amazon Prime" },
  { id: "hulu", name: "Hulu" },
  { id: "disney", name: "Disney+" },
  { id: "hbo", name: "HBO Max" },
  { id: "apple", name: "Apple TV+" }
];

// Search parameters interface
export interface SearchParams {
  query: string;
  type?: "movie" | "series" | "episode";
  year?: string;
  page?: number;
}

// Category parameters interface
export interface CategoryParams {
  genre?: string;
  decade?: string;
  language?: string;
  platform?: string;
  page?: number;
}