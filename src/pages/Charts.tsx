import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tab, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/main-layout";
import { MovieList } from "@/components/movies/movie-list";
import { 
  getTrendingMovies,       // updated here
  getMonthlyHighestRated, 
  getAllTimeClassics 
} from "@/lib/tmdb-api";  // switched to TMDB
import { motion } from "framer-motion";

export default function ChartsPage() {
  useEffect(() => {
    document.title = "Top Charts - CineSurfs";
  }, []);

  const { data: weeklyMovies, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weeklyMoviesChart"],
    queryFn: getTrendingMovies   // <-- updated from getWeeklyHighestRated
  });
  
  const { data: monthlyMovies, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthlyMoviesChart"],
    queryFn: getMonthlyHighestRated
  });
  
  const { data: allTimeMovies, isLoading: allTimeLoading } = useQuery({
    queryKey: ["allTimeMovies"],
    queryFn: getAllTimeClassics
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
          <h1 className="font-serif text-4xl font-bold md:text-5xl">Top Charts</h1>
          <p className="mt-4 text-muted-foreground">
            Discover the highest rated movies and TV shows of all time, this month, and this week
          </p>
        </motion.header>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="mb-8 w-full justify-center">
            <TabsTrigger value="weekly" className="text-sm md:text-base">Weekly Top Rated</TabsTrigger>
            <TabsTrigger value="monthly" className="text-sm md:text-base">Monthly Top Rated</TabsTrigger>
            <TabsTrigger value="alltime" className="text-sm md:text-base">All Time Classics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly">
            <MovieList
              title="Weekly Top Rated"
              movies={weeklyMovies || []}
              loading={weeklyLoading}
            />
          </TabsContent>
          
          <TabsContent value="monthly">
            <MovieList
              title="Monthly Top Rated"
              movies={monthlyMovies || []}
              loading={monthlyLoading}
            />
          </TabsContent>
          
          <TabsContent value="alltime">
            <MovieList
              title="All Time Classics"
              movies={allTimeMovies || []}
              loading={allTimeLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
