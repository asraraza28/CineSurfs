import { Link } from "react-router-dom";
import { Film, Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-t-luxury-gold/20 bg-background py-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-5 w-5 text-luxury-gold" />
              <span className="font-serif text-xl font-bold tracking-tight">
                Cine<span className="gradient-text">Surfs</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Ride the Waves of Cinematic Excellence. Discover movies and TV shows with elegant, 
              curated recommendations.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-luxury-gold">Home</Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-luxury-gold">Categories</Link>
              </li>
              <li>
                <Link to="/charts" className="hover:text-luxury-gold">Top Charts</Link>
              </li>
              <li>
                <Link to="/new" className="hover:text-luxury-gold">New Releases</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Data Sources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.omdbapi.com/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-luxury-gold"
                >
                  OMDb API
                </a>
              </li>
              <li>
                <a 
                  href="https://www.themoviedb.org/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-luxury-gold"
                >
                  TMDb (Optional)
                </a>
              </li>
              <li>
                <a 
                  href="https://trakt.tv/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-luxury-gold"
                >
                  Trakt.tv (Optional)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-luxury-gold">About</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-luxury-gold">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-luxury-gold">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-t-luxury-gold/20 pt-6">
          <p className="text-xs text-muted-foreground">
            © {currentYear} CineSurfs. All rights reserved.
          </p>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="text-muted-foreground hover:text-luxury-gold"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}