import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { MovieCard } from "@/components/movies/movie-card";
import { genres, Movie } from "@/lib/api";
import { decades, languages, streamingPlatforms } from "@/types";
import { motion } from "framer-motion";
import { getMoviesByCategory } from "@/lib/category-api";

export default function CategoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!id) return;

    const getCategoryName = () => {
      const genre = genres.find((g) => g.id === id);
      if (genre) {
        setCategoryName(genre.name);
        document.title = `${genre.name} Movies - CineSurfs`;
        return;
      }

      const decade = decades.find((d) => d.id === id);
      if (decade) {
        setCategoryName(decade.name);
        document.title = `${decade.name} Movies - CineSurfs`;
        return;
      }

      const language = languages.find((l) => l.id === id);
      if (language) {
        setCategoryName(language.name);
        document.title = `${language.name} Movies - CineSurfs`;
        return;
      }

      const platform = streamingPlatforms.find((p) => p.id === id);
      if (platform) {
        setCategoryName(platform.name);
        document.title = `${platform.name} Movies - CineSurfs`;
        return;
      }

      setCategoryName(id.charAt(0).toUpperCase() + id.slice(1));
      document.title = `${id} Movies - CineSurfs`;
    };

    const fetchMoviesByCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await getMoviesByCategory(id);
        setMovies(results);
      } catch (err) {
        console.error(`Error fetching ${id} movies:`, err);
        setError(`Failed to load movies for ${id}`);
      } finally {
        setLoading(false);
      }
    };

    getCategoryName();
    fetchMoviesByCategory();
  }, [id]);

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <header className="mb-8">
          <motion.h1
            className="font-serif text-3xl font-bold md:text-4xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {categoryName} Movies & Shows
          </motion.h1>
          <motion.p
            className="mt-2 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Explore the best titles in {categoryName ? categoryName.toLowerCase() : "this category"}
          </motion.p>
        </header>

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
          </div>
        ) : movies.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <p className="text-xl text-muted-foreground">No movies found in this category</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {movies.map((movie) => (
              <MovieCard key={movie.imdbID} movie={movie} />
            ))}
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
