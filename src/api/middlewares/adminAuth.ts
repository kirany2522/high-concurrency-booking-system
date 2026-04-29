import type { NextFunction, Request, Response } from "express";
import { env } from "../../utils/env";
import { AppError } from "../../utils/errors";

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  const apiKey = req.header("x-admin-api-key");

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return next(new AppError(401, "Unauthorized", "UNAUTHORIZED"));
  }

  return next();
}
