import { Prisma, SeatStatus } from "@prisma/client";
import { prisma } from "../../infra/db/prisma";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/logger";

export const inventoryService = {
  async getAllSeats() {
    return prisma.seat.findMany({
      orderBy: {
        id: "asc",
      },
    });
  },

  async createSeats(input: { price: number; count?: number; status?: SeatStatus }) {
    const count = input.count ?? 1;
    const status = input.status ?? SeatStatus.AVAILABLE;

    logger.info("Creating seats in bulk", {
      price: input.price,
      count,
      status,
    });

    try {
      const result = await prisma.seat.createMany({
        data: Array.from({ length: count }, () => ({
          price: input.price,
          status,
        })),
      });

      return {
        createdCount: result.count,
        price: input.price,
        status,
      };
    } catch (error) {
      logger.error("Bulk seat insert failed", {
        price: input.price,
        count,
        status,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(500, "Failed to create seats", "BULK_SEAT_CREATE_FAILED");
    }
  },

  async updateSeat(
    seatId: string,
    input: { price?: number; status?: SeatStatus },
  ) {
    try {
      return await prisma.seat.update({
        where: {
          id: seatId,
        },
        data: {
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Seat not found", "SEAT_NOT_FOUND");
      }

      logger.error("Seat update failed", {
        seatId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(500, "Failed to update seat", "SEAT_UPDATE_FAILED");
    }
  },

  async deleteSeat(seatId: string) {
    try {
      return await prisma.seat.delete({
        where: {
          id: seatId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new AppError(404, "Seat not found", "SEAT_NOT_FOUND");
        }

        if (error.code === "P2003") {
          throw new AppError(
            409,
            "Seat cannot be deleted because it has related bookings",
            "SEAT_DELETE_CONFLICT",
          );
        }
      }

      logger.error("Seat delete failed", {
        seatId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(500, "Failed to delete seat", "SEAT_DELETE_FAILED");
    }
  },
};
