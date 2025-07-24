import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Film,
  Search,
  Award,
  Menu,
  X,
  PlayCircle,
  CalendarDays,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/search/search-dialog";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: <PlayCircle size={16} />,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: <Film size={16} />,
  },
  {
    label: "Top Charts",
    href: "/charts",
    icon: <Award size={16} />,
  },
  {
    label: "New Releases",
    href: "/new",
    icon: <CalendarDays size={16} />,
  },
  {
    label: "About",
    href: "/about",
    icon: <Info size={16} />,
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-b-luxury-gold/20 bg-background/80 backdrop-blur-lg">
        <div className="container-custom flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-6 w-6 text-luxury-gold" />
              <span className="font-serif text-2xl font-bold tracking-tight">
                Cine<span className="gradient-text">Surfs</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-luxury-gold",
                  location.pathname === item.href
                    ? "text-luxury-gold"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Search and Theme Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="rounded-full"
            >
              <Search className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Search movies</span>
            </Button>
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Menu className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-x-0 top-16 z-40 border-b border-luxury-gold/20 bg-background/90 backdrop-blur-md md:hidden"
        >
          <nav className="container-custom py-4">
            <ul className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 py-2 text-sm font-medium transition-colors hover:text-luxury-gold",
                      location.pathname === item.href
                        ? "text-luxury-gold"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}