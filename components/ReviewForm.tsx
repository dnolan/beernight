"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";

interface ReviewFormProps {
  eventId: string;
  beerId: string;
}

export default function ReviewForm({ eventId, beerId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/beers/${beerId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, description }),
        }
      );

      if (res.ok) {
        setRating(0);
        setDescription("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1.5">Your Review</p>
        <StarRating
          rating={rating}
          interactive
          size="lg"
          onChange={setRating}
        />
      </div>
      <Textarea
        placeholder="What did you think? (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <Button type="submit" size="sm" disabled={loading || rating === 0}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
