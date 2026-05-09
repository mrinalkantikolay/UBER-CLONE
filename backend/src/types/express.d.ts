/* Express type augmentation */

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role?: string;
    };
    requestId?: string;
    traceId?: string;
  }
}
