import { requireAuth } from "@/lib/auth";
import EventForm from "@/components/EventForm";

export default async function NewEventPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Event</h1>
      <EventForm />
    </div>
  );
}
