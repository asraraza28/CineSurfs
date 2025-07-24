import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, PlayCircle } from "lucide-react";
import { MovieDetails, getMovieDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn, formatRuntime, handleImageError } from "@/lib/utils";

interface FeaturedMovieProps {
  imdbId: string;
  className?: string;
}

export function FeaturedMovie({ imdbId, className }: FeaturedMovieProps) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const details = await getMovieDetails(imdbId);
        setMovie(details);
      } catch (error) {
        console.error("Error fetching featured movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [imdbId]);

  if (loading) {
    return (
      <div className={cn("h-[500px] w-full animate-pulse bg-muted", className)}>
        <div className="container-custom flex h-full items-center">
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-12 w-3/4 rounded-md bg-muted-foreground/20"></div>
            <div className="h-8 w-1/2 rounded-md bg-muted-foreground/20"></div>
            <div className="h-24 w-full rounded-md bg-muted-foreground/20"></div>
            <div className="h-10 w-32 rounded-md bg-muted-foreground/20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative h-[500px] w-full overflow-hidden bg-black",
        className
      )}
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : `https://placehold.co/1200x800/1a1a1a/d4af37?text=${encodeURIComponent(movie.Title)}`}
          alt={movie.Title}
          className="h-full w-full object-cover opacity-30"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 flex h-full items-center">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            {movie.Title}
          </h1>
          
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-300">
            <span>{movie.Year}</span>
            <span>•</span>
            <span>{formatRuntime(movie.Runtime)}</span>
            {movie.imdbRating !== "N/A" && (
              <>
                <span>•</span>
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 text-luxury-gold" />
                  <span>{movie.imdbRating}/10</span>
                </div>
              </>
            )}
          </div>
          
          <p className="mt-4 text-gray-200 line-clamp-3">{movie.Plot}</p>
          
          <div className="mt-6 flex flex-wrap gap-2">
            {movie.Genre.split(", ").map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-luxury-gold/20 px-3 py-1 text-xs font-medium text-luxury-gold"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <Button
            onClick={() => navigate(`/movie/${movie.imdbID}`)}
            className="mt-8 bg-luxury-gold text-black hover:bg-luxury-lightGold"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </motion.div>
      </div>
    </div>
  );
}