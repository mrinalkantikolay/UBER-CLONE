import dotenv from "dotenv";

dotenv.config();

/* =========================
   Validation
========================= */

const requiredVars = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "COOKIE_SECRET",
  "REDIS_URL"
] as const;

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

/* =========================
   Config
========================= */

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  COOKIE_SECRET: string;
  CORS_ORIGIN: string;
  SERVICE_NAME: string;
  METRICS_TOKEN: string;
  KAFKA_BROKERS: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

const env: EnvConfig = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  COOKIE_SECRET: process.env.COOKIE_SECRET!,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  SERVICE_NAME: process.env.SERVICE_NAME || "uber-backend",
  METRICS_TOKEN: process.env.METRICS_TOKEN || "",
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};

export default env;