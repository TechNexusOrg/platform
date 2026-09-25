import * as schema from "./schema";

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith("postgres")) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(databaseUrl, {
      max: process.env.NODE_ENV === "production" ? 10 : 1,
    });
    dbInstance = drizzle(client, { schema });
    return dbInstance;
  }

  // Embedded PGlite fallback for local development & testing
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");

  // In test environment, use pure in-memory instance
  const pglite = process.env.NODE_ENV === "test"
    ? new PGlite()
    : new PGlite(process.env.PGLITE_DATA_DIR || "./.data/pglite");

  dbInstance = drizzle(pglite, { schema });
  return dbInstance;
}

export { schema };
