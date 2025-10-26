import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) {
    console.log("Using cached auth instance");
    return authInstance;
  }

  try {
    console.log("🔐 Initializing Better Auth...");
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error("❌ Database connection exists but db is null");
      throw new Error("Failed to connect to database");
    }

    console.log("✅ Database connection verified");

    if (!process.env.BETTER_AUTH_SECRET) {
      console.error("❌ BETTER_AUTH_SECRET is not defined");
      throw new Error("BETTER_AUTH_SECRET is not defined");
    }

    // Use environment variable or default to localhost for development
    const baseURL =
      process.env.BETTER_AUTH_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://stocklytics-stock-tracker-app.vercel.app");

    if (!baseURL) {
      console.error("❌ BETTER_AUTH_BASE_URL is not defined");
      throw new Error(
        "BETTER_AUTH_BASE_URL is required. Set it in your environment variables."
      );
    }

    console.log(`✅ Better Auth Base URL: ${baseURL}`);

    authInstance = betterAuth({
      database: mongodbAdapter(db as Parameters<typeof mongodbAdapter>[0]),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: baseURL,
      trustedOrigins: [
        "http://localhost:3000",
        "https://stocklytics-stock-tracker-app.vercel.app",
      ],
      advanced: {
        useSecureCookies: process.env.NODE_ENV === "production",
        crossSubDomainCookies: {
          enabled: false,
        },
      },
      emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 124,
        autoSignIn: true,
      },
      plugins: [nextCookies()],
    });

    console.log("✅ Better Auth instance created successfully");
    return authInstance;
  } catch (error) {
    console.error("❌ Failed to initialize auth:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
};

export const auth = getAuth();
