import type { Request, Response } from "express";

const healthCheck = (_req: Request, res: Response): Response => {
  return res.status(200).json({
    success: true,
    message: "TaskForge API is running",
  });
};

export { healthCheck };
