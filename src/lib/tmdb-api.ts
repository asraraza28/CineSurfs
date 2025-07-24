/* TMDB-backed API utilities (CineSurfs)
 * -------------------------------------
 * - Preserves legacy Movie / MovieDetails interfaces so existing UI works.
 * - Uses TMDB for all real data (trending, new releases, charts, search, details, genre, similar).
 * - Pulls IMDb IDs via TMDB external_ids (important for 3rd-party players).
 *
 * NOTE: Put keys in .env for production:
 *   VITE_TMDB_KEY=...
 *   VITE_YOUTUBE_KEY=...
 */

/* ─────────────────────────── Interfaces ─────────────────────────── */
export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;   // TMDB id in lists; may become IMDb id in details
  Type: string;     // "movie" (lists) / "series" if you extend later
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
  imdbID: string; // real IMDb if available; else TMDB id
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

/* ─────────────────────────── Config ─────────────────────────── */
const TMDB_API_KEY =
  (import.meta as any).env?.VITE_TMDB_KEY || "870880200e45966e10a1bf95876576f1";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BACKDROP = "https://image.tmdb.org/t/p/original";

// YouTube key is optional; if unset we just won't hit YouTube fallback.
const YT_KEY = (import.meta as any).env?.VITE_YOUTUBE_KEY || "";

/* ─────────────────────────── Genres ─────────────────────────── */
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

/* ─────────────────────────── Helpers ─────────────────────────── */
async function fetchFromTMDB(endpoint: string): Promise<any> {
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${TMDB_API_URL}${endpoint}${sep}api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

function posterUrl(path?: string | null, titleForFallback: string = "No Image"): string {
  return path
    ? `${TMDB_IMAGE_URL}${path}`
    : `https://placehold.co/300x450?text=${encodeURIComponent(titleForFallback)}`;
}

function mapToMovieList(results: any[]): Movie[] {
  return results.map((m: any) => ({
    Title: m.title || m.name || "Untitled",
    Year: m.release_date ? m.release_date.split("-")[0] : "N/A",
    imdbID: m.id?.toString() ?? "0", // TMDB id string
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

/* ─────────────────────────── Lists ─────────────────────────── */
// Trending (weekly)
export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/trending/movie/week`);
  return mapToMovieList(data.results || []);
}

// Weekly Highest Rated (quality: vote avg + min vote count)
export async function getWeeklyHighestRated(): Promise<Movie[]> {
  const data = await fetchFromTMDB(
    `/discover/movie?sort_by=vote_average.desc&vote_count.gte=100&page=1`
  );
  return mapToMovieList(data.results || []);
}

// Monthly Highest Rated (current year to keep it fresh)
export async function getMonthlyHighestRated(): Promise<Movie[]> {
  const year = new Date().getFullYear();
  const data = await fetchFromTMDB(
    `/discover/movie?sort_by=vote_average.desc&primary_release_year=${year}&vote_count.gte=50&page=1`
  );
  return mapToMovieList(data.results || []);
}

// All-Time Classics (higher vote gate)
export async function getAllTimeClassics(): Promise<Movie[]> {
  const data = await fetchFromTMDB(
    `/discover/movie?sort_by=vote_average.desc&vote_count.gte=500&page=1`
  );
  return mapToMovieList(data.results || []);
}

// New Releases (Now Playing)
export async function getNewReleases(): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/now_playing?page=1`);
  return mapToMovieList(data.results || []);
}

/* ─────────────────────────── Search ─────────────────────────── */
export async function searchMovies(query: string, page: number = 1): Promise<SearchResponse> {
  const data = await fetchFromTMDB(
    `/search/movie?query=${encodeURIComponent(query)}&page=${page}`
  );
  return {
    Search: mapToMovieList(data.results || []),
    totalResults: data.total_results?.toString() ?? "0",
    Response: "True",
  };
}

/* ─────────────────────────── Details ─────────────────────────── */
export async function getMovieDetails(id: string): Promise<MovieDetails> {
  const data = await fetchFromTMDB(
    `/movie/${id}?append_to_response=credits,videos,external_ids`
  );

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
  const year = data.release_date?.split("-")[0] || "N/A";
  const imdbId = data.external_ids?.imdb_id || data.id?.toString() || "0";
  const ytKey = pickYoutubeTrailerKey(data.videos?.results || []);

  return {
    Title: data.title,
    Year: year,
    Rated: data.adult ? "R" : "PG",
    Released: data.release_date || "N/A",
    Runtime: data.runtime ? `${data.runtime} min` : "N/A",
    Genre: genreNames,
    Director: director,
    Writer: writers,
    Actors: cast,
    Plot: data.overview || "N/A",
    Language: data.original_language || "N/A",
    Country: data.production_countries?.map((c: any) => c.name).join(", ") || "N/A",
    Awards: "N/A",
    Poster: posterUrl(data.poster_path, data.title),
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
    Type: "movie",
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

/* ─────────────────────────── Similar ─────────────────────────── */
export async function getSimilarMovies(id: string): Promise<Movie[]> {
  const data = await fetchFromTMDB(`/movie/${id}/similar?page=1`);
  return mapToMovieList(data.results || []);
}

/* ─────────────────────────── Genre Filter ────────────────────── */
export async function getMoviesByGenre(genreId: string): Promise<Movie[]> {
  const data = await fetchFromTMDB(
    `/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=1`
  );
  return mapToMovieList(data.results || []);
}

/* ─────────────────────────── Trailer Fallback ──────────────────
   Use this when you *don't* already have trailerYoutubeKey from getMovieDetails().
   Tries TMDB first, then optional YouTube search if YT_KEY set. */
export async function getYouTubeTrailer(movieTitle: string): Promise<string | null> {
  try {
    console.log("YT_KEY =", import.meta.env.VITE_YOUTUBE_KEY);
    console.log("🔍 Searching trailer for:", movieTitle);

    // 1. TMDB lookup
    const searchData = await fetchFromTMDB(
      `/search/movie?query=${encodeURIComponent(movieTitle)}`
    );
    if (searchData.results?.length) {
      const movieId = searchData.results[0].id;
      const videoData = await fetchFromTMDB(`/movie/${movieId}/videos`);
      const tmdbTrailer = pickYoutubeTrailerKey(videoData.results || []);
      if (tmdbTrailer) {
        console.log("✅ TMDB trailer found:", tmdbTrailer);
        return tmdbTrailer;
      }
    }

    // 2. YouTube fallback (only if key present)
    if (YT_KEY) {
      const ytQuery = `${movieTitle} official trailer`;
      console.log("⚠ No TMDB trailer, falling back to YouTube search:", ytQuery);

      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(
          ytQuery
        )}&key=${YT_KEY}`
      );
      const ytData = await ytRes.json();
      console.log("YouTube response:", ytData);
      const fallbackId = ytData.items?.[0]?.id?.videoId;
      if (fallbackId) {
        console.log("✅ YouTube fallback trailer:", fallbackId);
        return fallbackId;
      }
    } else {
      console.warn("⚠ YouTube fallback skipped: no VITE_YOUTUBE_KEY set.");
    }

    console.warn("❌ No trailer found for:", movieTitle);
    return null;
  } catch (err) {
    console.error("YouTube trailer lookup failed:", err);
    return null;
  }
}
