import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Brewery from "@/models/Brewery";
import Review from "@/models/Review";

// GET /api/breweries/all – list all breweries with beer counts & avg rating
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const [beers, breweryDocs, reviews] = await Promise.all([
    Beer.find({}, { breweries: 1, brewery: 1 }).lean(),
    Brewery.find({}, { name: 1, imageUrl: 1 }).lean(),
    Review.find({}, { beerId: 1, rating: 1 }).lean(),
  ]);

  const breweryImageMap = new Map(
    breweryDocs.map((b) => [b.name.toLowerCase(), b.imageUrl || ""])
  );

  // Build a map of beerId -> average rating
  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const key = r.beerId.toString();
    const entry = ratingMap.get(key) || { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    ratingMap.set(key, entry);
  }

  // Accumulate per-brewery: beer count + rating totals
  const breweryStats = new Map<string, { count: number; ratingSum: number; ratedBeers: number }>();
  const nameMap = new Map<string, string>();

  for (const beer of beers) {
    const names =
      beer.breweries && beer.breweries.length > 0
        ? beer.breweries
        : beer.brewery
          ? [beer.brewery]
          : ["Unknown"];

    const beerRating = ratingMap.get(beer._id.toString());

    for (const bName of names) {
      const key = bName.toLowerCase();
      if (!nameMap.has(key)) nameMap.set(key, bName);

      const stats = breweryStats.get(key) || { count: 0, ratingSum: 0, ratedBeers: 0 };
      stats.count += 1;
      if (beerRating && beerRating.count > 0) {
        stats.ratingSum += beerRating.sum / beerRating.count;
        stats.ratedBeers += 1;
      }
      breweryStats.set(key, stats);
    }
  }

  const result = [...breweryStats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, stats]) => ({
      name: nameMap.get(key) || key,
      imageUrl: breweryImageMap.get(key) || "",
      beerCount: stats.count,
      avgRating:
        stats.ratedBeers > 0
          ? Math.round((stats.ratingSum / stats.ratedBeers) * 10) / 10
          : 0,
    }));

  return NextResponse.json(result);
}
