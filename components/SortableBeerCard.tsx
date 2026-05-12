"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import { DragIndicator } from "@mui/icons-material";
import BeerCard from "@/components/BeerCard";

interface SortableBeerCardProps {
  beer: {
    _id: string;
    eventId: string;
    name: string;
    brewery: string;
    breweries?: string[];
    style: string;
    abv: number;
    notes?: string;
    avgRating: number;
    reviewCount: number;
  };
  currentUserEmail: string;
}

export default function SortableBeerCard({
  beer,
  currentUserEmail,
}: SortableBeerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: beer._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ display: "flex", alignItems: "stretch", gap: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <BeerCard beer={beer} currentUserEmail={currentUserEmail} />
      </Box>
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "grab",
          color: "text.secondary",
          px: 0.5,
          "&:hover": { color: "text.primary" },
          "&:active": { cursor: "grabbing" },
          touchAction: "none",
        }}
      >
        <DragIndicator fontSize="small" />
      </Box>
    </Box>
  );
}
