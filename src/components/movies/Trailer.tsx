import React, { useEffect, useState } from "react";
import { getYouTubeTrailer } from "@/lib/api"; // ✅ Ensure this points to the correct API file

interface TrailerProps {
  title: string;
}

const Trailer: React.FC<TrailerProps> = ({ title }) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        const id = await getYouTubeTrailer(title);
        setVideoId(id);
      } catch (err) {
        console.error("Trailer fetch failed:", err);
        setVideoId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTrailer();
  }, [title]);

  if (loading) return <p className="text-gray-500 text-center mt-4">Loading trailer...</p>;
  if (!videoId) return <p className="text-gray-500 text-center mt-4">Trailer not available.</p>;

  return (
    <div className="mt-4 aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={`${title} Trailer`}
        className="w-full h-full rounded-md shadow-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default Trailer;
