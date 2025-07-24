import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { MovieDetails as MovieDetailsComponent } from "@/components/movies/movie-details";
import { getMovieDetails, MovieDetails as MovieDetailsType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MovieDetailsPage() {
  const { type, id } = useParams<{ type: string; id: string }>(); // Now using type
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id || !type) {
        setError("Invalid movie or show ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const details = await getMovieDetails(id, type); // Pass type to API
        if (!details) {
          setError("Details not found");
        } else {
          setMovie(details);
          document.title = `${details.Title || details.name} (${details.Year || details.first_air_date?.split("-")[0] || ""}) - CineSurfs`;
        }
      } catch (err) {
        setError("Failed to load details");
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();

    return () => {
      document.title = "CineSurfs - Ride the Waves of Cinematic Excellence";
    };
  }, [id, type]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
            <div className="md:col-span-1">
              <div className="aspect-[2/3] animate-pulse rounded-lg bg-muted"></div>
            </div>
            <div className="md:col-span-2 lg:col-span-3 space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted"></div>
              <div className="h-6 w-1/2 animate-pulse rounded-lg bg-muted"></div>
              <div className="h-24 animate-pulse rounded-lg bg-muted"></div>
              <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !movie) {
    return (
      <MainLayout>
        <div className="container-custom flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
          <h1 className="text-3xl font-bold">Oops, something went wrong!</h1>
          <p className="mt-4 text-muted-foreground">
            {error || "Details could not be loaded"}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline" className="mt-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pt-4 container-custom">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <MovieDetailsComponent movie={movie} />
    </MainLayout>
  );
}
