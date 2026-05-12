import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/beernight";
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const events = await db.collection("events")
    .find({}, { projection: { title: 1, date: 1, chooser: 1 } })
    .sort({ date: 1 })
    .toArray();

  console.log("Total events:", events.length);
  for (const e of events) {
    const beerCount = await db.collection("beers").countDocuments({ eventId: e._id });
    const reviewCount = await db.collection("reviews").countDocuments({ eventId: e._id });
    console.log(e.date?.toISOString().slice(0, 10), JSON.stringify(e.title), `| ${beerCount} beers ${reviewCount} reviews`);
  }

  const totalBeers = await db.collection("beers").countDocuments();
  const totalReviews = await db.collection("reviews").countDocuments();
  console.log(`\nTotals: ${totalBeers} beers, ${totalReviews} reviews`);

  await mongoose.disconnect();
}

main().catch(console.error);
