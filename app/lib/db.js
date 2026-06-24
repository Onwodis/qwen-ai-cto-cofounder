import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn('[DB] MONGODB_URI not configured — running without persistence.');
    return null;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
