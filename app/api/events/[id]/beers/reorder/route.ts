import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  await dbConnect();

  const { beerIds } = (await request.json()) as { beerIds: string[] };

  if (!Array.isArray(beerIds) || beerIds.length === 0) {
    return NextResponse.json(
      { error: "beerIds array is required" },
      { status: 400 }
    );
  }

  // Update order for each beer based on its position in the array
  await Promise.all(
    beerIds.map((id, index) =>
      Beer.updateOne({ _id: id, eventId }, { $set: { order: index } })
    )
  );

  return NextResponse.json({ success: true });
}
