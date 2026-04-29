import express from "express";
import { apiRouter } from "./api/routes";
import { errorHandler, notFoundHandler } from "./utils/errors";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(apiRouter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
