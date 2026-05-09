import env from "./env";
import { CookieOptions } from "express";

const isProduction = env.NODE_ENV === "production";

export const COOKIE_NAME = "refreshToken";

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/api/auth"
};