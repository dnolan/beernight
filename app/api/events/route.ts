import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
import Beer from "@/models/Beer";
import Review from "@/models/Review";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const events = await Event.find({}).sort({ date: -1 }).lean();

  // Gather stats for each event
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
        ...event,
        beerCount: beers.length,
        reviewCount: reviews.length,
        avgAbv: Math.round(avgAbv * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    })
  );

  return NextResponse.json(eventsWithStats);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const body = await request.json();
  const { title, date } = body;

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const event = await Event.create({
    title: title || undefined,
    date: new Date(date),
    createdBy: session.user.email,
  });

  return NextResponse.json(event, { status: 201 });
}
