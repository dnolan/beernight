import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  beerId: Types.ObjectId;
  eventId: Types.ObjectId;
  userEmail: string;
  userName: string;
  rating: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    beerId: {
      type: Schema.Types.ObjectId,
      ref: "Beer",
      required: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    userName: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per beer
ReviewSchema.index({ beerId: 1, userEmail: 1 }, { unique: true });

// Delete cached model in dev so schema changes apply on HMR
if (process.env.NODE_ENV !== "production" && mongoose.models.Review) {
  mongoose.deleteModel("Review");
}

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
