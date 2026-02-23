import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import Event from "@/models/Event";

// GET /api/breweries/[name]/beers – get beers + reviews for a single brewery
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const { name } = await params;
  const breweryName = decodeURIComponent(name);
  const regex = new RegExp(
    `^${breweryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i"
  );

  // Find beers that have this brewery in their breweries array or legacy field
  const beers = await Beer.find({
    $or: [{ breweries: regex }, { brewery: regex }],
  }).lean();

  if (beers.length === 0) {
    return NextResponse.json([]);
  }

  const beerIds = beers.map((b) => b._id);
  const eventIds = [...new Set(beers.map((b) => b.eventId.toString()))];

  const [reviews, events] = await Promise.all([
    Review.find({ beerId: { $in: beerIds } }).lean(),
    Event.find({ _id: { $in: eventIds } }).lean(),
  ]);

  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  const result = beers.map((beer) => {
    const beerReviews = reviews.filter(
      (r) => r.beerId.toString() === beer._id.toString()
    );
    const avgRating =
      beerReviews.length > 0
        ? Math.round(
            (beerReviews.reduce((s, r) => s + r.rating, 0) /
              beerReviews.length) *
              10
          ) / 10
        : 0;

    const event = eventMap.get(beer.eventId.toString());
    const eventTitle = event
      ? event.title ||
        event.date.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })
      : "";

    return {
      _id: beer._id.toString(),
      name: beer.name,
      style: beer.style,
      abv: beer.abv,
      avgRating,
      reviewCount: beerReviews.length,
      eventTitle,
      eventId: beer.eventId.toString(),
    };
  });

  result.sort((a, b) => b.avgRating - a.avgRating);

  return NextResponse.json(result);
}
