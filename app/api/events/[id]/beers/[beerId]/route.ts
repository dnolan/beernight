import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Beer from "@/models/Beer";
import Review from "@/models/Review";
import Brewery from "@/models/Brewery";

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
  const { name, brewery, breweries, style, abv } = body;

  // Resolve breweries: prefer new array, fall back to legacy string
  const breweryList: string[] | undefined = Array.isArray(breweries)
    ? breweries.map((b: string) => b.trim()).filter(Boolean)
    : brewery !== undefined
      ? brewery
        ? [brewery.trim()]
        : []
      : undefined;

  // Upsert each brewery into the lookup collection
  if (breweryList && breweryList.length > 0) {
    await Promise.all(
      breweryList.map((bName) =>
        Brewery.findOneAndUpdate(
          {
            name: {
              $regex: `^${bName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              $options: "i",
            },
          },
          { $setOnInsert: { name: bName } },
          { upsert: true }
        )
      )
    );
  }

  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (style !== undefined) update.style = style;
  if (abv !== undefined) update.abv = parseFloat(abv);
  if (breweryList !== undefined) {
    update.breweries = breweryList;
    update.brewery = breweryList.join(" / ");
  }

  const beer = await Beer.findByIdAndUpdate(beerId, update, {
    new: true,
  }).lean();

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
