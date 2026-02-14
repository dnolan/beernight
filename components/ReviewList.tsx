"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/StarRating";

interface Review {
  _id: string;
  userEmail: string;
  userName: string;
  rating: number;
  description: string;
  createdAt: string;
}

interface ReviewListProps {
  eventId: string;
  beerId: string;
  currentUserEmail: string;
}

export default function ReviewList({
  eventId,
  beerId,
  currentUserEmail,
}: ReviewListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/beers/${beerId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId, beerId]);

  const handleDelete = async (reviewId: string) => {
    await fetch(
      `/api/events/${eventId}/beers/${beerId}/reviews/${reviewId}`,
      { method: "DELETE" }
    );
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    router.refresh();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading reviews...</p>;
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reviews yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Reviews ({reviews.length})
      </p>
      {reviews.map((review) => (
        <div
          key={review._id}
          className="rounded-md border bg-muted/50 p-3 space-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm font-medium">
                {review.userName || review.userEmail}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
              {review.userEmail === currentUserEmail && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(review._id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {review.description && (
            <p className="text-sm text-muted-foreground">
              {review.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
