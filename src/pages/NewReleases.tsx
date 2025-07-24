import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { MovieList } from "@/components/movies/movie-list";
import { getNewReleases } from "@/lib/tmdb-api"; // <-- updated import
import { motion } from "framer-motion";

export default function NewReleasesPage() {
  useEffect(() => {
    document.title = "New Releases - CineSurfs";
  }, []);

  const { data: newMovies, isLoading, isError } = useQuery({
    queryKey: ["newReleases"],
    queryFn: getNewReleases,
  });

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <motion.header
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif text-4xl font-bold md:text-5xl">New Releases</h1>
          <p className="mt-4 text-muted-foreground">
            Discover the latest movies and TV shows fresh from the studios
          </p>
        </motion.header>

        {isError && (
          <p className="text-center text-red-500">
            Failed to fetch new releases. Please try again later.
          </p>
        )}

        <MovieList title="Latest Releases" movies={newMovies || []} loading={isLoading} />
      </div>
    </MainLayout>
  );
}
