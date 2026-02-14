"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (rating: number) => void;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  size = "md",
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={cn(
              "transition-colors",
              interactive
                ? "cursor-pointer hover:text-yellow-400"
                : "cursor-default",
              filled ? "text-yellow-400" : "text-muted-foreground/30"
            )}
          >
            <Star
              className={cn(sizeMap[size], filled && "fill-current")}
            />
          </button>
        );
      })}
    </div>
  );
}
