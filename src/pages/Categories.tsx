import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { CategoryCard } from "@/components/movies/category-card";
import { genres } from "@/lib/api";
import { decades, languages, streamingPlatforms } from "@/types";
import { 
  Film, 
  CalendarClock, 
  Globe, 
  Radio, 
  Tv,
  Clapperboard,
  ThumbsUp,
  Heart,
  Popcorn,
  Ghost,
  Laugh,
  Drama,
  AlarmClock,
  Rocket,
  Wand,
  User2 
} from "lucide-react";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  useEffect(() => {
    document.title = "Categories - CineSurfs";
  }, []);

  // Animation variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Icon mapping for genres
  const genreIcons: Record<string, JSX.Element> = {
    "action": <Clapperboard className="h-8 w-8" />,
    "drama": <Drama className="h-8 w-8" />,
    "comedy": <Laugh className="h-8 w-8" />,
    "romance": <Heart className="h-8 w-8" />,
    "thriller": <AlarmClock className="h-8 w-8" />,
    "horror": <Ghost className="h-8 w-8" />,
    "sci-fi": <Rocket className="h-8 w-8" />,
    "animation": <Popcorn className="h-8 w-8" />,
    "adventure": <ThumbsUp className="h-8 w-8" />,
    "fantasy": <Wand className="h-8 w-8" />
  };

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <header className="mb-12 text-center">
          <motion.h1 
            className="font-serif text-4xl font-bold md:text-5xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Browse Categories
          </motion.h1>
          <motion.p 
            className="mt-4 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Discover movies and TV shows by genres, decades, languages, and platforms
          </motion.p>
        </header>

        {/* Genres */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Film className="mr-2 h-5 w-5 text-luxury-gold" />
            <h2 className="font-serif text-2xl font-semibold">Genres</h2>
          </div>
          <motion.div 
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {genres.map((genre) => (
              <motion.div key={genre.id} variants={item}>
                <CategoryCard 
                  id={genre.id} 
                  name={genre.name} 
                  icon={genreIcons[genre.id.toLowerCase()] || <Film className="h-8 w-8" />} 
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Decades */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <CalendarClock className="mr-2 h-5 w-5 text-luxury-gold" />
            <h2 className="font-serif text-2xl font-semibold">Decades</h2>
          </div>
          <motion.div 
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {decades.map((decade) => (
              <motion.div key={decade.id} variants={item}>
                <CategoryCard id={decade.id} name={decade.name} icon={<CalendarClock className="h-8 w-8" />} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Languages */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Globe className="mr-2 h-5 w-5 text-luxury-gold" />
            <h2 className="font-serif text-2xl font-semibold">Languages</h2>
          </div>
          <motion.div 
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {languages.map((language) => (
              <motion.div key={language.id} variants={item}>
                <CategoryCard id={language.id} name={language.name} icon={<Globe className="h-8 w-8" />} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Streaming Platforms */}
        <section>
          <div className="flex items-center mb-6">
            <Tv className="mr-2 h-5 w-5 text-luxury-gold" />
            <h2 className="font-serif text-2xl font-semibold">Streaming Platforms</h2>
          </div>
          <motion.div 
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {streamingPlatforms.map((platform) => (
              <motion.div key={platform.id} variants={item}>
                <CategoryCard id={platform.id} name={platform.name} icon={<Radio className="h-8 w-8" />} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </MainLayout>
  );
}