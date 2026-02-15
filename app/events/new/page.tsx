import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { requireAuth } from "@/lib/auth";
import EventForm from "@/components/EventForm";

export default async function NewEventPage() {
  await requireAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>
        Create Event
      </Typography>
      <EventForm />
    </Box>
  );
}
