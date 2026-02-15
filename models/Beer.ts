import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBeer extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  name: string;
  brewery: string; // kept for backward compat – derived from breweries
  breweries: string[];
  style: string;
  abv: number;
  createdAt: Date;
  updatedAt: Date;
}

const BeerSchema = new Schema<IBeer>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brewery: {
      type: String,
      trim: true,
      default: "",
    },
    breweries: {
      type: [String],
      default: [],
    },
    style: {
      type: String,
      trim: true,
      default: "",
    },
    abv: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Beer: Model<IBeer> =
  mongoose.models.Beer || mongoose.model<IBeer>("Beer", BeerSchema);

export default Beer;
