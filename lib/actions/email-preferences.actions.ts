"use server";

import { connectToDatabase } from "@/database/mongoose";
import { EmailPreferences } from "@/database/models/email-preferences.model";
import { ObjectId } from "mongodb";

type EmailType = "welcomeEmails" | "newsEmails" | "priceAlerts" | "all";

export const unsubscribeFromEmails = async (
  userId: string,
  emailType: EmailType = "all"
) => {
  try {
    await connectToDatabase();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Get user - try different formats
    let user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ id: userId });

    // Try by ObjectId if not found
    if (!user && ObjectId.isValid(userId)) {
      user = await db
        .collection("user")
        .findOne<{ _id?: unknown; id?: string; email?: string }>({
          _id: new ObjectId(userId),
        });
    }

    if (!user?.email) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Get the actual userId from the user document
    const actualUserId = (user.id as string) || String(user._id);

    // Find or create email preferences
    let preferences = await EmailPreferences.findOne({ userId: actualUserId });

    if (!preferences) {
      preferences = new EmailPreferences({
        userId: actualUserId,
        email: user.email,
        unsubscribedFrom: {
          welcomeEmails: false,
          newsEmails: false,
          priceAlerts: false,
        },
      });
    }

    // Update unsubscribe preferences
    if (emailType === "all") {
      preferences.unsubscribedFrom.welcomeEmails = true;
      preferences.unsubscribedFrom.newsEmails = true;
      preferences.unsubscribedFrom.priceAlerts = true;
      preferences.unsubscribedAt = new Date();
    } else {
      preferences.unsubscribedFrom[emailType] = true;
      // If all are now true, set unsubscribedAt
      if (
        preferences.unsubscribedFrom.welcomeEmails &&
        preferences.unsubscribedFrom.newsEmails &&
        preferences.unsubscribedFrom.priceAlerts
      ) {
        preferences.unsubscribedAt = new Date();
      }
    }

    await preferences.save();

    return {
      success: true,
      message: "Successfully unsubscribed from emails",
    };
  } catch (error) {
    console.error("Error unsubscribing from emails:", error);
    return {
      success: false,
      message: "Failed to unsubscribe. Please try again.",
    };
  }
};

export const resubscribeToEmails = async (
  userId: string,
  emailType: EmailType = "all"
) => {
  try {
    await connectToDatabase();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Get user - try different formats
    let user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string }>({ id: userId });

    // Try by ObjectId if not found
    if (!user && ObjectId.isValid(userId)) {
      user = await db
        .collection("user")
        .findOne<{ _id?: unknown; id?: string }>({
          _id: new ObjectId(userId),
        });
    }

    // Get the actual userId
    const actualUserId = user
      ? (user.id as string) || String(user._id)
      : userId;

    const preferences = await EmailPreferences.findOne({
      userId: actualUserId,
    });

    if (!preferences) {
      return {
        success: true,
        message: "You are already subscribed to all emails",
      };
    }

    // Update subscribe preferences
    if (emailType === "all") {
      preferences.unsubscribedFrom.welcomeEmails = false;
      preferences.unsubscribedFrom.newsEmails = false;
      preferences.unsubscribedFrom.priceAlerts = false;
      preferences.unsubscribedAt = undefined;
    } else {
      preferences.unsubscribedFrom[emailType] = false;
      // If all are now false, clear unsubscribedAt
      if (
        !preferences.unsubscribedFrom.welcomeEmails &&
        !preferences.unsubscribedFrom.newsEmails &&
        !preferences.unsubscribedFrom.priceAlerts
      ) {
        preferences.unsubscribedAt = undefined;
      }
    }

    await preferences.save();

    return {
      success: true,
      message: "Successfully resubscribed to emails",
    };
  } catch (error) {
    console.error("Error resubscribing to emails:", error);
    return {
      success: false,
      message: "Failed to resubscribe. Please try again.",
    };
  }
};

export const checkEmailSubscription = async (
  userId: string,
  emailType: EmailType
): Promise<boolean> => {
  try {
    await connectToDatabase();

    const preferences = await EmailPreferences.findOne({ userId });

    if (!preferences) {
      return true; // User is subscribed by default
    }

    if (emailType === "all") {
      return (
        !preferences.unsubscribedFrom.welcomeEmails ||
        !preferences.unsubscribedFrom.newsEmails ||
        !preferences.unsubscribedFrom.priceAlerts
      );
    }

    return !preferences.unsubscribedFrom[emailType];
  } catch (error) {
    console.error("Error checking email subscription:", error);
    return true; // Default to allowing emails if there's an error
  }
};

export const getEmailPreferences = async (userId: string) => {
  try {
    await connectToDatabase();

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Get user email - try different formats
    let user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ id: userId });

    // If not found by id field, try by _id as ObjectId
    if (!user && ObjectId.isValid(userId)) {
      user = await db
        .collection("user")
        .findOne<{ _id?: unknown; id?: string; email?: string }>({
          _id: new ObjectId(userId),
        });
    }

    if (!user?.email) {
      return {
        success: false,
        message: "User not found",
        preferences: null,
      };
    }

    // Get the actual userId from the user document
    const actualUserId = (user.id as string) || String(user._id);

    const preferences = await EmailPreferences.findOne({
      userId: actualUserId,
    });

    // Return default values if no preferences found
    if (!preferences) {
      return {
        success: true,
        preferences: {
          email: user.email,
          subscribedTo: {
            welcomeEmails: true,
            newsEmails: true,
            priceAlerts: true,
          },
          unsubscribedAt: undefined,
        },
      };
    }

    return {
      success: true,
      preferences: {
        email: user.email,
        subscribedTo: {
          welcomeEmails: !preferences.unsubscribedFrom.welcomeEmails,
          newsEmails: !preferences.unsubscribedFrom.newsEmails,
          priceAlerts: !preferences.unsubscribedFrom.priceAlerts,
        },
        unsubscribedAt: preferences.unsubscribedAt,
      },
    };
  } catch (error) {
    console.error("Error getting email preferences:", error);
    return {
      success: false,
      message: "Failed to get preferences",
      preferences: null,
    };
  }
};
