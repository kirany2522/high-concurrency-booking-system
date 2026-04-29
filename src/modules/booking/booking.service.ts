import { randomUUID } from "crypto";
import { BookingStatus, SeatStatus } from "@prisma/client";
import { prisma } from "../../infra/db/prisma";
import { redis } from "../../infra/redis/client";
import { AppError } from "../../utils/errors";
import { env } from "../../utils/env";

const LOCK_PREFIX = "seat:lock:";
const BOOKING_TTL_MS = 15 * 60 * 1000;

function lockKey(seatId: string) {
  return `${LOCK_PREFIX}${seatId}`;
}

export const bookingService = {
  async lockSeat(seatId: string) {
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      throw new AppError(404, "Seat not found");
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new AppError(409, "Seat is not available");
    }

    const token = randomUUID();
    const ttlMs = Number(env.LOCK_TTL_MS);
    const result = await redis.set(lockKey(seatId), token, "PX", ttlMs, "NX");

    if (result !== "OK") {
      throw new AppError(409, "Seat is already locked");
    }

    return {
      seatId,
      lockToken: token,
      ttlMs,
    };
  },

  async bookSeat(input: { seatId: string; userId: string; lockToken: string }) {
    const currentLock = await redis.get(lockKey(input.seatId));

    if (!currentLock || currentLock !== input.lockToken) {
      throw new AppError(409, "Seat lock is missing or invalid");
    }

    const seat = await prisma.seat.findUnique({
      where: { id: input.seatId },
    });

    if (!seat) {
      throw new AppError(404, "Seat not found");
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new AppError(409, "Seat is already booked");
    }

    const booking = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.seat.updateMany({
        where: {
          id: seat.id,
          status: SeatStatus.AVAILABLE,
          version: seat.version,
        },
        data: {
          status: SeatStatus.BOOKED,
          version: {
            increment: 1,
          },
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError(409, "Seat booking failed due to concurrent update");
      }

      return tx.booking.create({
        data: {
          userId: input.userId,
          seatId: seat.id,
          status: BookingStatus.CONFIRMED,
          expiresAt: new Date(Date.now() + BOOKING_TTL_MS),
        },
      });
    });

    await redis.del(lockKey(input.seatId));

    return booking;
  },
};

