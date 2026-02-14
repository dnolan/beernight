"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

interface BeerCardProps {
  beer: {
    _id: string;
    eventId: string;
    name: string;
    brewery: string;
    style: string;
    abv: number;
    avgRating: number;
    reviewCount: number;
  };
  currentUserEmail: string;
}

export default function BeerCard({ beer, currentUserEmail }: BeerCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${beer.name}"? This will also remove all reviews.`)) {
      return;
    }
    setDeleting(true);
    await fetch(`/api/events/${beer.eventId}/beers/${beer._id}`, {
      method: "DELETE",
    });
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{beer.name}</h3>
              {beer.abv > 0 && (
                <Badge variant="outline" className="font-mono text-xs">
                  {beer.abv}%
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-muted-foreground">
              {beer.brewery && <span>{beer.brewery}</span>}
              {beer.style && <span>· {beer.style}</span>}
            </div>
            {beer.reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={Math.round(beer.avgRating)} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {beer.avgRating} ({beer.reviewCount} review
                  {beer.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Reviews
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <ReviewForm
              eventId={beer.eventId}
              beerId={beer._id}
            />
            <ReviewList
              eventId={beer.eventId}
              beerId={beer._id}
              currentUserEmail={currentUserEmail}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
