import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Film, Info, Database, Code, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About - CineSurfs";
  }, []);

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <motion.header 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <Film className="h-12 w-12 text-luxury-gold" />
          </div>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">About CineSurfs</h1>
          <p className="mt-4 text-muted-foreground">
            Ride the Waves of Cinematic Excellence
          </p>
        </motion.header>

        <motion.div 
          className="mx-auto max-w-3xl space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-luxury-gold" />
              <h2 className="font-serif text-2xl font-semibold">Our Mission</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              CineSurfs is a luxury-style, animated web application designed to help movie enthusiasts discover great films and TV shows. 
              Our platform provides elegant, curated recommendations and detailed information to enhance your cinematic journey.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Whether you're looking for this week's highest-rated releases, all-time classics, or exploring specific genres, 
              CineSurfs offers an immersive and elegant way to discover your next favorite watch.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-luxury-gold" />
              <h2 className="font-serif text-2xl font-semibold">Data Sources</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              CineSurfs uses data from the following sources:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>
                <a 
                  href="https://www.omdbapi.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-luxury-gold hover:underline"
                >
                  OMDb API
                </a> - Our primary source for movie details, ratings, posters, and basic information.
              </li>
              <li>
                <a 
                  href="https://www.themoviedb.org/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-luxury-gold hover:underline"
                >
                  TMDb API
                </a> - Used optionally for enhanced movie recommendations and trending data.
              </li>
              <li>
                <a 
                  href="https://trakt.tv/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-luxury-gold hover:underline"
                >
                  Trakt.tv
                </a> - Used optionally for TV show recommendations.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-luxury-gold" />
              <h2 className="font-serif text-2xl font-semibold">Technology</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              CineSurfs is built with modern web technologies:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
              <li>React.js - Frontend framework</li>
              <li>Tailwind CSS - Styling</li>
              <li>shadcn/ui - UI components</li>
              <li>Framer Motion - Animations</li>
              <li>React Query - Data fetching and caching</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-luxury-gold" />
              <h2 className="font-serif text-2xl font-semibold">Our Values</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              We believe in the transformative power of cinema and its ability to inspire, educate, and entertain.
              CineSurfs is dedicated to celebrating filmmaking as an art form and helping users discover movies 
              that match their taste, mood, and interests.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              We're committed to providing a luxurious, elegant experience that respects your time and attention,
              with thoughtfully designed animations and a clean interface that puts content first.
            </p>
          </section>
        </motion.div>
      </div>
    </MainLayout>
  );
}