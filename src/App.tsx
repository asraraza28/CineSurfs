import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';

// Pages
import Index from './pages/Index';
import MovieDetails from './pages/MovieDetails';
import Categories from './pages/Categories';
import CategoryView from './pages/CategoryView';
import Charts from './pages/Charts';
import SearchResults from './pages/SearchResults';
import NewReleases from './pages/NewReleases';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Theme initialization
const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return <>{children}</>;
};

// Detect if building for GitHub Pages (change mode name if different)
const isGithubPages = import.meta.env.MODE === 'github';

// Set basename from env variable or default empty string
const basename = import.meta.env.VITE_BASE_URL || '';

// Choose router based on environment: HashRouter for GitHub Pages, BrowserRouter otherwise
const Router = isGithubPages ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer>
        <Toaster />
        <Router basename={basename}>
          <Routes>
            {/* Main Pages */}
            <Route path="/" element={<Index />} />
            {/* Route to handle both movies and series */}
            <Route path="/:type/:id" element={<MovieDetails />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:id" element={<CategoryView />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/new" element={<NewReleases />} />
            <Route path="/about" element={<About />} />
            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
