import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { MovieCard } from "@/components/movies/movie-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchMovies, Movie } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);

  // TMDB returns 20 results per page
  const totalPages = Math.ceil(totalResults / 20);

  // local re-rank
  const rankedMovies = useMemo(() => {
    if (!query) return movies;
    const qNorm = normalizeTitle(query);
    const scored = movies.map((m) => ({
      m,
      s: scoreMovie(m, qNorm),
    }));
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.m);
  }, [movies, query]);

  useEffect(() => {
    document.title = `Search: ${query || "Search"} - CineSurfs`;

    const fetchMovies = async () => {
      if (!query) {
        setMovies([]);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { results, total } = await searchMovies(query, currentPage);
        if (results.length > 0) {
          setMovies(results);
          setTotalResults(total);
        } else {
          setError("No movies found");
          setMovies([]);
          setTotalResults(0);
        }
      } catch (err) {
        console.error("Error searching movies:", err);
        setError("An error occurred while searching");
        setMovies([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [query, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ q: query, page: newPage.toString() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            Search Results
          </h1>

          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search movies and TV shows..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </header>

        {query && (
          <p className="mb-6 text-muted-foreground">
            {loading
              ? "Searching..."
              : error
              ? error
              : `Found ${totalResults} results for "${query}"`}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-lg bg-muted"
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <p className="text-xl text-muted-foreground">{error}</p>
            <p className="mt-4">Try searching for something else.</p>
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {rankedMovies.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} />
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                <span className="flex items-center text-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

/* ---------- local relevance helpers ---------- */
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMovie(m: Movie, qNorm: string): number {
  const tNorm = normalizeTitle(m.Title);
  let base = 0;
  if (tNorm === qNorm) base = 10000;
  else if (tNorm.startsWith(qNorm)) base = 8000;
  else if (tNorm.includes(qNorm)) base = 5000;

  // token overlap
  const qTokens = new Set(qNorm.split(" "));
  const tTokens = new Set(tNorm.split(" "));
  let overlap = 0;
  qTokens.forEach((qt) => {
    if (tTokens.has(qt)) overlap++;
  });
  base += overlap * 200;

  // slight bonus to series for very common words (user often searches shows)
  if (m.Type === "series") base += 50;

  return base;
}
