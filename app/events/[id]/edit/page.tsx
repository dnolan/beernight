import { notFound } from "next/navigation";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Event</h1>
      <EventForm
        initialData={{
          _id: event._id.toString(),
          title: event.title,
          date: event.date.toISOString(),
        }}
      />
    </div>
  );
}
