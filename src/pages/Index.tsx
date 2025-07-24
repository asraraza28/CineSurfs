import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { FeaturedMovie } from "@/components/movies/featured-movie";
import { MovieList } from "@/components/movies/movie-list";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ✅ Import TMDB API functions
import { Movie, getTrendingMovies, getWeeklyHighestRated, getMonthlyHighestRated } from "@/lib/tmdb-api";

export default function HomePage() {
  const [featuredMovieId, setFeaturedMovieId] = useState("tt0468569"); // Will replace with TMDB movie ID later

  // ✅ Use TMDB trending movies
  const { data: trendingMovies, isLoading: trendingLoading } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: getTrendingMovies
  });

  const { data: weeklyMovies, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weeklyMovies"],
    queryFn: getWeeklyHighestRated
  });

  const { data: monthlyMovies, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthlyMovies"],
    queryFn: getMonthlyHighestRated
  });

  // Choose a random movie from trending movies to feature
  useEffect(() => {
    if (trendingMovies && trendingMovies.length > 0) {
      const randomIndex = Math.floor(Math.random() * trendingMovies.length);
      setFeaturedMovieId(trendingMovies[randomIndex].imdbID || trendingMovies[randomIndex].id.toString());
    }
  }, [trendingMovies]);

  return (
    <MainLayout>
      {/* Hero Section */}
      <FeaturedMovie imdbId={featuredMovieId} />
      
      {/* Main Content */}
      <div className="container-custom">
        {/* Trending Movies */}
        <MovieList
          title="Trending Movies"
          movies={trendingMovies || []}
          loading={trendingLoading}
          className="border-b border-luxury-gold/20 pb-8"
        />
        
        {/* Weekly & Monthly Highest Rated */}
        <div className="grid grid-cols-1 gap-8 border-b border-luxury-gold/20 py-8 md:grid-cols-2">
          {/* Weekly Section */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-semibold">Weekly Highest Rated</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {weeklyLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-muted"></div>
                ))
              ) : (
                weeklyMovies?.slice(0, 4).map((movie: Movie) => (
                  <Link key={movie.imdbID || movie.id} to={`/movie/${movie.imdbID || movie.id}`} className="block h-full">
                    <motion.div className="movie-card aspect-[2/3] h-full" whileHover={{ scale: 1.03 }}>
                      <img
                        src={movie.Poster}
                        alt={movie.Title}
                        className="h-full w-full rounded-lg object-cover shadow-md transition-shadow hover:shadow-xl"
                      />
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
            <Button asChild variant="link" className="mt-4 text-luxury-gold">
              <Link to="/charts">View all weekly top rated</Link>
            </Button>
          </div>

          {/* Monthly Section */}
          <div>
            <h2 className="mb-4 font-serif text-2xl font-semibold">Monthly Highest Rated</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {monthlyLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-muted"></div>
                ))
              ) : (
                monthlyMovies?.slice(0, 4).map((movie: Movie) => (
                  <Link key={movie.imdbID || movie.id} to={`/movie/${movie.imdbID || movie.id}`} className="block h-full">
                    <motion.div className="movie-card aspect-[2/3] h-full" whileHover={{ scale: 1.03 }}>
                      <img
                        src={movie.Poster}
                        alt={movie.Title}
                        className="h-full w-full rounded-lg object-cover shadow-md transition-shadow hover:shadow-xl"
                      />
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
            <Button asChild variant="link" className="mt-4 text-luxury-gold">
              <Link to="/charts">View all monthly top rated</Link>
            </Button>
          </div>
        </div>

        {/* Call to Action */}
        <div className="my-12 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <h2 className="font-serif text-3xl font-bold md:text-4xl">
              Find Your Next Cinematic Experience
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore thousands of movies and TV shows, discover hidden gems, and keep track of what to watch next.
            </p>
            <Button asChild className="mt-6 bg-luxury-gold text-black hover:bg-luxury-lightGold">
              <Link to="/categories">
                <Search className="mr-2 h-4 w-4" />
                Browse Categories
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
