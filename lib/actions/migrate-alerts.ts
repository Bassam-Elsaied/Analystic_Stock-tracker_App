"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";

/**
 * Migration script to add checkFrequency to existing alerts
 * Run this once to update old alerts that don't have checkFrequency
 */
export async function migrateAlertsCheckFrequency() {
  try {
    await connectToDatabase();

    // Update all alerts that don't have checkFrequency
    const result = await Alert.updateMany(
      { checkFrequency: { $exists: false } },
      { $set: { checkFrequency: "hourly" } }
    );

    console.log(
      `Updated ${result.modifiedCount} alerts with default checkFrequency`
    );

    return {
      success: true,
      message: `Updated ${result.modifiedCount} alerts`,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error migrating alerts:", error);
    return {
      success: false,
      message: "Failed to migrate alerts",
    };
  }
}
