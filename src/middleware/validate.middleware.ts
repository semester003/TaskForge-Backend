import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { z } from "zod";

const validate = (schema: z.ZodType) => {
  return (
    req: Request<ParamsDictionary, unknown, unknown>,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues,
      });
    }

    next();
  };
};

export = validate;
