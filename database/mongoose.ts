import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: null | typeof mongoose;
    promise: null | Promise<typeof import("mongoose")>;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    console.log("Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new database connection...");
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(
      `✅ Connected to database - Environment: ${process.env.NODE_ENV}`
    );
    console.log(`Database name: ${cached.conn.connection.db?.databaseName}`);
    console.log(`Connection state: ${cached.conn.connection.readyState}`);
  } catch (error) {
    cached.promise = null;
    console.error("❌ Failed to connect to database:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    throw error;
  }

  return cached.conn;
};
