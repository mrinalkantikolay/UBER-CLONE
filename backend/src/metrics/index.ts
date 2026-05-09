import client from "prom-client";

const register = new client.Registry();

const loginSuccess = new client.Counter({
  name: "auth_login_success_total",
  help: "Total successful logins",
});

const loginFailure = new client.Counter({
  name: "auth_login_failure_total",
  help: "Total failed login attempts",
});

const otpRequested = new client.Counter({
  name: "auth_otp_requested_total",
  help: "Total OTP requests",
});

const otpVerified = new client.Counter({
  name: "auth_otp_verified_total",
  help: "Total OTP verifications",
});

const otpFailure = new client.Counter({
  name: "auth_otp_failure_total",
  help: "Total OTP failures (invalid/expired)",
});

const otpBlocked = new client.Counter({
  name: "auth_otp_blocked_total",
  help: "Total OTP global blocks applied",
});

const refreshRequests = new client.Counter({
  name: "auth_refresh_requests_total",
  help: "Total refresh token requests",
});

const refreshReuseDetected = new client.Counter({
  name: "auth_refresh_reuse_detected_total",
  help: "Total refresh token reuse detections",
});

/* ---- RIDE METRICS ---- */

const rideCreated = new client.Counter({
  name: "ride_created_total",
  help: "Total rides created",
});

const rideCancelled = new client.Counter({
  name: "ride_cancelled_total",
  help: "Total rides cancelled",
});

const rideCompleted = new client.Counter({
  name: "ride_completed_total",
  help: "Total rides completed",
});

register.registerMetric(loginSuccess);
register.registerMetric(loginFailure);
register.registerMetric(otpRequested);
register.registerMetric(otpVerified);
register.registerMetric(refreshRequests);
register.registerMetric(refreshReuseDetected);
register.registerMetric(otpFailure);
register.registerMetric(otpBlocked);
register.registerMetric(rideCreated);
register.registerMetric(rideCancelled);
register.registerMetric(rideCompleted);

export default {
  register,
  loginSuccess,
  loginFailure,
  otpRequested,
  otpVerified,
  otpFailure,
  otpBlocked,
  refreshRequests,
  refreshReuseDetected,
  rideCreated,
  rideCancelled,
  rideCompleted,
};
