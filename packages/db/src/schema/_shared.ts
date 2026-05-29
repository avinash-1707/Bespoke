import { timestamp } from "drizzle-orm/pg-core";

/**
 * Standard created/updated columns spread into every domain table so the
 * convention stays identical everywhere. `updatedAt` auto-bumps on write.
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};
