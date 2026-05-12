/**
 * Delete a single event and all its beers/reviews by date range.
 * Usage: npx tsx scripts/_delete-event.ts "2020-12-01"
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

async function main() {
  const dateArg = process.argv[2];
  if (!dateArg) { console.error("Usage: npx tsx scripts/_delete-event.ts YYYY-MM-DD"); process.exit(1); }

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/beernight");
  const db = mongoose.connection.db!;

  const start = new Date(`${dateArg}T00:00:00Z`);
  const end = new Date(`${dateArg}T23:59:59Z`);

  const event = await db.collection("events").findOne({ date: { $gte: start, $lte: end } });
  if (!event) { console.log("No event found for", dateArg); process.exit(0); }

  const reviews = await db.collection("reviews").deleteMany({ eventId: event._id });
  const beers = await db.collection("beers").deleteMany({ eventId: event._id });
  await db.collection("events").deleteOne({ _id: event._id });

  console.log(`Deleted "${event.title}" — ${beers.deletedCount} beers, ${reviews.deletedCount} reviews`);
  await mongoose.disconnect();
}

main().catch(console.error);
