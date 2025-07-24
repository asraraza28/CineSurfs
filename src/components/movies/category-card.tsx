import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  id: string;
  name: string;
  icon?: JSX.Element;
  className?: string;
}

export function CategoryCard({ id, name, icon, className }: CategoryCardProps) {
  return (
    <Link to={`/category/${id}`}>
      <motion.div 
        className={cn(
          "group flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-luxury-gold/20 bg-card p-4 shadow-sm transition-all hover:border-luxury-gold hover:shadow-md",
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon && (
          <div className="mb-3 text-luxury-gold/70 group-hover:text-luxury-gold">
            {icon}
          </div>
        )}
        <h3 className="font-serif text-lg font-medium text-center group-hover:text-luxury-gold">
          {name}
        </h3>
      </motion.div>
    </Link>
  );
}