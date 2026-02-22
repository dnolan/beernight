import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Brewery from "@/models/Brewery";

async function findBrewery(name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Brewery.findOne({
    name: { $regex: `^${escaped}$`, $options: "i" },
  });
}

async function deleteOldImage(url: string) {
  if (!url) return;
  // Only delete blobs hosted on Vercel Blob
  if (url.includes("blob.vercel-storage.com")) {
    try {
      await del(url);
    } catch {
      // Ignore deletion errors
    }
  }
}

async function uploadToBlob(
  breweryName: string,
  file: File | Blob,
  ext: string
) {
  const safeName = breweryName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return put(`breweries/${safeName}-${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
}

// PUT /api/breweries/[name]/image – upload a brewery image (file or URL)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  await dbConnect();
  const brewery = await findBrewery(decodedName);
  if (!brewery) {
    return NextResponse.json({ error: "Brewery not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";

  let blobUrl: string;

  if (contentType.includes("application/json")) {
    // ---- URL-based upload ----
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Fetch the remote image
    let imgRes: Response;
    try {
      imgRes = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    } catch {
      return NextResponse.json(
        { error: "Could not fetch image from URL" },
        { status: 400 }
      );
    }

    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Could not fetch image from URL" },
        { status: 400 }
      );
    }

    const imgContentType = imgRes.headers.get("content-type") || "";
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext =
      Object.entries(extMap).find(([mime]) =>
        imgContentType.includes(mime)
      )?.[1] || "jpg";

    const imgBlob = await imgRes.blob();

    if (imgBlob.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Remote image too large. Max 5MB" },
        { status: 400 }
      );
    }

    await deleteOldImage(brewery.imageUrl || "");
    const blob = await uploadToBlob(brewery.name, imgBlob, ext);
    blobUrl = blob.url;
  } else {
    // ---- File-based upload ----
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    await deleteOldImage(brewery.imageUrl || "");
    const blob = await uploadToBlob(brewery.name, file, ext);
    blobUrl = blob.url;
  }

  brewery.imageUrl = blobUrl;
  await brewery.save();

  return NextResponse.json({ imageUrl: blobUrl });
}

// DELETE /api/breweries/[name]/image – remove a brewery image
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  await dbConnect();
  const brewery = await findBrewery(decodedName);
  if (!brewery) {
    return NextResponse.json({ error: "Brewery not found" }, { status: 404 });
  }

  if (brewery.imageUrl) {
    await deleteOldImage(brewery.imageUrl);
    brewery.imageUrl = "";
    await brewery.save();
  }

  return NextResponse.json({ success: true });
}
