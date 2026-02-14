import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {dateFormatted}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/events/${event._id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
            <DeleteEventButton eventId={event._id.toString()} />
          </div>
        </div>

        <div className="mt-4">
          <EventStats
            beerCount={beers.length}
            avgAbv={avgAbv}
            avgRating={avgRating}
            reviewCount={reviews.length}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Beers</h2>
        {beersWithStats.map((beer) => (
          <BeerCard
            key={beer._id}
            beer={beer}
            currentUserEmail={session.user!.email!}
          />
        ))}
        <BeerForm eventId={event._id.toString()} />
      </div>
    </div>
  );
}
