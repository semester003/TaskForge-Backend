import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with this value already exists",
      });
    }

    if (err.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid related resource",
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export = errorHandler;
