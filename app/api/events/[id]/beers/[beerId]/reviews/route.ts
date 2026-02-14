import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; beerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { beerId } = await params;
  await dbConnect();

  const reviews = await Review.find({ beerId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(reviews);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; beerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId, beerId } = await params;
  await dbConnect();

  const body = await request.json();
  const { rating, description } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Upsert: update existing review or create new one
  const review = await Review.findOneAndUpdate(
    { beerId, userEmail: session.user.email },
    {
      beerId,
      eventId,
      userEmail: session.user.email,
      userName: session.user.name || "",
      rating,
      description: description || "",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json(review, { status: 201 });
}
