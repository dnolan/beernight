import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

export default async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  // Mongoose internally tracks connection state.
  // Calling connect() when already connected is a no-op.
  await mongoose.connect(MONGODB_URI);
  return mongoose;
}
