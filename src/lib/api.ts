/**
 * CineSurfs TMDB API wrapper
 * --------------------------
 * All data comes from TMDB. Results are mapped into your legacy Movie/MovieDetails
 * shapes so the rest of the app keeps working. For list endpoints we store the
 * TMDB numeric ID in the `imdbID` field (legacy name); we later resolve a real
 * IMDb id (if needed) in the MovieDetails component.
 *
 * IMPORTANT: move keys to .env in production:
 *   VITE_TMDB_KEY=...
 *   VITE_YOUTUBE_KEY=...
 */

import { SearchParams, CategoryParams } from "@/types"; // kept for compatibility

/* ───────────────────────────────── Interfaces ─────────────────────────────── */
export interface Movie {
  Title: string;
  Year: string;
  imdbID: string; // TMDB id as string in list calls; real IMDb fetched in detail view
  Type: string;
  Poster: string;
}

export interface SearchResponse {
  Search: Movie[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;  // real IMDb id if TMDB supplies it; else TMDB id
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  // enrichments
  backdropPath?: string;
  tagline?: string;
  tmdbID?: number;
  trailerYoutubeKey?: string | null;
}

/* ───────────────────────────────── Config ─────────────────────────────────── */
const TMDB_API_KEY =
  (import.meta as any).env?.VITE_TMDB_KEY || "870880200e45966e10a1bf95876576f1";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BACKDROP = "https://image.tmdb.org/t/p/original";

const YOUTUBE_API_KEY =
  (import.meta as any).env?.VITE_YOUTUBE_KEY || ""; // leave blank fallback if not set

/* ─────────────────────────────── Genre List ───────────────────────────────── */
export const genres = [
  { id: "28", name: "Action" },
  { id: "18", name: "Drama" },
  { id: "35", name: "Comedy" },
  { id: "10749", name: "Romance" },
  { id: "53", name: "Thriller" },
  { id: "27", name: "Horror" },
  { id: "878", name: "Sci-Fi" },
  { id: "16", name: "Animation" },
  { id: "12", name: "Adventure" },
  { id: "14", name: "Fantasy" },
];

/* ───────────────────────────── Helper Functions ───────────────────────────── */
async function fetchFromAPI(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

function tmdbUrl(endpoint: string): string {
  const sep = endpoint.includes("?") ? "&" : "?";
  return `${TMDB_API_URL}${endpoint}${sep}api_key=${TMDB_API_KEY}&language=en-US`;
}

function posterUrl(path?: string | null, label: string = "No Image"): string {
  return path
    ? `${TMDB_IMAGE_URL}${path}`
    : `https://placehold.co/300x450?text=${encodeURIComponent(label)}`;
}

function mapToMovieList(results: any[]): Movie[] {
  return results.map((m: any) => ({
    Title: m.title || m.name || "Untitled",
    Year: m.release_date?.split("-")[0] || "N/A",
    imdbID: m.id?.toString() ?? "0", // TMDB id as string
    Type: "movie",
    Poster: posterUrl(m.poster_path, m.title || m.name),
  }));
}

function pickYoutubeTrailerKey(videos: any[]): string | null {
  if (!videos?.length) return null;
  const official =
    videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v: any) => v.site === "YouTube");
  return official ? official.key : null;
}

