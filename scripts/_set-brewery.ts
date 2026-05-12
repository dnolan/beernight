import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/beernight");
  const db = mongoose.connection.db!;

  const start = new Date(Date.UTC(2020, 0, 1));
  const end = new Date(Date.UTC(2024, 11, 31, 23, 59, 59));

  const events = await db.collection("events")
    .find({ date: { $gte: start, $lte: end } }, { projection: { _id: 1 } })
    .toArray();

  const eventIds = events.map((e) => e._id);
  console.log(`Found ${eventIds.length} events in 2020–2024`);

  const result = await db.collection("beers").updateMany(
    { eventId: { $in: eventIds } },
    { $set: { brewery: "Brew York", breweries: ["Brew York"] } }
  );

  console.log(`Updated ${result.modifiedCount} beers → brewery: "Brew York"`);
  await mongoose.disconnect();
}

main().catch(console.error);
