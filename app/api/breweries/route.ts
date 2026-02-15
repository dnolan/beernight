import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Brewery from "@/models/Brewery";

// GET /api/breweries?q=search_term – search / list breweries
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const q = request.nextUrl.searchParams.get("q")?.trim();

  let breweries;
  if (q) {
    breweries = await Brewery.find({
      name: { $regex: q, $options: "i" },
    })
      .sort({ name: 1 })
      .limit(20)
      .lean();
  } else {
    breweries = await Brewery.find().sort({ name: 1 }).lean();
  }

  return NextResponse.json(breweries);
}

// POST /api/breweries – create a new brewery
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const body = await request.json();
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Brewery name is required" },
      { status: 400 }
    );
  }

  // Upsert – return existing if already present
  const brewery = await Brewery.findOneAndUpdate(
    { name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
    { $setOnInsert: { name: name.trim() } },
    { upsert: true, returnDocument: "after" }
  );

  return NextResponse.json(brewery, { status: 201 });
}
