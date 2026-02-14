import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Review from "@/models/Review";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; beerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { beerId } = await params;
  await dbConnect();

  const body = await request.json();
  const { name, brewery, style, abv } = body;

  const beer = await Beer.findByIdAndUpdate(
    beerId,
    {
      ...(name && { name }),
      ...(brewery !== undefined && { brewery }),
      ...(style !== undefined && { style }),
      ...(abv !== undefined && { abv: parseFloat(abv) }),
    },
    { new: true }
  ).lean();

  if (!beer) {
    return NextResponse.json({ error: "Beer not found" }, { status: 404 });
  }

  return NextResponse.json(beer);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; beerId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { beerId } = await params;
  await dbConnect();

  await Review.deleteMany({ beerId });
  await Beer.findByIdAndDelete(beerId);

  return NextResponse.json({ success: true });
}