/* ───────────────────────────── Search (title) ─────────────────────────────── */
/**
 * Unified search across Movies + TV using TMDB /search/multi.
 * Filters out "person" media_type, promotes exact/starts-with matches,
 * then sorts by popularity so well-known titles (e.g., "Friends") float up.
 */
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<{ results: Movie[]; total: number }> {
  const q = query.trim();
  if (!q) return { results: [], total: 0 };

  const data = await fetchFromAPI(
    tmdbUrl(
      `/search/multi?query=${encodeURIComponent(q)}&page=${page}&include_adult=false`
    )
  );

  const qNorm = normalizeTitle(q);

  // Keep only movie & tv
  const usable: any[] = (data.results || []).filter(
    (r: any) => r.media_type === "movie" || r.media_type === "tv"
  );

  // Score & sort
  usable.sort((a: any, b: any) => scoreCandidate(b, qNorm) - scoreCandidate(a, qNorm));

  // Map to legacy Movie shape
  const results: Movie[] = usable.map((m: any) => ({
    Title: m.title || m.name || "Untitled",
    Year: (m.release_date || m.first_air_date || "").split("-")[0] || "N/A",
    imdbID: m.id?.toString() ?? "0",
    Type: m.media_type === "tv" ? "series" : "movie",
    Poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : "https://placehold.co/300x450?text=No+Image",
  }));

  return {
    results,
    total: data.total_results || results.length,
  };
}

/* ---------- relevance helpers ---------- */

/** normalize: lowercase, trim, strip punctuation */
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD") // strip accents
    .replace(/[’'"]/g, "") // apostrophes/quotes
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** score TMDB search result for given normalized query */
function scoreCandidate(r: any, qNorm: string): number {
  const titleRaw = r.title || r.name || "";
  const tNorm = normalizeTitle(titleRaw);

  let base = 0;
  if (tNorm === qNorm) base = 10000;              // perfect match
  else if (tNorm.startsWith(qNorm)) base = 8000;  // starts with
  else if (tNorm.includes(qNorm)) base = 5000;    // contains

  // token overlap bonus
  const qTokens = new Set(qNorm.split(" "));
  const tTokens = new Set(tNorm.split(" "));
  let overlap = 0;
  qTokens.forEach((qt) => {
    if (tTokens.has(qt)) overlap++;
  });
  base += overlap * 200;

  // popularity & votes (safeguards)
  const pop = typeof r.popularity === "number" ? r.popularity : 0;
  const votes = typeof r.vote_count === "number" ? r.vote_count : 0;
  // lightly weight both
  return base + pop * 5 + votes;
}


/* ───────────────────────────── Movie Details ──────────────────────────────── */
export async function getMovieDetails(id: string, type: string = "movie"): Promise<MovieDetails> {
  const endpoint = type === "series" ? `/tv/${id}?append_to_response=credits,videos,external_ids`
                                     : `/movie/${id}?append_to_response=credits,videos,external_ids`;

  const data = await fetchFromAPI(tmdbUrl(endpoint));

  const director =
    data.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Unknown";
  const writers =
    data.credits?.crew
      ?.filter((c: any) => c.department === "Writing")
      .map((w: any) => w.name)
      .join(", ") || "Unknown";
  const cast =
    data.credits?.cast?.slice(0, 5).map((a: any) => a.name).join(", ") || "N/A";
  const genreNames = data.genres?.map((g: any) => g.name).join(", ") || "N/A";
  const year = (data.release_date || data.first_air_date || "").split("-")[0] || "N/A";
  const imdbId = data.external_ids?.imdb_id || data.id?.toString() || "0";
  const ytKey = pickYoutubeTrailerKey(data.videos?.results || []);

  return {
    Title: data.title || data.name,
    Year: year,
    Rated: data.adult ? "R" : "PG",
    Released: data.release_date || data.first_air_date || "N/A",
    Runtime: data.runtime ? `${data.runtime} min` : (data.episode_run_time?.[0] ? `${data.episode_run_time[0]} min` : "N/A"),
    Genre: genreNames,
    Director: director,
    Writer: writers,
    Actors: cast,
    Plot: data.overview || "N/A",
    Language: data.original_language || "N/A",
    Country: data.production_countries?.map((c: any) => c.name).join(", ") || "N/A",
    Awards: "N/A",
    Poster: posterUrl(data.poster_path, data.title || data.name),
    Ratings: [
      {
        Source: "TMDB",
        Value: data.vote_average ? data.vote_average.toFixed(1) : "N/A",
      },
    ],
    Metascore: "N/A",
    imdbRating: data.vote_average ? data.vote_average.toFixed(1) : "N/A",
    imdbVotes: data.vote_count?.toString() ?? "N/A",
    imdbID: imdbId,
    Type: type === "series" ? "series" : "movie",
    DVD: "N/A",
    BoxOffice: data.revenue ? `$${data.revenue.toLocaleString()}` : "N/A",
    Production: data.production_companies?.map((c: any) => c.name).join(", ") || "N/A",
    Website: data.homepage || "",
    Response: "True",
    backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BACKDROP}${data.backdrop_path}` : undefined,
    tagline: data.tagline || undefined,
    tmdbID: data.id,
    trailerYoutubeKey: ytKey,
  };
}



/* ───────────────────────────── List Endpoints ─────────────────────────────── */
export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await fetchFromAPI(tmdbUrl(`/trending/movie/week`));
  return mapToMovieList(data.results || []);
}

export async function getWeeklyHighestRated(): Promise<Movie[]> {
  const data = await fetchFromAPI(
    tmdbUrl(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=100&page=1`)
  );
  return mapToMovieList(data.results || []);
}

