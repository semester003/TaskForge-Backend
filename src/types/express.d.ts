import type { AuthenticatedUser } from "./http";

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
    }
  }
}

export {};
