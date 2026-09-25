import fs from "fs";
import path from "path";
import { getDb } from "./index";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  const db = await getDb();
  
  // Find all .sql files in drizzle/
  const migrationsDir = path.resolve(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Split statements separated by --> statement-breakpoint
    const statements = content.split("--> statement-breakpoint");
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        try {
          await db.execute(sql.raw(trimmed));
        } catch (err: any) {
          // Ignore if table/type/index already exists
          if (!err.message?.includes("already exists")) {
            console.warn(`Migration notice for ${file}:`, err.message);
          }
        }
      }
    }
  }
}
