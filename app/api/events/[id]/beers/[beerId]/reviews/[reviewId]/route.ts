import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; beerId: string; reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  await dbConnect();

  const review = await Review.findById(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.userEmail !== session.user.email) {
    return NextResponse.json(
      { error: "Can only edit your own reviews" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { rating, description } = body;

  if (rating !== undefined) review.rating = rating;
  if (description !== undefined) review.description = description;

  await review.save();

  return NextResponse.json(review.toObject());
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; beerId: string; reviewId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  await dbConnect();

  const review = await Review.findById(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.userEmail !== session.user.email) {
    return NextResponse.json(
      { error: "Can only delete your own reviews" },
      { status: 403 }
    );
  }

  await review.deleteOne();

  return NextResponse.json({ success: true });
}
