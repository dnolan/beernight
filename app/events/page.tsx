import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      {eventsWithStats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No events yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {eventsWithStats.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
