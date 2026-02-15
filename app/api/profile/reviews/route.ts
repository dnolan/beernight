import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import Beer from "@/models/Beer";
import Event from "@/models/Event";

// GET /api/profile/reviews – get the current user's reviews with beer & event info, sorted by rating desc
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const reviews = await Review.find({ userEmail: session.user.email })
    .sort({ rating: -1, createdAt: -1 })
    .lean();

  if (reviews.length === 0) {
    return NextResponse.json([]);
  }

  const beerIds = [...new Set(reviews.map((r) => r.beerId.toString()))];
  const eventIds = [...new Set(reviews.map((r) => r.eventId.toString()))];

  const [beers, events] = await Promise.all([
    Beer.find({ _id: { $in: beerIds } }).lean(),
    Event.find({ _id: { $in: eventIds } }).lean(),
  ]);

  const beerMap = new Map(beers.map((b) => [b._id.toString(), b]));
  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  const result = reviews.map((review) => {
    const beer = beerMap.get(review.beerId.toString());
    const event = eventMap.get(review.eventId.toString());

    return {
      _id: review._id.toString(),
      rating: review.rating,
      description: review.description,
      createdAt: review.createdAt.toISOString(),
      beer: beer
        ? {
            _id: beer._id.toString(),
            name: beer.name,
            brewery: beer.brewery,
            breweries: beer.breweries ?? [],
            style: beer.style,
            abv: beer.abv,
          }
        : null,
      event: event
        ? {
            _id: event._id.toString(),
            title:
              event.title ||
              event.date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
            date: event.date.toISOString(),
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
