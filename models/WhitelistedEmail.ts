import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWhitelistedEmail extends Document {
  email: string;
  addedAt: Date;
}

const WhitelistedEmailSchema = new Schema<IWhitelistedEmail>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WhitelistedEmail: Model<IWhitelistedEmail> =
  mongoose.models.WhitelistedEmail ||
  mongoose.model<IWhitelistedEmail>("WhitelistedEmail", WhitelistedEmailSchema);

export default WhitelistedEmail;
