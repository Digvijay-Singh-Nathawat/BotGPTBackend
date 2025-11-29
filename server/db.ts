import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

export const db = drizzle(process.env.DATABASE_URL, { schema });
