import type { NextFunction, Request, Response } from "express";
import { SeatStatus } from "@prisma/client";
import { z } from "zod";
import { inventoryService } from "../../modules/inventory/inventory.service";
import { logger } from "../../utils/logger";

const createSeatSchema = z.object({
  price: z.coerce.number().positive().max(1000000),
  count: z.coerce.number().int().positive().max(500).optional().default(1),
  status: z.nativeEnum(SeatStatus).optional(),
});

export async function createSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createSeatSchema.parse(req.body);
    const result = await inventoryService.createSeats(payload);
    logger.info("Admin bulk seat creation completed", {
      price: payload.price,
      count: payload.count ?? 1,
      status: payload.status ?? SeatStatus.AVAILABLE,
      createdCount: result.createdCount,
    });
    res.status(201).json({ data: result });
  } catch (error) {
    logger.error("Admin bulk seat creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}
