import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import Event from "@/models/Event";

// GET /api/breweries/all – list all breweries with their beers
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const beers = await Beer.find({}).lean();
  const beerIds = beers.map((b) => b._id);

  const [reviews, events] = await Promise.all([
    Review.find({ beerId: { $in: beerIds } }).lean(),
    Event.find({
      _id: { $in: [...new Set(beers.map((b) => b.eventId.toString()))] },
    }).lean(),
  ]);

  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  // Build a map: brewery name -> beers[]
  const breweryMap = new Map<
    string,
    {
      _id: string;
      name: string;
      style: string;
      abv: number;
      avgRating: number;
      reviewCount: number;
      eventTitle: string;
      eventId: string;
    }[]
  >();

  for (const beer of beers) {
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
        event.date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "";

    const beerData = {
      _id: beer._id.toString(),
      name: beer.name,
      style: beer.style,
      abv: beer.abv,
      avgRating,
      reviewCount: beerReviews.length,
      eventTitle,
      eventId: beer.eventId.toString(),
    };

    // Use the breweries array; fall back to legacy brewery field
    const names =
      beer.breweries && beer.breweries.length > 0
        ? beer.breweries
        : beer.brewery
          ? [beer.brewery]
          : ["Unknown"];

    for (const bName of names) {
      const key = bName.toLowerCase();
      if (!breweryMap.has(key)) {
        breweryMap.set(key, []);
      }
      breweryMap.get(key)!.push(beerData);
    }
  }

  // Sort breweries alphabetically, beers by avgRating desc within each
  const result = [...breweryMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, beersList]) => {
      beersList.sort((a, b) => b.avgRating - a.avgRating);
      return {
        name: beersList[0].name, // placeholder, overridden below
        beers: beersList,
      };
    });

  // Fix brewery name to use proper casing from first beer
  const finalResult = [...breweryMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, beersList]) => {
      // Find the original cased name from any beer's breweries array
      let displayName = key;
      for (const beer of beers) {
        const match = (beer.breweries ?? []).find(
          (n) => n.toLowerCase() === key
        );
        if (match) {
          displayName = match;
          break;
        }
        if (beer.brewery && beer.brewery.toLowerCase() === key) {
          displayName = beer.brewery;
          break;
        }
      }

      beersList.sort((a, b) => b.avgRating - a.avgRating);
      return {
        name: displayName,
        beerCount: beersList.length,
        beers: beersList,
      };
    });

  return NextResponse.json(finalResult);
}
