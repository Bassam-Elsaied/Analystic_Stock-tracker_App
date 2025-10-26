import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error("Database connection exists but db is null");
      throw new Error("Failed to connect to database");
    }

    if (!process.env.BETTER_AUTH_SECRET) {
      console.error("BETTER_AUTH_SECRET is not defined");
      throw new Error("BETTER_AUTH_SECRET is not defined");
    }

    if (!process.env.BETTER_AUTH_BASE_URL) {
      console.error("BETTER_AUTH_BASE_URL is not defined");
      throw new Error("BETTER_AUTH_BASE_URL is not defined");
    }

    authInstance = betterAuth({
      database: mongodbAdapter(db as Parameters<typeof mongodbAdapter>[0]),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_BASE_URL,
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

    console.log("Auth instance created successfully");
    return authInstance;
  } catch (error) {
    console.error("Failed to initialize auth:", error);
    throw error;
  }
};

export const auth = getAuth();
