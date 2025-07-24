import { useState } from "react";
import { Movie } from "@/lib/api";
import { MovieCard } from "./movie-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MovieListProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  error?: string;
  className?: string;
}

export function MovieList({ title, movies, loading = false, error, className }: MovieListProps) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 5; // Number of cards to show at once

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(movies.length - itemsPerPage, prev + 1));
  };

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + itemsPerPage < movies.length;

  // Loading state
  if (loading) {
    return (
      <div className={cn("py-8", className)}>
        <h2 className="mb-6 font-serif text-2xl font-semibold">{title}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-lg bg-muted"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("py-8", className)}>
        <h2 className="mb-6 font-serif text-2xl font-semibold">{title}</h2>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!movies?.length) {
    return (
      <div className={cn("py-8", className)}>
        <h2 className="mb-6 font-serif text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">No movies found.</p>
      </div>
    );
  }

  return (
    <section className={cn("py-8", className)}>
      <div className="flex items-center justify-between">
        <motion.h2 
          className="font-serif text-2xl font-semibold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!canScrollLeft}
            className="rounded-full border-luxury-gold/30"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canScrollRight}
            className="rounded-full border-luxury-gold/30"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.slice(startIndex, startIndex + itemsPerPage).map((movie) => (
          <MovieCard key={movie.imdbID} movie={movie} />
        ))}
      </div>
    </section>
  );
}