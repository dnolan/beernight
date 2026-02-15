import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title?: string;
  date: Date;
  chooser?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    chooser: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ date: -1 });

// Delete cached model in dev so schema changes apply on HMR
if (process.env.NODE_ENV !== "production" && mongoose.models.Event) {
  mongoose.deleteModel("Event");
}

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
