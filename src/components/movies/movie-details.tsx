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
import axios from "axios";
import { BetaPlayer } from "@/components/movies/BetaPlayer";

interface MovieDetailsProps {
  movie: MovieDetailsType;
}

const TMDB_KEY =
  (import.meta as any).env?.VITE_TMDB_KEY || "870880200e45966e10a1bf95876576f1";

export function MovieDetails({ movie }: MovieDetailsProps) {
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [animeEpisode, setAnimeEpisode] = useState(1);
  const [dub, setDub] = useState(false);
  const [skip, setSkip] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(1); // 1=2embed, 2=vidsrc, 3=vidlink, 4=godrive
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const [showBeta, setShowBeta] = useState(false);
  const [betaSrc, setBetaSrc] = useState("");

  const initialTmdbGuess =
    movie.tmdbID
      ? String(movie.tmdbID)
      : movie.imdbID && !movie.imdbID.startsWith("tt")
      ? movie.imdbID
      : "";

  const [tmdbID, setTmdbID] = useState<string>(initialTmdbGuess);
  const [imdbID, setImdbID] = useState<string>(movie.imdbID);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<number[]>([]);

  const lowerType = movie.Type?.toLowerCase() || "movie";
  const lowerGenre = movie.Genre?.toLowerCase() || "";
  const isSeries = lowerType === "series";
  const isAnime = lowerType === "anime" || lowerGenre.includes("animation");

  // ID resolution logic
  useEffect(() => {
    let cancelled = false;
    async function resolveIds() {
      let resolvedTmdb = tmdbID;
      let resolvedImdb = imdbID;
      if (!resolvedTmdb && resolvedImdb && !resolvedImdb.startsWith("tt")) {
        resolvedTmdb = resolvedImdb;
      }
      if (!resolvedTmdb && resolvedImdb?.startsWith("tt")) {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/find/${resolvedImdb}`,
            { params: { api_key: TMDB_KEY, external_source: "imdb_id" } }
          );
          const found =
            res.data.movie_results?.[0]?.id || res.data.tv_results?.[0]?.id;
          if (found) resolvedTmdb = String(found);
        } catch (err) {
          console.error("resolveIds: TMDB find error", err);
        }
      }
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
  }, [movie.imdbID, movie.tmdbID]);

  // Similar movies
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

  // Seasons
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
        if (!cancelled)
          setAvailableSeasons(Array.from({ length: total }, (_, i) => i + 1));
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
    }
    loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [isSeries, tmdbID]);

  // Episodes
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
    return () => {
      cancelled = true;
    };
  }, [isSeries, tmdbID, season]);

  // Compose current player URL
  const playerUrl = useMemo(() => {
    const type = lowerType;

    // 1: 2Embed
    if (selectedPlayer === 1) {
      if (type === "movie") return `https://www.2embed.cc/embed/${imdbID}`;
      if (type === "series")
        return `https://www.2embed.cc/embedtv/${imdbID}&s=${season}&e=${episode}`;
      if (isAnime) {
        return `https://www.2embed.cc/anime/${encodeURIComponent(
          movie.Title.toLowerCase().replace(/\s+/g, "-")
        )}-${animeEpisode}`;
      }
    }

    // 2: Vidsrc
    if (selectedPlayer === 2) {
      if (type === "movie") return `https://vidsrc.xyz/embed/movie?imdb=${imdbID}`;
      if (type === "series")
        return `https://vidsrc.xyz/embed/tv?imdb=${imdbID}&season=${season}&episode=${episode}`;
      if (isAnime) {
        return `https://vidsrc.xyz/embed/tv?imdb=${imdbID}&season=1&episode=${animeEpisode}&autoplay=1&ds_lang=${
          dub ? "en" : "ja"
        }`;
      }
    }

    // 3: Vidlink
    if (selectedPlayer === 3) {
      if (!tmdbID) return "";
      if (type === "movie") return `https://vidlink.pro/movie/${tmdbID}`;
      if (type === "series")
        return `https://vidlink.pro/tv/${tmdbID}/${season}/${episode}`;
      if (isAnime) {
        return `https://vidlink.pro/anime/${tmdbID}/${animeEpisode}/${
          dub ? "dub" : "sub"
        }?fallback=true`;
      }
    }

    // 4: GoDrive
    if (selectedPlayer === 4) {
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
    movie.Title,
  ]);

  const handleFullscreen = () => {
    const iframe = document.getElementById(
      "movie-player"
    ) as HTMLIFrameElement | null;
    if (!iframe) return;
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if ((iframe as any)?.webkitRequestFullscreen) {
      (iframe as any).webkitRequestFullscreen();
    } else if ((iframe as any)?.msRequestFullscreen) {
      (iframe as any).msRequestFullscreen();
    }
  };

  const handleBetaClick = async () => {
    try {
      const source =
        selectedPlayer === 1
          ? "2embed"
          : selectedPlayer === 2
          ? "vidsrc"
          : selectedPlayer === 3
          ? "vidlink"
          : "godrive";

      const usedImdbID = imdbID.startsWith("tt") ? imdbID : `tt${imdbID}`;
      const res = await fetch(
        `/api/video-links?source=${source}&id=${encodeURIComponent(usedImdbID)}`
      );
      const data = await res.json();
      let m3u8Url: string | null = null;
      if (Array.isArray(data)) {
        m3u8Url =
          data.find((q: any) => q.url && q.url.endsWith(".m3u8"))?.url ||
          data[0]?.url;
      }
      if (m3u8Url && m3u8Url.endsWith(".m3u8")) {
        setBetaSrc(m3u8Url);
        setShowBeta(true);
      } else {
        alert("No direct HLS stream available for Beta player.");
      }
    } catch (err) {
      alert("Unable to load Beta player stream.");
    }
  };

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
            <Button
              className="w-full bg-luxury-gold text-black hover:bg-luxury-lightGold"
              onClick={() => setShowTrailer((s) => !s)}
            >
              <Video className="mr-2 h-4 w-4" />
              {showTrailer ? "Hide Trailer" : "Watch Trailer"}
            </Button>
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
            {showTrailer && <Trailer title={movie.Title} />}

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
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    variant={selectedPlayer === 1 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(1)}
                  >
                    2Embed
                  </Button>
                  <Button
                    variant={selectedPlayer === 2 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(2)}
                  >
                    Vidsrc
                  </Button>
                  <Button
                    variant={selectedPlayer === 3 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(3)}
                  >
                    Vidlink
                  </Button>
                  <Button
                    variant={selectedPlayer === 4 ? "default" : "outline"}
                    onClick={() => setSelectedPlayer(4)}
                  >
                    GoDrive
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
                    <Button onClick={handleFullscreen}>Fullscreen</Button>
                    <Button variant="outline" onClick={handleBetaClick}>
                      Beta
                    </Button>
                  </div>
                </div>
                {showBeta && betaSrc && (
                  <BetaPlayer src={betaSrc} onClose={() => setShowBeta(false)} />
                )}
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

      {/* Similar movies */}
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
