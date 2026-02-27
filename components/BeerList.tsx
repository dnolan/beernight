"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBeerCard from "@/components/SortableBeerCard";
import BeerForm from "@/components/BeerForm";

interface BeerData {
  _id: string;
  eventId: string;
  name: string;
  brewery: string;
  breweries?: string[];
  style: string;
  abv: number;
  avgRating: number;
  reviewCount: number;
}

interface BeerListProps {
  eventId: string;
  initialBeers: BeerData[];
  currentUserEmail: string;
}

export default function BeerList({
  eventId,
  initialBeers,
  currentUserEmail,
}: BeerListProps) {
  const router = useRouter();
  const [beers, setBeers] = useState<BeerData[]>(initialBeers);

  // Sync with server data when it changes (e.g. after add/delete)
  if (
    initialBeers.length !== beers.length ||
    initialBeers.some((b, i) => b._id !== beers[i]?._id)
  ) {
    setBeers(initialBeers);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = beers.findIndex((b) => b._id === active.id);
      const newIndex = beers.findIndex((b) => b._id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(beers, oldIndex, newIndex);
      setBeers(reordered);

      // Persist the new order
      await fetch(`/api/events/${eventId}/beers/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beerIds: reordered.map((b) => b._id) }),
      });

      router.refresh();
    },
    [beers, eventId, router]
  );

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" fontWeight={600}>
        Beers
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={beers.map((b) => b._id)}
          strategy={verticalListSortingStrategy}
        >
          {beers.map((beer) => (
            <SortableBeerCard
              key={beer._id}
              beer={beer}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </SortableContext>
      </DndContext>

      <BeerForm eventId={eventId} />
    </Stack>
  );
}
