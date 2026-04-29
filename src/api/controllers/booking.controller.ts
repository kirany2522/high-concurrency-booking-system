import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { inventoryService } from "../../modules/inventory/inventory.service";
import { bookingService } from "../../modules/booking/booking.service";

const seatIdSchema = z.object({
  seatId: z.string().min(1),
});

const bookSchema = z.object({
  seatId: z.string().min(1),
  userId: z.string().min(1),
  lockToken: z.string().min(1),
});

export async function getSeats(_req: Request, res: Response, next: NextFunction) {
  try {
    const seats = await inventoryService.getAllSeats();
    res.json({ data: seats });
  } catch (error) {
    next(error);
  }
}

export async function lockSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const { seatId } = seatIdSchema.parse(req.body);
    const result = await bookingService.lockSeat(seatId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function bookSeat(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = bookSchema.parse(req.body);
    const booking = await bookingService.bookSeat(payload);
    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
}

