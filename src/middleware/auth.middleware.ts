import type { NextFunction, Request, Response } from "express";
import jwt = require("jsonwebtoken");
import type { AuthenticatedRequest, AuthenticatedUser } from "../types/http";

const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1] as string;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret);
    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.user = decoded as AuthenticatedUser;
    next();
  } catch (_error: unknown) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export = authenticate;
