"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import { Delete, ExpandMore, ExpandLess, Edit } from "@mui/icons-material";
import StarRating from "@/components/StarRating";
import ReviewList from "@/components/ReviewList";
import BeerEditForm from "@/components/BeerEditForm";
import ConfirmDialog from "@/components/ConfirmDialog";

interface BeerCardProps {
  beer: {
    _id: string;
    eventId: string;
    name: string;
    brewery: string;
    breweries?: string[];
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
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/events/${beer.eventId}/beers/${beer._id}`, {
      method: "DELETE",
    });
    setConfirmOpen(false);
    router.refresh();
  };

  const breweryList =
    beer.breweries && beer.breweries.length > 0
      ? beer.breweries
      : beer.brewery
        ? [beer.brewery]
        : [];

  if (editing) {
    return (
      <Card>
        <CardContent>
          <BeerEditForm beer={beer} onCancel={() => setEditing(false)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {beer.name}
              </Typography>
              {beer.abv > 0 && (
                <Chip
                  label={`${beer.abv}%`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: "monospace", fontSize: 12 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[...breweryList, beer.style].filter(Boolean).join(" · ")}
            </Typography>
            {beer.reviewCount > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <StarRating rating={Math.round(beer.avgRating)} size="sm" />
                <Typography variant="body2" color="text.secondary">
                  {beer.avgRating} ({beer.reviewCount} review
                  {beer.reviewCount !== 1 ? "s" : ""})
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              Reviews
            </Button>
            <IconButton size="small" onClick={() => setEditing(true)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ReviewList
              eventId={beer.eventId}
              beerId={beer._id}
              currentUserEmail={currentUserEmail}
            />
          </Box>
        </Collapse>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Beer"
        message={`Delete "${beer.name}"? This will also remove all its reviews.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
