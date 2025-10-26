import { Schema, model, models, type Document, type Model } from "mongoose";

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
  isActive: boolean;
  checkFrequency: "15min" | "30min" | "hourly" | "daily";
  lastChecked?: Date;
  lastTriggered?: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: {
      type: String,
      required: true,
      enum: ["upper", "lower"],
    },
    threshold: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    checkFrequency: {
      type: String,
      required: true,
      enum: ["15min", "30min", "hourly", "daily"],
      default: "hourly",
    },
    lastChecked: { type: Date, default: null },
    lastTriggered: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index for faster queries
AlertSchema.index({ userId: 1, symbol: 1 });

export const Alert: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>("Alert", AlertSchema);
