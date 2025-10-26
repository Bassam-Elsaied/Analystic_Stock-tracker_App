"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { auth } from "@/lib/better-auth/auth";
import { revalidatePath } from "next/cache";

export async function createAlert(alertData: AlertData) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    await Alert.create({
      userId: session.user.id,
      symbol: alertData.symbol.toUpperCase(),
      company: alertData.company,
      alertName: alertData.alertName,
      alertType: alertData.alertType,
      threshold: parseFloat(alertData.threshold),
      checkFrequency: alertData.checkFrequency,
      createdAt: new Date(),
    });

    revalidatePath("/watchlist");

    return { success: true, message: "Alert created successfully" };
  } catch (error) {
    console.error("Error creating alert:", error);
    return { success: false, message: "Failed to create alert" };
  }
}

export async function updateAlert(alertId: string, alertData: AlertData) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    const alert = await Alert.findOne({
      _id: alertId,
      userId: session.user.id,
    });

    if (!alert) {
      return { success: false, message: "Alert not found" };
    }

    alert.symbol = alertData.symbol.toUpperCase();
    alert.company = alertData.company;
    alert.alertName = alertData.alertName;
    alert.alertType = alertData.alertType;
    alert.threshold = parseFloat(alertData.threshold);
    alert.checkFrequency = alertData.checkFrequency;

    await alert.save();

    revalidatePath("/watchlist");

    return { success: true, message: "Alert updated successfully" };
  } catch (error) {
    console.error("Error updating alert:", error);
    return { success: false, message: "Failed to update alert" };
  }
}

export async function deleteAlert(alertId: string) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    const result = await Alert.deleteOne({
      _id: alertId,
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return { success: false, message: "Alert not found" };
    }

    revalidatePath("/watchlist");

    return { success: true, message: "Alert deleted successfully" };
  } catch (error) {
    console.error("Error deleting alert:", error);
    return { success: false, message: "Failed to delete alert" };
  }
}

export async function reactivateAlert(alertId: string) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    const alert = await Alert.findOne({
      _id: alertId,
      userId: session.user.id,
    });

    if (!alert) {
      return { success: false, message: "Alert not found" };
    }

    alert.isActive = true;
    alert.lastTriggered = undefined;
    await alert.save();

    revalidatePath("/watchlist");

    return { success: true, message: "Alert reactivated successfully" };
  } catch (error) {
    console.error("Error reactivating alert:", error);
    return { success: false, message: "Failed to reactivate alert" };
  }
}

export async function getUserAlerts(): Promise<Alert[]> {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return [];
    }

    await connectToDatabase();

    const alerts = await Alert.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!FINNHUB_API_KEY) {
      return alerts.map((alert) => ({
        id: String(alert._id),
        symbol: alert.symbol,
        company: alert.company,
        alertName: alert.alertName,
        alertType: alert.alertType,
        threshold: alert.threshold,
        currentPrice: 0,
        isActive: alert.isActive,
        checkFrequency: alert.checkFrequency,
        lastChecked: alert.lastChecked,
        lastTriggered: alert.lastTriggered,
      }));
    }

    // Fetch current prices for each alert
    const alertsWithPrices = await Promise.all(
      alerts.map(async (alert) => {
        try {
          const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${alert.symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
          );
          const quoteData = await quoteRes.json();

          const currentPrice = quoteData.c || 0;
          const previousClose = quoteData.pc || currentPrice;
          const changePercent = previousClose
            ? ((currentPrice - previousClose) / previousClose) * 100
            : 0;

          return {
            id: String(alert._id),
            symbol: alert.symbol,
            company: alert.company,
            alertName: alert.alertName,
            alertType: alert.alertType,
            threshold: alert.threshold,
            currentPrice,
            changePercent,
            isActive: alert.isActive,
            checkFrequency: alert.checkFrequency,
            lastChecked: alert.lastChecked,
            lastTriggered: alert.lastTriggered,
          };
        } catch (error) {
          console.error(`Error fetching price for ${alert.symbol}:`, error);
          return {
            id: String(alert._id),
            symbol: alert.symbol,
            company: alert.company,
            alertName: alert.alertName,
            alertType: alert.alertType,
            threshold: alert.threshold,
            currentPrice: 0,
            isActive: alert.isActive,
            checkFrequency: alert.checkFrequency,
            lastChecked: alert.lastChecked,
            lastTriggered: alert.lastTriggered,
          };
        }
      })
    );

    return alertsWithPrices;
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    return [];
  }
}
