"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Delete } from "@mui/icons-material";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/beers/${beerId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId, beerId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(
      `/api/events/${eventId}/beers/${beerId}/reviews/${deleteTarget._id}`,
      { method: "DELETE" }
    );
    setReviews((prev) => prev.filter((r) => r._id !== deleteTarget._id));
    setDeleteTarget(null);
    setDeleting(false);
    router.refresh();
  };

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading reviews...
      </Typography>
    );
  }

  if (reviews.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No reviews yet. Be the first!
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" fontWeight={500}>
        Reviews ({reviews.length})
      </Typography>
      {reviews.map((review) => (
        <Paper
          key={review._id}
          variant="outlined"
          sx={{ p: 1.5 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StarRating rating={review.rating} size="sm" />
              <Typography variant="body2" fontWeight={500}>
                {review.userName || review.userEmail}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(review.createdAt).toLocaleDateString()}
              </Typography>
              {review.userEmail === currentUserEmail && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteTarget(review)}
                  sx={{ width: 24, height: 24 }}
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </Box>
          {review.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {review.description}
            </Typography>
          )}
        </Paper>
      ))}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review"
        message={`Delete the review by ${deleteTarget?.userName || deleteTarget?.userEmail || "this user"}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
