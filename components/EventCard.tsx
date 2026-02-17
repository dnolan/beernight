import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { SportsBar, Star, Upcoming } from "@mui/icons-material";
import { getRatingColor } from "@/lib/utils";

interface EventCardProps {
  event: {
    _id: string;
    title?: string;
    date: string;
    beerCount: number;
    reviewCount: number;
    avgAbv: number;
    avgRating: number;
  };
}

function getEventDisplayTitle(event: { title?: string; date: string }) {
  if (event.title) return event.title;
  const d = new Date(event.date);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function EventCard({ event }: EventCardProps) {
  const title = getEventDisplayTitle(event);
  const eventDate = new Date(event.date);
  const isFuture = eventDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);
  const dateFormatted = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/events/${event._id}`}>
      <Card sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 4 } }}>
        <CardActionArea>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                  </Typography>
                  {isFuture && (
                    <Upcoming sx={{ fontSize: 18, color: "warning.main" }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  {dateFormatted}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Chip
                    icon={<SportsBar sx={{ fontSize: 16 }} />}
                    label={`${event.beerCount} beer${event.beerCount !== 1 ? "s" : ""}`}
                    size="small"
                    variant="outlined"
                  />
                  {event.beerCount > 0 && (
                    <Chip label={`Avg ${event.avgAbv}% ABV`} size="small" variant="outlined" />
                  )}
                  {event.reviewCount > 0 && (
                    <Chip
                      icon={<Star sx={{ fontSize: 16 }} />}
                      label={String(event.avgRating)}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: getRatingColor(event.avgRating),
                        color: getRatingColor(event.avgRating),
                        "& .MuiChip-icon": { color: getRatingColor(event.avgRating) },
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
