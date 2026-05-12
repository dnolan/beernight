import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/beernight");
  const db = mongoose.connection.db!;

  const start = new Date(Date.UTC(2020, 0, 1));
  const end = new Date(Date.UTC(2024, 11, 31, 23, 59, 59));

  const events = await db.collection("events")
    .find({ date: { $gte: start, $lte: end } }, { projection: { _id: 1, title: 1 } })
    .toArray();

  const eventIds = events.map((e) => e._id);
  const reviews = await db.collection("reviews").deleteMany({ eventId: { $in: eventIds } });
  const beers = await db.collection("beers").deleteMany({ eventId: { $in: eventIds } });
  const evts = await db.collection("events").deleteMany({ _id: { $in: eventIds } });

  console.log(`Deleted ${evts.deletedCount} events, ${beers.deletedCount} beers, ${reviews.deletedCount} reviews`);
  await mongoose.disconnect();
}

main().catch(console.error);
