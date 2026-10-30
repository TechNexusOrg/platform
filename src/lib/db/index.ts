import * as schema from "./schema";

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (
    databaseUrl &&
    (databaseUrl.startsWith("postgres://") ||
      databaseUrl.startsWith("postgresql://") ||
      databaseUrl.startsWith("postgres:"))
  ) {
    try {
      const { drizzle } = await import("drizzle-orm/postgres-js");
      const postgres = (await import("postgres")).default;
      const client = postgres(databaseUrl, {
        max: process.env.NODE_ENV === "production" ? 10 : 1,
      });
      dbInstance = drizzle(client, { schema });
      return dbInstance;
    } catch (err: any) {
      console.error("Failed to connect to PostgreSQL database:", err);
      throw new Error(`Production database connection failed: ${err.message}`);
    }
  }

  // Fail-closed in production: Never silently fall back to local file or memory
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Fatal: Production environment requires a valid PostgreSQL DATABASE_URL. PGlite local database fallback is strictly disabled in production."
    );
  }

  // Embedded PGlite fallback for local development & testing
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");

  // In test environment, use pure in-memory instance
  const pglite =
    process.env.NODE_ENV === "test"
      ? new PGlite()
      : new PGlite(process.env.PGLITE_DATA_DIR || "./.data/pglite");

  dbInstance = drizzle(pglite, { schema });
  return dbInstance;
}

export { schema };
