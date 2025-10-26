"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { Watchlist } from "@/database/models/watchlist.model";
import { EmailPreferences } from "@/database/models/email-preferences.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongoose connection not connected");

    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();

    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id?.toString() || "",
        email: user.email,
        name: user.name,
      }));
  } catch (e) {
    console.error("Error fetching users for news email:", e);
    return [];
  }
};

export const deleteUserAccount = async () => {
  try {
    await connectToDatabase();
    const session = await (
      await auth
    ).api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized - please sign in",
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log("🗑️ Starting account deletion for userId:", userId);
    console.log("📧 User email:", userEmail);

    // Get database connection
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Check user exists before deletion
    const userToDelete = await db
      .collection("user")
      .findOne({ $or: [{ id: userId }, { email: userEmail }] });
    console.log("👤 User found in DB:", userToDelete ? "YES" : "NO");
    if (userToDelete) {
      console.log("User data:", JSON.stringify(userToDelete, null, 2));
    }

    // Delete all user's alerts
    const alertsDeleted = await Alert.deleteMany({ userId });
    console.log("✅ Deleted alerts:", alertsDeleted.deletedCount);

    // Delete all user's watchlist items
    const watchlistDeleted = await Watchlist.deleteMany({ userId });
    console.log("✅ Deleted watchlist items:", watchlistDeleted.deletedCount);

    // Delete user's email preferences
    const preferencesDeleted = await EmailPreferences.deleteMany({ userId });
    console.log(
      "✅ Deleted email preferences:",
      preferencesDeleted.deletedCount
    );

    // Delete from session collection first (before deleting user)
    const sessionsDeleted = await db
      .collection("session")
      .deleteMany({ userId: userId });
    console.log("✅ Deleted sessions:", sessionsDeleted.deletedCount);

    // Delete from account collection if exists
    const accountsDeleted = await db
      .collection("account")
      .deleteMany({ userId: userId });
    console.log("✅ Deleted accounts:", accountsDeleted.deletedCount);

    // Delete from user collection - try both id and email to be safe
    const userDeleted = await db.collection("user").deleteOne({
      $or: [{ id: userId }, { email: userEmail }],
    });
    console.log("✅ Deleted user:", userDeleted.deletedCount);

    // Verify deletion
    if (userDeleted.deletedCount === 0) {
      console.error("❌ User was not deleted from database!");
      throw new Error("Failed to delete user from database");
    }

    console.log("🎉 Account deletion completed successfully");

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("❌ Error deleting user account:", error);
    return {
      success: false,
      message: "Failed to delete account. Please try again.",
    };
  }
};
