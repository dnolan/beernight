"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import StarRating from "@/components/StarRating";

interface ReviewFormProps {
  eventId: string;
  beerId: string;
  onReviewAdded?: () => void;
}

export default function ReviewForm({ eventId, beerId, onReviewAdded }: ReviewFormProps) {
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
        onReviewAdded?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
          Your Review
        </Typography>
        <StarRating rating={rating} interactive size="lg" onChange={setRating} />
      </Box>
      <TextField
        placeholder="What did you think? (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        size="small"
        fullWidth
      />
      <Box>
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={loading || rating === 0}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </Box>
    </Box>
  );
}
