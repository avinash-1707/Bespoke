/**
 * Drizzle schema — single source of truth for every table. One file per
 * domain, all re-exported here. Better Auth owns the auth tables (auth.ts);
 * our domain tables reference `user.id`.
 */

export * from "./auth";
export * from "./offerings";
export * from "./prompts";
export * from "./prospects";
export * from "./conversations";
export * from "./messages";
export * from "./jobs";
export * from "./analytics";
export * from "./settings";
