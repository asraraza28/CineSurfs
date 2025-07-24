import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Info } from "lucide-react";
import { Movie } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { handleImageError } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
}

export function MovieCard({ movie, priority = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const detailsLink = `/${movie.Type}/${movie.imdbID}`;

  // Some list calls don't include rating/genre; guard them.
  const rating = (movie as any).imdbRating as string | undefined;
  const genreStr = (movie as any).Genre as string | undefined;
  const genres = genreStr ? genreStr.split(", ").slice(0, 2) : [];

  const posterSrc =
    movie.Poster !== "N/A"
      ? movie.Poster
      : `https://placehold.co/300x450/1a1a1a/d4af37?text=${encodeURIComponent(
          movie.Title
        )}`;

  return (
    <motion.div
      className="group movie-card aspect-[2/3] h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full overflow-hidden rounded-lg">
        {/* Poster is the primary clickable target */}
        <Link to={detailsLink} aria-label={`${movie.Title} details`}>
          <img
            src={posterSrc}
            alt={movie.Title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
            onError={handleImageError}
            loading={priority ? "eager" : "lazy"}
          />
        </Link>

        {/* Hover overlay.
            pointer-events-none lets clicks through to the poster <Link>.
            Re‑enable pointer events for the interactive footer area. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="pointer-events-auto absolute bottom-0 w-full p-4 text-white">
            <h3 className="font-serif text-lg font-semibold leading-tight line-clamp-2">
              {movie.Title}
            </h3>

            <div className="mt-1 flex items-center text-sm">
              <span>{movie.Year}</span>
              {rating && (
                <>
                  <span className="mx-2">•</span>
                  <Star className="mr-1 h-3.5 w-3.5 text-luxury-gold" />
                  <span>{rating}</span>
                </>
              )}
            </div>

            {genres.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {genres.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            <Link to={detailsLink} className="mt-3 block">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-black"
              >
                <Info className="mr-1 h-3.5 w-3.5" />
                Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Animated shine effect on hover */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}
      </div>
    </motion.div>
  );
}
