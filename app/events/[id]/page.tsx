import { notFound } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { CalendarMonth, Edit } from "@mui/icons-material";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import EventStats from "@/components/EventStats";
import BeerCard from "@/components/BeerCard";
import BeerForm from "@/components/BeerForm";
import DeleteEventButton from "./DeleteEventButton";

function getEventDisplayTitle(event: { title?: string; date: Date }) {
  if (event.title) return event.title;
  return event.date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  await dbConnect();

  const event = await Event.findById(id).lean();
  if (!event) notFound();

  const beers = await Beer.find({ eventId: event._id })
    .sort({ createdAt: 1 })
    .lean();

  const beerIds = beers.map((b) => b._id);
  const reviews = beerIds.length
    ? await Review.find({ beerId: { $in: beerIds } }).lean()
    : [];

  // Compute per-beer stats
  const beersWithStats = beers.map((beer) => {
    const beerReviews = reviews.filter(
      (r) => r.beerId.toString() === beer._id.toString()
    );
    const avgRating =
      beerReviews.length > 0
        ? beerReviews.reduce((sum, r) => sum + r.rating, 0) /
          beerReviews.length
        : 0;

    return {
      _id: beer._id.toString(),
      eventId: event._id.toString(),
      name: beer.name,
      brewery: beer.brewery,
      breweries: beer.breweries ?? [],
      style: beer.style,
      abv: beer.abv,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: beerReviews.length,
    };
  });

  // Event-level stats
  const avgAbv =
    beers.length > 0
      ? Math.round(
          (beers.reduce((sum, b) => sum + (b.abv || 0), 0) / beers.length) * 10
        ) / 10
      : 0;

  const avgRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  const title = getEventDisplayTitle(event);
  const dateFormatted = event.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5, color: "text.secondary" }}>
              <CalendarMonth sx={{ fontSize: 18 }} />
              <Typography variant="body2">{dateFormatted}</Typography>
            </Box>
            {event.chooser && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Chosen by <strong>{event.chooser}</strong>
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Link href={`/events/${event._id}/edit`}>
              <Button variant="outlined" size="small" startIcon={<Edit sx={{ fontSize: 16 }} />}>
                Edit
              </Button>
            </Link>
            <DeleteEventButton eventId={event._id.toString()} eventName={title} />
          </Stack>
        </Box>

        {event.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, whiteSpace: "pre-line" }}>
            {event.notes}
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <EventStats
            beerCount={beers.length}
            avgAbv={avgAbv}
            avgRating={avgRating}
            reviewCount={reviews.length}
          />
        </Box>
      </Box>

      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={600}>
          Beers
        </Typography>
        {beersWithStats.map((beer) => (
          <BeerCard
            key={beer._id}
            beer={beer}
            currentUserEmail={session.user!.email!}
          />
        ))}
        <BeerForm eventId={event._id.toString()} />
      </Stack>
    </Box>
  );
}
