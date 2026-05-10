import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { Add } from "@mui/icons-material";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import EventCard from "@/components/EventCard";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireAuth();
  await dbConnect();

  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const selectedYear = yearParam ? parseInt(yearParam, 10) : currentYear;

  // Get distinct years via aggregation (no full-document load)
  const startOfYear = new Date(selectedYear, 0, 1);
  const startOfNextYear = new Date(selectedYear + 1, 0, 1);

  const [yearDocs, events] = await Promise.all([
    Event.aggregate<{ _id: number }>([
      { $group: { _id: { $year: "$date" } } },
      { $sort: { _id: -1 } },
    ]),
    Event.find({ date: { $gte: startOfYear, $lt: startOfNextYear } })
      .sort({ date: -1 })
      .lean(),
  ]);

  const allYears = yearDocs.map((d) => d._id);

  if (!allYears.includes(currentYear)) {
    allYears.unshift(currentYear);
    allYears.sort((a, b) => b - a);
  }

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
        chooser: event.chooser
      };
    })
  );

  const otherYears = allYears.filter((y) => y !== selectedYear);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography variant="h5" fontWeight={700}>
            Events
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            {selectedYear}
          </Typography>
        </Box>
        <Link href="/events/new">
          <Button variant="contained" startIcon={<Add />}>
            New Event
          </Button>
        </Link>
      </Box>

      {eventsWithStats.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            No events in {selectedYear}.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {(() => {
            let lastGroup = "";
            return eventsWithStats.map((event) => {
              const d = new Date(event.date);
              const group = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
              const showHeader = group !== lastGroup;
              lastGroup = group;
              return (
                <Box key={event._id}>
                  {showHeader && (
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1, mt: 1 }}
                    >
                      {group}
                    </Typography>
                  )}
                  <EventCard event={event} />
                </Box>
              );
            });
          })()}
        </Stack>
      )}

      {allYears.length > 0 && (
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Other years
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {allYears.map((y) => (
              <Link key={y} href={y === currentYear ? "/events" : `/events?year=${y}`}>
                <Chip label={y} variant="outlined" clickable color={y === selectedYear ? "info" : "default"} />
              </Link>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
