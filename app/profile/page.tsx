"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Rating from "@mui/material/Rating";
import Skeleton from "@mui/material/Skeleton";
import { SportsBar } from "@mui/icons-material";

interface ReviewWithBeer {
  _id: string;
  rating: number;
  description: string;
  createdAt: string;
  beer: {
    _id: string;
    name: string;
    brewery: string;
    breweries: string[];
    style: string;
    abv: number;
  } | null;
  event: {
    _id: string;
    title: string;
    date: string;
  } | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewWithBeer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/reviews")
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!session) return null;

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
        ) / 10
      : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Profile header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          src={session.user?.image || ""}
          alt={session.user?.name || ""}
          sx={{ width: 56, height: 56, fontSize: 22 }}
        >
          {session.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?"}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {session.user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session.user?.email}
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Stack direction="row" spacing={1.5}>
        <Chip
          icon={<SportsBar sx={{ fontSize: 18 }} />}
          label={`${totalReviews} beer${totalReviews !== 1 ? "s" : ""} rated`}
          variant="outlined"
        />
        {totalReviews > 0 && (
          <Chip
            label={`Avg rating: ${avgRating} / 5`}
            variant="outlined"
          />
        )}
      </Stack>

      {/* Beer ranking */}
      <Typography variant="h6" fontWeight={600}>
        Your Beer Rankings
      </Typography>

      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </Stack>
      ) : reviews.length === 0 ? (
        <Typography color="text.secondary">
          You haven&apos;t rated any beers yet. Head to an event to get started!
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {reviews.map((review, index) => (
            <Card key={review._id}>
              <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start", py: 1.5, "&:last-child": { pb: 1.5 } }}>
                {/* Rank number */}
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    minWidth: 32,
                    textAlign: "center",
                    color: index < 3 ? "warning.main" : "text.secondary",
                  }}
                >
                  {index + 1}
                </Typography>

                {/* Beer info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {review.beer?.name ?? "Unknown beer"}
                    </Typography>
                    {review.beer && review.beer.abv > 0 && (
                      <Chip
                        label={`${review.beer.abv}%`}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {review.beer
                      ? [
                          ...(review.beer.breweries.length > 0
                            ? review.beer.breweries
                            : review.beer.brewery
                              ? [review.beer.brewery]
                              : []),
                          review.beer.style,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : ""}
                  </Typography>
                  {review.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                      &ldquo;{review.description}&rdquo;
                    </Typography>
                  )}
                  {review.event && (
                    <Link href={`/events/${review.event._id}`}>
                      <Typography variant="caption" color="primary" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {review.event.title}
                      </Typography>
                    </Link>
                  )}
                </Box>

                {/* Rating */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Rating value={review.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {review.rating} / 5
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
