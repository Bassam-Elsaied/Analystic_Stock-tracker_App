"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { auth } from "@/lib/better-auth/auth";
import { revalidatePath } from "next/cache";

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}

export async function addToWatchlist(symbol: string, company: string) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    // Check if already in watchlist
    const existing = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    if (existing) {
      return { success: false, message: "Stock already in watchlist" };
    }

    await Watchlist.create({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      company,
      addedAt: new Date(),
    });

    revalidatePath("/watchlist");
    revalidatePath("/");

    return { success: true, message: "Added to watchlist" };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return { success: false, message: "Failed to add to watchlist" };
  }
}

export async function removeFromWatchlist(symbol: string) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    await connectToDatabase();

    await Watchlist.deleteOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    revalidatePath("/watchlist");
    revalidatePath("/");

    return { success: true, message: "Removed from watchlist" };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return { success: false, message: "Failed to remove from watchlist" };
  }
}

export async function getUserWatchlist(): Promise<StockWithData[]> {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return [];
    }

    await connectToDatabase();

    const items = await Watchlist.find({ userId: session.user.id })
      .sort({ addedAt: -1 })
      .lean();

    const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!FINNHUB_API_KEY) {
      return items.map((item) => ({
        userId: item.userId,
        symbol: item.symbol,
        company: item.company,
        addedAt: item.addedAt,
      }));
    }

    // Fetch stock data for each symbol
    const watchlistWithData = await Promise.all(
      items.map(async (item) => {
        try {
          // Fetch quote data (price and change)
          const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 60 } }
          );
          const quoteData: QuoteData = await quoteRes.json();

          // Fetch company profile (for market cap)
          const profileRes = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 3600 } }
          );
          const profileData: ProfileData = await profileRes.json();

          // Fetch financials (for P/E ratio)
          const financialsRes = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${item.symbol}&metric=all&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 3600 } }
          );
          const financialsData: FinancialsData = await financialsRes.json();

          const currentPrice = quoteData.c;
          const changePercent = quoteData.dp;
          const marketCap = profileData.marketCapitalization;
          const peRatio = financialsData.metric?.peNormalizedAnnual;

          return {
            userId: item.userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
            currentPrice,
            changePercent,
            priceFormatted: currentPrice
              ? `$${currentPrice.toFixed(2)}`
              : "N/A",
            changeFormatted: changePercent
              ? `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`
              : "N/A",
            marketCap: marketCap
              ? marketCap >= 1e12
                ? `$${(marketCap / 1e12).toFixed(2)}T`
                : marketCap >= 1e9
                ? `$${(marketCap / 1e9).toFixed(2)}B`
                : marketCap >= 1e6
                ? `$${(marketCap / 1e6).toFixed(2)}M`
                : `$${marketCap.toFixed(2)}`
              : "N/A",
            peRatio: peRatio ? peRatio.toFixed(2) : "N/A",
          };
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error);
          return {
            userId: item.userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
          };
        }
      })
    );

    return watchlistWithData;
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    return [];
  }
}
