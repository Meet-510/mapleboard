type Level = "info" | "warn" | "error" | "debug";

function ts(): string {
  return new Date().toISOString();
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
  const line = meta
    ? `[${ts()}] ${level.toUpperCase()} ${msg} ${JSON.stringify(meta)}`
    : `[${ts()}] ${level.toUpperCase()} ${msg}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.DEBUG) emit("debug", msg, meta);
  },
};
