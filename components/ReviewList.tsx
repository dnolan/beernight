"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Delete, Edit } from "@mui/icons-material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";
import ReviewForm from "@/components/ReviewForm";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events/${eventId}/beers/${beerId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId, beerId, refreshKey]);

  const handleReviewAdded = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  const startEditing = (review: Review) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditDescription(review.description);
  };

  const handleEditSave = async () => {
    if (!editingId || editRating === 0) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/beers/${beerId}/reviews/${editingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: editRating, description: editDescription }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r._id === editingId ? { ...r, rating: updated.rating, description: updated.description } : r))
        );
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

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

  const hasUserReview = reviews.some((r) => r.userEmail === currentUserEmail);

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading reviews...
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {!hasUserReview && (
        <ReviewForm eventId={eventId} beerId={beerId} onReviewAdded={handleReviewAdded} />
      )}
      {reviews.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No reviews yet. Be the first!
        </Typography>
      ) : (
        <Typography variant="body2" fontWeight={500}>
          Reviews ({reviews.length})
        </Typography>
      )}
      {reviews.map((review) => (
        <Paper
          key={review._id}
          variant="outlined"
          sx={{
            p: 1.5,
            ...(editingId === review._id && {
              borderColor: "primary.main",
              borderWidth: 2,
              bgcolor: "action.hover",
            }),
          }}
        >
          {editingId === review._id ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                Edit Review &mdash; {review.userName || review.userEmail}
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Tap to change rating
                </Typography>
                <StarRating rating={editRating} interactive size="lg" onChange={setEditRating} />
              </Box>
              <TextField
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What did you think? (optional)"
                multiline
                rows={2}
                size="small"
                fullWidth
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="contained" disabled={saving || editRating === 0} onClick={handleEditSave}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="small" onClick={() => setEditingId(null)} disabled={saving}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <>
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
                    <>
                      <IconButton
                        size="small"
                        onClick={() => startEditing(review)}
                        sx={{ width: 24, height: 24 }}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(review)}
                        sx={{ width: 24, height: 24 }}
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
              {review.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {review.description}
                </Typography>
              )}
            </>
          )}
        </Paper>
      ))}

      {reviews.length > 0 && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Review"
          message={`Delete the review by ${deleteTarget?.userName || deleteTarget?.userEmail || "this user"}?`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Stack>
  );
}
