import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="container-custom flex min-h-[70vh] flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <Film className="mx-auto h-16 w-16 text-luxury-gold" />
          <h1 className="mt-6 font-serif text-4xl font-bold">404</h1>
          <h2 className="mt-2 font-serif text-2xl font-semibold">Page Not Found</h2>
          
          <p className="mt-4 text-muted-foreground">
            The scene you're looking for seems to be missing from our reel. 
            Let's get you back to the main feature.
          </p>
          
          <div className="mt-8">
            <Button asChild className="bg-luxury-gold text-black hover:bg-luxury-lightGold">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}