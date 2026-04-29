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

const seatIdParamsSchema = z.object({
  seatId: z.string().min(1),
});

const updateSeatSchema = z
  .object({
    price: z.coerce.number().positive().max(1000000).optional(),
    status: z.nativeEnum(SeatStatus).optional(),
  })
  .refine((value) => value.price !== undefined || value.status !== undefined, {
    message: "At least one field must be provided",
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

export async function updateSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const { seatId } = seatIdParamsSchema.parse(req.params);
    const payload = updateSeatSchema.parse(req.body);
    const seat = await inventoryService.updateSeat(seatId, payload);

    logger.info("Admin seat update completed", {
      seatId,
      fields: Object.keys(payload),
    });

    res.status(200).json({ data: seat });
  } catch (error) {
    logger.error("Admin seat update failed", {
      seatId: req.params.seatId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}

export async function deleteSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const { seatId } = seatIdParamsSchema.parse(req.params);
    const seat = await inventoryService.deleteSeat(seatId);

    logger.info("Admin seat delete completed", {
      seatId,
    });

    res.status(200).json({ data: seat });
  } catch (error) {
    logger.error("Admin seat delete failed", {
      seatId: req.params.seatId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
}
