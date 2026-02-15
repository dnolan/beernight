import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrewery extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrewerySchema = new Schema<IBrewery>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Case-insensitive index for searching
BrewerySchema.index({ name: "text" });

// Delete cached model in dev so schema changes apply on HMR
if (process.env.NODE_ENV !== "production" && mongoose.models.Brewery) {
  mongoose.deleteModel("Brewery");
}

const Brewery: Model<IBrewery> =
  mongoose.models.Brewery || mongoose.model<IBrewery>("Brewery", BrewerySchema);

export default Brewery;
