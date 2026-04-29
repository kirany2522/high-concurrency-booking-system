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

  async bulkUpdateSeats(
    seatIds: string[],
    input: { price?: number; status?: SeatStatus },
  ) {
    logger.info("Admin bulk seat update started", {
      seatCount: seatIds.length,
      seatIds,
      fields: Object.keys(input),
    });

    const results = await Promise.all(
      seatIds.map(async (seatId) => {
        try {
          const seat = await this.updateSeat(seatId, input);
          return {
            seatId,
            status: "UPDATED" as const,
            seat,
          };
        } catch (error) {
          return {
            seatId,
            status: "FAILED" as const,
            error: {
              code: error instanceof AppError ? error.code : "SEAT_UPDATE_FAILED",
              message: error instanceof Error ? error.message : "Failed to update seat",
            },
          };
        }
      }),
    );

    const successCount = results.filter((item) => item.status === "UPDATED").length;
    const failureCount = results.length - successCount;
    const status = failureCount === 0 ? "SUCCESS" : successCount === 0 ? "FAILED" : "PARTIAL_SUCCESS";

    logger.info("Admin bulk seat update completed", {
      seatCount: seatIds.length,
      successCount,
      failureCount,
      status,
    });

    return {
      status,
      totalRequested: seatIds.length,
      successCount,
      failureCount,
      results,
    };
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

  async bulkDeleteSeats(seatIds: string[]) {
    logger.info("Admin bulk seat delete started", {
      seatCount: seatIds.length,
      seatIds,
    });

    const results = await Promise.all(
      seatIds.map(async (seatId) => {
        try {
          const seat = await this.deleteSeat(seatId);
          return {
            seatId,
            status: "DELETED" as const,
            seat,
          };
        } catch (error) {
          return {
            seatId,
            status: "FAILED" as const,
            error: {
              code: error instanceof AppError ? error.code : "SEAT_DELETE_FAILED",
              message: error instanceof Error ? error.message : "Failed to delete seat",
            },
          };
        }
      }),
    );

    const successCount = results.filter((item) => item.status === "DELETED").length;
    const failureCount = results.length - successCount;
    const status = failureCount === 0 ? "SUCCESS" : successCount === 0 ? "FAILED" : "PARTIAL_SUCCESS";

    logger.info("Admin bulk seat delete completed", {
      seatCount: seatIds.length,
      successCount,
      failureCount,
      status,
    });

    return {
      status,
      totalRequested: seatIds.length,
      successCount,
      failureCount,
      results,
    };
  },
};
