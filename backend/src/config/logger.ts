import pino, { Logger } from "pino";
import { getLogContext } from "./logContext";

/*
  NOTE: We read NODE_ENV directly from process.env here
  because this file is imported by env.ts — importing env
  here would cause a circular dependency.
*/

const base: Logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
        target: "pino-pretty",
        options: { colorize: true }
      }
      : undefined
});

// Wrapper that enriches all logs with AsyncLocalStorage context (requestId, userId)
const logger: Logger = new Proxy(base, {
  get(target, prop: string) {
    const orig = (target as unknown as Record<string, unknown>)[prop];
    if (typeof orig !== "function") return orig;
    return (...args: unknown[]) => {
      try {
        const ctx = getLogContext() || {};

        if (args.length === 0) return (orig as Function).call(target);

        // if first arg is object, merge ctx into it
        if (typeof args[0] === "object" && !Array.isArray(args[0])) {
          args[0] = { ...ctx, ...(args[0] as Record<string, unknown>) };
          return (orig as Function).apply(target, args);
        }

        // first arg is message string — call with ctx then message
        return (orig as Function).call(target, ctx, ...args);
      } catch (err) {
        // fallback to original logger on any error
        return (orig as Function).apply(target, args);
      }
    };
  },
}) as Logger;

export default logger;