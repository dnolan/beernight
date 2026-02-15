import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import EventForm from "@/components/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  await dbConnect();

  const event = await Event.findById(id).lean();
  if (!event) notFound();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>
        Edit Event
      </Typography>
      <EventForm
        initialData={{
          _id: event._id.toString(),
          title: event.title,
          date: event.date.toISOString(),
          chooser: event.chooser,
          notes: event.notes,
        }}
      />
    </Box>
  );
}
