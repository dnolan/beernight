"use client";

import Rating from "@mui/material/Rating";
import { getRatingColor } from "@/lib/utils";

export { getRatingColor };

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (rating: number) => void;
}

const sizeMap = {
  sm: "small" as const,
  md: "medium" as const,
  lg: "large" as const,
};

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  size = "md",
  onChange,
}: StarRatingProps) {
  const color = rating > 0 ? getRatingColor(rating) : undefined;

  return (
    <Rating
      value={rating}
      max={maxRating}
      readOnly={!interactive}
      size={sizeMap[size]}
      sx={color ? {
        "& .MuiRating-iconFilled": { color },
        "& .MuiRating-iconHover": { color },
      } : undefined}
      onChange={(_e, newValue) => {
        if (interactive && onChange && newValue !== null) {
          onChange(newValue);
        }
      }}
    />
  );
}
