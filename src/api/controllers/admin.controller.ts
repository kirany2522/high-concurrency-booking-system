import type { NextFunction, Request, Response } from "express";
import { SeatStatus } from "@prisma/client";
import { z } from "zod";
import { inventoryService } from "../../modules/inventory/inventory.service";

const createSeatSchema = z.object({
  price: z.coerce.number().positive(),
  count: z.coerce.number().int().positive().max(1000).optional().default(1),
  status: z.nativeEnum(SeatStatus).optional(),
});

export async function createSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createSeatSchema.parse(req.body);
    const result = await inventoryService.createSeats(payload);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}
