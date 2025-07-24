import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Calendar,
  Clock,
  Globe,
  Award,
  User,
  Video,
  Play,
  X,
} from "lucide-react";
import {
  MovieDetails as MovieDetailsType,
  Movie,
  getSimilarMovies,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRuntime, formatList, handleImageError } from "@/lib/utils";
import { MovieList } from "./movie-list";
import Trailer from "@/components/movies/Trailer";
import PlayerControls from "@/components/movies/PlayerControls";
import { DownloadButton } from "@/components/movies/DownloadButton";
import axios from "axios";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface MovieDetailsProps {
  movie: MovieDetailsType;
}

/* Prefer env key; fall back to literal for safety (dev only!) */
const TMDB_KEY =
  (import.meta as any).env?.VITE_TMDB_KEY || "870880200e45966e10a1bf95876576f1";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export function MovieDetails({ movie }: MovieDetailsProps) {
  /* ======================= STATE =================================== */

  // Similar titles
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  // Trailer + Player toggles
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Playback UI state
  const [animeEpisode, setAnimeEpisode] = useState(1);
  const [dub, setDub] = useState(false);
  const [skip, setSkip] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(1); // 1=vidsrc,2=vidlink,3=godrive
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Guess TMDB from incoming movie object: if tmdbID present use that; else if imdbID looks numeric, use that.
  const initialTmdbGuess =
    movie.tmdbID
      ? String(movie.tmdbID)
      : movie.imdbID && !movie.imdbID.startsWith("tt")
      ? movie.imdbID
      : "";

  // Resolved IDs (updated by effect below)
  const [tmdbID, setTmdbID] = useState<string>(initialTmdbGuess);
  const [imdbID, setImdbID] = useState<string>(movie.imdbID);

  // Dynamic TV metadata
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<number[]>([]);

  // Derived type flags
  const lowerType = movie.Type?.toLowerCase() || "movie";
  const lowerGenre = movie.Genre?.toLowerCase() || "";
  const isSeries = lowerType === "series";
  const isAnime = lowerType === "anime" || lowerGenre.includes("animation");

  /* ======================= EFFECT: resolve IDs ===================== */
  useEffect(() => {
    let cancelled = false;

    async function resolveIds() {
      let resolvedTmdb = tmdbID;
      let resolvedImdb = imdbID;

      // If we *only* got a TMDB numeric in imdbID (from list view), copy it into tmdb.
      if (!resolvedTmdb && resolvedImdb && !resolvedImdb.startsWith("tt")) {
        resolvedTmdb = resolvedImdb;
      }

      // If we have a real IMDb (tt...) but no TMDB -> /find
      if (!resolvedTmdb && resolvedImdb?.startsWith("tt")) {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/find/${resolvedImdb}`,
            {
              params: {
                api_key: TMDB_KEY,
                external_source: "imdb_id",
              },
            }
          );
          const found =
            res.data.movie_results?.[0]?.id || res.data.tv_results?.[0]?.id;
          if (found) resolvedTmdb = String(found);
        } catch (err) {
          console.error("resolveIds: TMDB find error", err);
        }
      }

      // If we *do* have TMDB but IMDb isn't tt... -> try movie external_ids, then tv external_ids
      if (resolvedTmdb && (!resolvedImdb || !resolvedImdb.startsWith("tt"))) {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/movie/${resolvedTmdb}/external_ids`,
            { params: { api_key: TMDB_KEY } }
          );
          if (res.data?.imdb_id) resolvedImdb = res.data.imdb_id;
        } catch {
          try {
            const res2 = await axios.get(
              `https://api.themoviedb.org/3/tv/${resolvedTmdb}/external_ids`,
              { params: { api_key: TMDB_KEY } }
            );
            if (res2.data?.imdb_id) resolvedImdb = res2.data.imdb_id;
          } catch (err2) {
            console.error("resolveIds external_ids error", err2);
          }
        }
      }

      if (!cancelled) {
        if (resolvedTmdb) setTmdbID(resolvedTmdb);
        if (resolvedImdb) setImdbID(resolvedImdb);
      }
    }

    resolveIds();
    return () => {
      cancelled = true;
    };
    // re-run when incoming movie ids change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.imdbID, movie.tmdbID]);

  /* ======================= EFFECT: similar movies ================== */
  useEffect(() => {
    if (!tmdbID) return;
    let cancelled = false;

    async function loadSimilar() {
      setLoadingSimilar(true);
      try {
        const movies = await getSimilarMovies(tmdbID);
        if (!cancelled) setSimilarMovies(movies);
      } catch (err) {
        console.error("Error fetching similar movies:", err);
      } finally {
        if (!cancelled) setLoadingSimilar(false);
      }
    }

    loadSimilar();
    return () => {
      cancelled = true;
    };
  }, [tmdbID]);

  /* ======================= EFFECT: seasons (TV) ==================== */
  useEffect(() => {
    if (!isSeries || !tmdbID) return;
    let cancelled = false;

    async function loadSeasons() {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/tv/${tmdbID}`,
          { params: { api_key: TMDB_KEY } }
        );
        const total = res.data.number_of_seasons ?? 0;
        if (!cancelled) {
          setAvailableSeasons(Array.from({ length: total }, (_, i) => i + 1));
        }
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
    }

    loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [isSeries, tmdbID]);

  /* ======================= EFFECT: episodes (TV) =================== */
  useEffect(() => {
    if (!isSeries || !tmdbID) return;
    let cancelled = false;

    async function loadEpisodes() {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/tv/${tmdbID}/season/${season}`,
          { params: { api_key: TMDB_KEY } }
        );
        const total = res.data.episodes?.length ?? 0;
        if (!cancelled) {
          setAvailableEpisodes(Array.from({ length: total }, (_, i) => i + 1));
          if (episode > total) setEpisode(total || 1);
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
      }
    }

    loadEpisodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeries, tmdbID, season]);

  /* ======================= PLAYER URL ============================== */
  const playerUrl = useMemo(() => {
    const type = lowerType;

    if (selectedPlayer === 1) {
      // vidsrc
      if (type === "movie") return `https://vidsrc.xyz/embed/movie?imdb=${imdbID}`;
      if (type === "series")
        return `https://vidsrc.xyz/embed/tv?imdb=${imdbID}&season=${season}&episode=${episode}`;
      if (isAnime) {
        return `https://vidsrc.xyz/embed/tv?imdb=${imdbID}&season=1&episode=${animeEpisode}&autoplay=1&ds_lang=${
          dub ? "en" : "ja"
        }`;
      }
    }

    if (selectedPlayer === 2) {
      // vidlink
      if (!tmdbID) return "";
      if (type === "movie") return `https://vidlink.pro/movie/${tmdbID}`;
      if (type === "series")
        return `https://vidlink.pro/tv/${tmdbID}/${season}/${episode}`;
      if (isAnime) {
        return `https://vidlink.pro/anime/${tmdbID}/${animeEpisode}/${dub ? "dub" : "sub"}?fallback=true`;
      }
    }

    if (selectedPlayer === 3) {
      // godrive
      if (!tmdbID) return "";
      if (type === "movie")
        return `https://godriveplayer.com/player.php?imdb=${imdbID}`;
      if (type === "series")
        return `https://godriveplayer.com/player.php?type=series&tmdb=${tmdbID}&season=${season}&episode=${episode}`;
    }

    return "";
  }, [
    selectedPlayer,
    lowerType,
    isAnime,
    imdbID,
    tmdbID,
    season,
    episode,
    animeEpisode,
    dub,
  ]);

  /* ======================= IFRAME HANDLERS ========================= */
  const handlePlay = () => {
    const iframe = document.getElementById("movie-player") as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage("play", "*");
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById("movie-player") as HTMLIFrameElement | null;
    if (!iframe) return;
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if ((iframe as any)?.webkitRequestFullscreen) {
      (iframe as any).webkitRequestFullscreen();
    } else if ((iframe as any)?.msRequestFullscreen) {
      (iframe as any).msRequestFullscreen();
    }
  };

  /* ======================= DOWNLOAD SUPPORT ======================== */
  // Mirror selectedPlayer: Link 2 => vidlink, others => vidsrc
  const downloadSource: "vidsrc" | "vidlink" =
    selectedPlayer === 2 ? "vidlink" : "vidsrc";

  // Provide both IDs; the DownloadButton will pick what it needs
  const downloadTmdbID = tmdbID || (movie.tmdbID ? String(movie.tmdbID) : "");
  const downloadImdbID = imdbID;
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE || "http://localhost:5000";

  /* ======================= RENDER ================================== */
  return (
    <div className="container-custom py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
        {/* Poster + Actions */}
        <div className="md:col-span-1">
          <motion.div
            className="overflow-hidden rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={
                movie.Poster !== "N/A"
                  ? movie.Poster
                  : `https://placehold.co/300x450/1a1a1a/d4af37?text=${encodeURIComponent(
                      movie.Title
                    )}`
              }
              alt={movie.Title}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          </motion.div>

          <div className="mt-6 space-y-4">
            {/* Trailer toggle */}
            <Button
              className="w-full bg-luxury-gold text-black hover:bg-luxury-lightGold"
              onClick={() => setShowTrailer((s) => !s)}
            >
              <Video className="mr-2 h-4 w-4" />
              {showTrailer ? "Hide Trailer" : "Watch Trailer"}
            </Button>

            {/* Player toggle */}
            <Button
              className="w-full bg-luxury-gold text-black hover:bg-luxury-lightGold"
              onClick={() => {
                setShowPlayer((s) => !s);
                setIframeLoaded(false);
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              {showPlayer ? "Hide Player" : "Watch Now"}
            </Button>

            {/* Trailer (basic) */}
            {showTrailer && (
              <Trailer
                title={movie.Title}
                /* If your Trailer component supports these, uncomment:
                tmdbId={tmdbID || movie.tmdbID}
                initialKey={movie.trailerYoutubeKey}
                */
              />
            )}

            {/* Player */}
            {showPlayer && (
              <>
                <PlayerControls
                  type={lowerType}
                  genre={movie.Genre}
                  animeEpisode={animeEpisode}
                  setAnimeEpisode={setAnimeEpisode}
                  dub={dub}
                  setDub={setDub}
                  skip={skip}
                  setSkip={setSkip}
                  season={season}
                  setSeason={setSeason}
                  episode={episode}
                  setEpisode={setEpisode}
                  availableSeasons={availableSeasons}
                  availableEpisodes={availableEpisodes}
                />

                <div className="mt-4 flex gap-2">
                  <Button
                    variant={selectedPlayer === 1 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(1)}
                  >
                    Link 1
                  </Button>
                  <Button
                    variant={selectedPlayer === 2 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(2)}
                  >
                    Link 2
                  </Button>
                  <Button
                    variant={selectedPlayer === 3 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(3)}
                  >
                    Link 3
                  </Button>
                </div>

                <div className="relative mt-4 aspect-video w-full">
                  <button
                    onClick={() => setShowPlayer(false)}
                    className="absolute top-2 right-2 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <iframe
                    id="movie-player"
                    src={playerUrl}
                    allowFullScreen
                    className="h-full w-full rounded-md shadow-lg"
                    frameBorder="0"
                    onLoad={() => setIframeLoaded(true)}
                  />
                  {!iframeLoaded && (
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Loading player...
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button onClick={handlePlay}>Play</Button>
                    <Button onClick={handleFullscreen}>Fullscreen</Button>
                    <DownloadButton
                      tmdbID={downloadTmdbID}
                      imdbID={downloadImdbID}
                      title={movie.Title}
                      source={downloadSource}
                      apiBase={apiBase}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-2 lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              {movie.Title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 text-luxury-gold" />
                <span className="font-medium text-foreground">
                  {movie.imdbRating}/10
                </span>
                <span className="ml-1 text-xs">TMDB</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {movie.Year}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {formatRuntime(movie.Runtime)}
              </div>
              <div className="flex items-center">
                <Globe className="mr-1 h-4 w-4" />
                {movie.Language}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {movie.Genre.split(", ").map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="font-serif text-xl font-semibold">Plot</h2>
              <p className="mt-2 text-muted-foreground">{movie.Plot}</p>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
                  <User className="h-5 w-5" /> Cast
                </h2>
                <div className="mt-2 space-y-2">
                  {formatList(movie.Actors).map((actor) => (
                    <div key={actor} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{actor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
                  <Award className="h-5 w-5" /> Director & Awards
                </h2>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Director:</span>
                    <span className="text-muted-foreground">
                      {movie.Director}
                    </span>
                  </div>
                  {movie.Awards !== "N/A" && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Awards:</span>
                      <span className="text-muted-foreground">
                        {movie.Awards}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Similar */}
      <div className="mt-12">
        <MovieList
          title="You May Also Like"
          movies={similarMovies}
          loading={loadingSimilar}
        />
      </div>
    </div>
  );
}