export async function getMonthlyHighestRated(): Promise<Movie[]> {
  const year = new Date().getFullYear();
  const data = await fetchFromAPI(
    tmdbUrl(
      `/discover/movie?sort_by=vote_average.desc&primary_release_year=${year}&vote_count.gte=50&page=1`
    )
  );
  return mapToMovieList(data.results || []);
}

export async function getAllTimeClassics(): Promise<Movie[]> {
  const data = await fetchFromAPI(
    tmdbUrl(`/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&page=1`)
  );
  return mapToMovieList(data.results || []);
}

export async function getNewReleases(): Promise<Movie[]> {
  const data = await fetchFromAPI(tmdbUrl(`/movie/now_playing?page=1`));
  return mapToMovieList(data.results || []);
}

/* ───────────────────────────── Genre Filter ───────────────────────────────── */
export async function getMoviesByGenre(genreId: string): Promise<Movie[]> {
  const data = await fetchFromAPI(
    tmdbUrl(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=1`)
  );
  return mapToMovieList(data.results || []);
}

/* ───────────────────────────── Similar Movies ─────────────────────────────── */
export async function getSimilarMovies(id: string): Promise<Movie[]> {
  const data = await fetchFromAPI(tmdbUrl(`/movie/${id}/similar?page=1`));
  return mapToMovieList(data.results || []);
}

/* ───────────────────────────── Trailer Search (fallback) ────────────────────
   NOTE: Prefer using `movie.trailerYoutubeKey` from `getMovieDetails`!
   This function is a fallback when you only have a title string.
   It tries TMDB search -> TMDB videos -> YouTube API (if key present).
*/
export async function getYouTubeTrailer(movieTitle: string): Promise<string | null> {
  try {
    console.log("getYouTubeTrailer() title =", movieTitle);
    console.log("YT key present? ", Boolean(YOUTUBE_API_KEY));

    // Try TMDB search
    const searchData = await fetchFromAPI(
      tmdbUrl(`/search/movie?query=${encodeURIComponent(movieTitle)}`)
    );
    if (searchData.results?.length) {
      const movieId = searchData.results[0].id;
      const videoData = await fetchFromAPI(
        tmdbUrl(`/movie/${movieId}/videos`)
      );
      const k = pickYoutubeTrailerKey(videoData.results || []);
      if (k) return k;
    }

    // YouTube fallback (only if key defined)
    if (YOUTUBE_API_KEY) {
      const q = `${movieTitle} official trailer`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(
        q
      )}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.items?.length ? data.items[0].id.videoId : null;
    }

    return null;
  } catch (err) {
    console.error("YouTube trailer fetch error:", err);
    return null;
  }
}
