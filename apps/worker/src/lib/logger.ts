import { config } from "../config";

/** Severity levels, ordered low → high. */
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Min level to emit: debug in dev, info elsewhere. */
const minLevel: Level = config.NODE_ENV === "development" ? "debug" : "info";

/** Structured context attached to a log line. */
type Context = Record<string, unknown>;

function write(level: Level, message: string, context?: Context): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const line = {
    time: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // JSON to stdout/stderr so platform log collectors can parse it.
  const out = JSON.stringify(line);
  if (level === "error" || level === "warn") {
    console.error(out);
  } else {
    console.log(out);
  }
}

/**
 * Minimal structured logger for the worker. Emits one JSON object per line —
 * parseable by log collectors, greppable by humans. Bound context (e.g. a
 * `job` id) can be carried with `child` so every line in a job shares it.
 */
export const logger = {
  debug: (message: string, context?: Context) => write("debug", message, context),
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),

  /** Return a logger that merges `bound` into every line's context. */
  child(bound: Context) {
    const bind =
      (level: Level) => (message: string, context?: Context) =>
        write(level, message, { ...bound, ...context });
    return {
      debug: bind("debug"),
      info: bind("info"),
      warn: bind("warn"),
      error: bind("error"),
    };
  },
};

export type Logger = ReturnType<typeof logger.child>;
