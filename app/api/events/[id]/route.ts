import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Event from "@/models/Event";
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

  const { id } = await params;
  await dbConnect();

  const event = await Event.findById(id).lean();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  const body = await request.json();
  const { title, date, chooser, notes } = body;

  const event = await Event.findByIdAndUpdate(
    id,
    {
      ...(title !== undefined && { title }),
      ...(date && { date: new Date(date) }),
      ...(chooser !== undefined && { chooser }),
      ...(notes !== undefined && { notes }),
    },
    { returnDocument: "after" }
  ).lean();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  // Delete event and all associated beers and reviews
  const beers = await Beer.find({ eventId: id }).lean();
  const beerIds = beers.map((b) => b._id);

  await Review.deleteMany({ beerId: { $in: beerIds } });
  await Beer.deleteMany({ eventId: id });
  await Event.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
