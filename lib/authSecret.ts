export const authSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "temporary-secret-change-in-production";
