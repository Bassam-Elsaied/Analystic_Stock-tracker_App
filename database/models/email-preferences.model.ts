import { Schema, model, models, type Document, type Model } from "mongoose";

export interface EmailPreferencesItem extends Document {
  userId: string;
  email: string;
  unsubscribedFrom: {
    welcomeEmails: boolean;
    newsEmails: boolean;
    priceAlerts: boolean;
  };
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailPreferencesSchema = new Schema<EmailPreferencesItem>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    unsubscribedFrom: {
      welcomeEmails: { type: Boolean, default: false },
      newsEmails: { type: Boolean, default: false },
      priceAlerts: { type: Boolean, default: false },
    },
    unsubscribedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update the updatedAt timestamp on save
EmailPreferencesSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const EmailPreferences: Model<EmailPreferencesItem> =
  (models?.EmailPreferences as Model<EmailPreferencesItem>) ||
  model<EmailPreferencesItem>("EmailPreferences", EmailPreferencesSchema);
