import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

// Set basename from environment variable, default to empty string
const basename = import.meta.env.VITE_BASE_URL || '';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer>
        <Toaster />
        <BrowserRouter basename={basename}>
          <Routes>
            {/* Main Pages */}
            <Route path="/" element={<Index />} />
            {/* Updated route to handle both movies and series */}
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
        </BrowserRouter>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
