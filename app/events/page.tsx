import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { Add } from "@mui/icons-material";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import EventCard from "@/components/EventCard";

export default async function EventsPage() {
  await requireAuth();
  await dbConnect();

  const events = await Event.find({}).sort({ date: -1 }).lean();

  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const beers = await Beer.find({ eventId: event._id }).lean();
      const beerIds = beers.map((b) => b._id);

      const reviews = beerIds.length
        ? await Review.find({ beerId: { $in: beerIds } }).lean()
        : [];

      const avgAbv =
        beers.length > 0
          ? beers.reduce((sum, b) => sum + (b.abv || 0), 0) / beers.length
          : 0;

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        _id: event._id.toString(),
        title: event.title,
        date: event.date.toISOString(),
        beerCount: beers.length,
        reviewCount: reviews.length,
        avgAbv: Math.round(avgAbv * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    })
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" fontWeight={700}>
          Events
        </Typography>
        <Link href="/events/new">
          <Button variant="contained" startIcon={<Add />}>
            New Event
          </Button>
        </Link>
      </Box>

      {eventsWithStats.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            No events yet. Create one to get started!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {eventsWithStats.map((event) => (
            <Grid key={event._id} size={{ xs: 12 }}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
