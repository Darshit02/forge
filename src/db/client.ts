import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";
import { logger } from "../utils/logger.js";

// Initialize postgres client
// max: 10 connections for backend API pool
export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // silence standard notice spam
});

export const db = drizzle(queryClient, { schema });

/**
 * Check if database is reachable
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    logger.info("Database connection established successfully");
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to connect to PostgreSQL database");
    return false;
  }
}

/**
 * Close database pool on shutdown
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await queryClient.end();
    logger.info("Database connection pool closed");
  } catch (err) {
    logger.error({ err }, "Error closing database connection pool");
  }
}
