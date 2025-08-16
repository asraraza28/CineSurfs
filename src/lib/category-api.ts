/**
 * Category API (Decades, Languages, Streaming Providers, Genres passthrough)
 * --------------------------------------------------------------------------
 * Uses TMDB discover endpoints to fetch movies for CategoryViewPage.
 * Imports only Movie type from api.ts to keep things loosely coupled.
 */

import type { Movie } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Config                                                            */
/* ------------------------------------------------------------------ */
const TMDB_API_KEY =
  (import.meta as any).env?.VITE_TMDB_KEY || "870880200e45966e10a1bf95876576f1";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

/* ------------------------------------------------------------------ */
/* Maps                                                              */
/* ------------------------------------------------------------------ */

// TMDB watch provider IDs (region=US)
// Added aliases for all common route slugs!
const streamingProviderMap: Record<string, number> = {
  // Netflix
  "netflix": 8,

  // Amazon Prime Video
  "prime": 9,
  "amazon-prime": 9,
  "amazonprime": 9,
  "amazon": 9,

  // Hulu
  "hulu": 15,

  // Disney+
  "disney+": 337,
  "disney": 337,

  // HBO Max (aka Max)
  "hbo": 384,
  "hbo-max": 384,
  "max": 384,

  // Apple TV+
  "apple": 350,
  "apple-tv+": 350,
  "appletv": 350,
  "appletv+": 350,
};

// ISO language codes
const languageMap: Record<string, string> = {
  "english": "en",
  "spanish": "es",
  "french": "fr",
  "korean": "ko",
  "japanese": "ja",
  "hindi": "hi",
  "german": "de",
  "italian": "it",
};

// Date ranges for decade buckets
const decadeMap: Record<string, { gte: string; lte: string }> = {
  "2020s": { gte: "2020-01-01", lte: "2029-12-31" },
  "2010s": { gte: "2010-01-01", lte: "2019-12-31" },
  "2000s": { gte: "2000-01-01", lte: "2009-12-31" },
  "1990s": { gte: "1990-01-01", lte: "1999-12-31" },
  "1980s": { gte: "1980-01-01", lte: "1989-12-31" },
  "1970s": { gte: "1970-01-01", lte: "1979-12-31" },
  "1960s": { gte: "1960-01-01", lte: "1969-12-31" },
  // we’ll canonicalize Classic variants to "classic"
  "classic": { gte: "1900-01-01", lte: "1959-12-31" },
};

/* ------------------------------------------------------------------ */
/* Low-level helpers                                                  */
/* ------------------------------------------------------------------ */
function tmdbUrl(endpoint: string): string {
  const sep = endpoint.includes("?") ? "&" : "?";
  return `${TMDB_API_URL}${endpoint}${sep}api_key=${TMDB_API_KEY}&language=en-US`;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

function mapToMovieList(results: any[]): Movie[] {
  return results.map((m: any) => ({
    Title: m.title || m.name || "Untitled",
    Year: m.release_date?.split("-")[0] || "N/A",
    imdbID: m.id?.toString() ?? "0",
    Type: "movie",
    Poster: m.poster_path
      ? `${TMDB_IMAGE_URL}${m.poster_path}`
      : "https://placehold.co/300x450?text=No+Image",
  }));
}

/* ------------------------------------------------------------------ */
/* Internal fetchers                                                  */
/* ------------------------------------------------------------------ */
async function fetchMovies(endpoint: string): Promise<Movie[]> {
  const data = await fetchJson(tmdbUrl(endpoint));
  return mapToMovieList(data.results || []);
}

async function fetchByGenre(genreId: string): Promise<Movie[]> {
  return fetchMovies(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=1`);
}

async function fetchByDecade(decadeKey: string): Promise<Movie[]> {
  const { gte, lte } = decadeMap[decadeKey];
  return fetchMovies(
    `/discover/movie?primary_release_date.gte=${gte}&primary_release_date.lte=${lte}&sort_by=popularity.desc&page=1`
  );
}

async function fetchByLanguage(langCode: string): Promise<Movie[]> {
  return fetchMovies(
    `/discover/movie?with_original_language=${langCode}&sort_by=popularity.desc&page=1`
  );
}

async function fetchByProvider(providerId: number): Promise<Movie[]> {
  return fetchMovies(
    `/discover/movie?with_watch_providers=${providerId}&watch_region=US&sort_by=popularity.desc&page=1`
  );
}

/* ------------------------------------------------------------------ */
/* Canonicalization                                                   */
/* ------------------------------------------------------------------ */
function canonId(raw: string): string {
  // decode %20 etc and normalize punctuation
  let s = decodeURIComponent(raw).trim().toLowerCase();

  // collapse multiple spaces
  s = s.replace(/\s+/g, " ");

  // normalize “classic (pre-1960s)” etc
  if (s.startsWith("classic")) s = "classic";

  // convert some UI labels to keys used in maps (strip non-word except +)
  s = s
    .replace(/&/g, "and")
    .replace(/\s*\(\s*pre-1960s\s*\)/g, "")
    .replace(/\s+/g, "-");

  return s;
}

/* ------------------------------------------------------------------ */
/* Public dispatcher                                                  */
/* ------------------------------------------------------------------ */
export async function getMoviesByCategory(categoryId: string): Promise<Movie[]> {
  if (!categoryId) return [];

  // Raw ID from route might already be canonical (e.g., "28"), but may be label.
  const raw = categoryId;
  const decoded = decodeURIComponent(raw);

  // If it's a *pure number* (TMDB genre id), go straight to genre fetch:
  if (/^\d+$/.test(decoded)) {
    return fetchByGenre(decoded);
  }

  const c = canonId(raw); // canonical lower-case hyphenated version

  // Check provider map
  if (c in streamingProviderMap) {
    return fetchByProvider(streamingProviderMap[c]);
  }

  // Check language map
  if (c in languageMap) {
    return fetchByLanguage(languageMap[c]);
  }

  // Check decade map (note: we saved keys like "2020s", "2010s", but canon turned spaces into hyphens)
  // We'll check both canon and decoded to be safe.
  if (decadeMap[c]) {
    return fetchByDecade(c);
  }
  if (decadeMap[decoded]) {
    return fetchByDecade(decoded);
  }

  // Last try: maybe UI passed “Classic (pre-1960s)” with spaces; normalize:
  if (decoded.toLowerCase().startsWith("classic")) {
    return fetchByDecade("classic");
  }

  // Nothing matched → return empty (or trending fallback if you prefer)
  return [];
}
