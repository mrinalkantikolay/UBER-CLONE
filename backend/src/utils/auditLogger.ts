import logger from "../config/logger";

const audit = (action: string, details: Record<string, unknown>) => {
  logger.info({ action, ...details }, "AUDIT");
};

export default audit;
