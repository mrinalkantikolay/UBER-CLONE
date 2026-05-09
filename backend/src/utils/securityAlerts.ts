import logger from "../config/logger";
import metrics from "../metrics";

export const alertSecurity = (type: string, details: Record<string, unknown>) => {
  logger.warn({ type, ...details }, "SECURITY_ALERT");

  // lightweight mapping to metrics
  if (type === "refresh_reuse") {
    metrics.refreshReuseDetected.inc();
  }
};
