import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Review from "@/models/Review";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  await dbConnect();

  const beers = await Beer.find({ eventId }).sort({ createdAt: 1 }).lean();

  // Add average rating to each beer
  const beersWithRatings = await Promise.all(
    beers.map(async (beer) => {
      const reviews = await Review.find({ beerId: beer._id }).lean();
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...beer,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    })
  );

  return NextResponse.json(beersWithRatings);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  await dbConnect();

  const body = await request.json();
  const { name, brewery, style, abv } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Beer name is required" },
      { status: 400 }
    );
  }

  const beer = await Beer.create({
    eventId,
    name,
    brewery: brewery || "",
    style: style || "",
    abv: abv ? parseFloat(abv) : 0,
  });

  return NextResponse.json(beer, { status: 201 });
}
